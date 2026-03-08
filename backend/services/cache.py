"""Pre-computed snapshot cache for sub-millisecond API responses.

Background loop rebuilds a WorldSnapshot every 2 seconds. API handlers
read from the active snapshot pointer — zero computation at serve time.
Uses double-buffering with atomic pointer swap (CPython GIL guarantees
int assignment is atomic).
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field

from config.ticker_mapping import DISTRICTS, SECTOR_VOLATILITY
from services.market_data import market_data_service
from services.news_feed import news_feed_service
from services.signals import compute_all_signals

logger = logging.getLogger(__name__)


@dataclass
class WorldSnapshot:
    """Frozen point-in-time view of all market state, pre-serialized."""

    # Ticker data
    all_tickers: list[dict] = field(default_factory=list)
    all_tickers_json: str = "[]"

    # Per-district summaries
    district_summaries: dict[str, dict] = field(default_factory=dict)
    districts_json: str = "{}"

    # Full market state (tickers + mood)
    market_state: dict = field(default_factory=dict)
    market_state_json: str = "{}"

    # O(1) ticker lookup by real_symbol, neon_id, or neon_symbol
    ticker_lookup: dict[str, dict] = field(default_factory=dict)

    # Price history per real_symbol
    ticker_history: dict[str, list[dict]] = field(default_factory=dict)

    # News
    news_feed: list[dict] = field(default_factory=list)

    # Derived signals (populated by signals.py)
    signals: dict = field(default_factory=dict)

    # Neon-format data (frontend-ready, keyed by neon_id)
    neon_tickers: dict[str, dict] = field(default_factory=dict)
    neon_state: dict = field(default_factory=dict)
    neon_state_json: str = "{}"
    neon_stream_json: str = "{}"  # pre-serialized SSE payload

    # Rich district states (weather/traffic/mood/glow from signals)
    district_states: list[dict] = field(default_factory=list)

    # World bootstrap (full state for SSE)
    bootstrap: dict = field(default_factory=dict)
    bootstrap_json: str = "{}"

    # Sparklines: neon_id → list of last 20 prices (compact for frontend)
    sparklines: dict[str, list[float]] = field(default_factory=dict)

    # Diagnostics
    timestamp: float = 0.0
    rebuild_ms: float = 0.0


def _district_mood(avg_change: float) -> str:
    if avg_change > 2:
        return "euphoric"
    elif avg_change > 0.5:
        return "calm"
    elif avg_change < -2:
        return "panic"
    elif avg_change < -0.5:
        return "tense"
    return "calm"


def _market_mood(tickers: list[dict]) -> str:
    if not tickers:
        return "neutral"
    avg = sum(t.get("change_pct", 0) for t in tickers) / len(tickers)
    if avg > 2:
        return "euphoric"
    elif avg > 0.5:
        return "bullish"
    elif avg < -2:
        return "fearful"
    elif avg < -0.5:
        return "bearish"
    return "cautious"


def _neon_trend(change_pct: float) -> str:
    if change_pct > 0.3:
        return "up"
    elif change_pct < -0.3:
        return "down"
    return "flat"


def _neon_mood(change_pct: float) -> str:
    if abs(change_pct) > 3:
        return "erratic"
    elif change_pct > 0.5:
        return "confident"
    return "nervous"


def _neon_regime(volatility_regime: str) -> str:
    if volatility_regime == "extreme":
        return "storm"
    elif volatility_regime in ("high", "normal"):
        return "choppy"
    return "calm"


def _regime_to_weather(regime: str) -> str:
    return {"calm": "clear", "normal": "rain", "choppy": "fog", "storm": "storm"}.get(
        regime, "rain"
    )


def _volume_to_traffic(tickers: list[dict]) -> str:
    if not tickers:
        return "low"
    avg_vol = sum(t.get("volume", 0) for t in tickers) / len(tickers)
    if avg_vol > 3_000_000:
        return "gridlock"
    elif avg_vol > 1_500_000:
        return "heavy"
    elif avg_vol > 500_000:
        return "normal"
    return "low"


def _strength_to_glow(strength: float) -> float:
    """Normalize sector strength to 0-1 glow intensity."""
    # Map -5..+5 range to 0..1
    return max(0.0, min(1.0, (strength + 5) / 10))


class SnapshotCache:
    """Double-buffered cache with atomic swap for lock-free reads."""

    def __init__(self) -> None:
        self._snapshots = [WorldSnapshot(), WorldSnapshot()]
        self._active_idx: int = 0
        self._rebuild_count: int = 0
        self._task: asyncio.Task | None = None
        # Signal state for incremental computation
        self._prev_correlations: dict | None = None
        self._prev_correlation_time: float = 0.0
        self._prev_sector_ranks: dict[str, int] | None = None

    @property
    def snapshot(self) -> WorldSnapshot:
        return self._snapshots[self._active_idx]

    @property
    def rebuild_count(self) -> int:
        return self._rebuild_count

    async def start(self) -> None:
        """Initial rebuild + launch background loop."""
        self._rebuild()
        self._task = asyncio.get_event_loop().create_task(self._loop())
        logger.info("SnapshotCache started")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("SnapshotCache stopped")

    async def _loop(self) -> None:
        while True:
            try:
                await asyncio.sleep(2)
                await asyncio.to_thread(self._rebuild)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning(f"Cache rebuild failed: {exc}")

    def _rebuild(self) -> None:
        t0 = time.perf_counter()

        # Advance market prices
        market_data_service.generate_tick()

        # Build all ticker states
        ticker_states = market_data_service.get_all_tickers()
        all_tickers = [t.model_dump() for t in ticker_states]

        # Ticker lookup: index by real_symbol, neon_id, and neon_symbol
        ticker_lookup: dict[str, dict] = {}
        ticker_history: dict[str, list[dict]] = {}
        for td in all_tickers:
            sym = td.get("symbol", "")
            neon_id = td.get("neon_id", "")
            neon_sym = td.get("neon_symbol", "")
            history = market_data_service.get_price_history(sym, 50)
            entry = {**td, "history": history}
            ticker_lookup[sym] = entry
            if neon_id:
                ticker_lookup[neon_id] = entry
            if neon_sym:
                ticker_lookup[neon_sym] = entry
            ticker_history[sym] = history

        # District summaries
        district_summaries: dict[str, dict] = {}
        for dc in DISTRICTS:
            dist_tickers = [t for t in all_tickers if t.get("district_id") == dc.id]
            avg_change = (
                sum(t.get("change_pct", 0) for t in dist_tickers) / len(dist_tickers)
                if dist_tickers
                else 0.0
            )
            district_summaries[dc.id] = {
                "district_id": dc.id,
                "name": dc.name,
                "sector": dc.sector,
                "tickers": dist_tickers,
                "avg_change_pct": round(avg_change, 2),
                "mood": _district_mood(avg_change),
            }

        # Market state
        mood = _market_mood(all_tickers)
        now = time.time()
        market_state = {
            "tickers": all_tickers,
            "timestamp": now,
            "market_mood": mood,
        }

        # News
        news = news_feed_service.get_recent(10)

        # Signals
        now = time.time()
        correlation_age = now - self._prev_correlation_time
        signals = compute_all_signals(
            all_tickers=all_tickers,
            ticker_history=ticker_history,
            prev_sector_ranks=self._prev_sector_ranks,
            prev_correlations=self._prev_correlations,
            correlation_age_s=correlation_age,
        )
        # Cache signal state for next rebuild
        self._prev_correlations = signals.get("correlations")
        if correlation_age >= 30.0:
            self._prev_correlation_time = now
        self._prev_sector_ranks = {
            s: d["rank"] for s, d in signals.get("sector_strength", {}).items()
        }

        # --- Neon-format data (frontend-ready) ---
        # Build alliance map from correlations
        alliance_map: dict[str, list[str]] = {}
        corr_matrix = signals.get("correlations", {}).get("matrix", {})
        for sym in corr_matrix:
            pairs = [
                (other, r)
                for other, r in corr_matrix[sym].items()
                if other != sym and abs(r) > 0.3
            ]
            pairs.sort(key=lambda p: abs(p[1]), reverse=True)
            alliance_map[sym] = [p[0] for p in pairs[:3]]

        neon_tickers: dict[str, dict] = {}
        for td in all_tickers:
            neon_id = td.get("neon_id", "")
            if not neon_id:
                continue
            change = td.get("change_pct", 0)
            sym = td.get("symbol", "")
            neon_tickers[neon_id] = {
                "neonId": neon_id,
                "neonSymbol": td.get("neon_symbol", ""),
                "realSymbol": sym,
                "name": td.get("name", ""),
                "price": td.get("price", 0),
                "changePct": change,
                "volume": td.get("volume", 0),
                "trend": _neon_trend(change),
                "mood": _neon_mood(change),
                "regime": _neon_regime(td.get("volatility_regime", "normal")),
                "momentum": td.get("momentum", 0),
                "volatilityRegime": td.get("volatility_regime", "normal"),
                "districtId": td.get("district_id", ""),
                "sector": td.get("sector", ""),
                "alliances": alliance_map.get(sym, []),
            }

        # Sparklines: last 20 prices per neon_id (compact for frontend charts)
        sparklines: dict[str, list[float]] = {}
        for td in all_tickers:
            neon_id = td.get("neon_id", "")
            sym = td.get("symbol", "")
            if neon_id and sym in ticker_history:
                prices = [h["price"] for h in ticker_history[sym][-20:] if "price" in h]
                sparklines[neon_id] = prices
                # Attach to neon ticker for convenience
                if neon_id in neon_tickers:
                    neon_tickers[neon_id]["sparkline"] = prices

        neon_state = {
            "tickers": neon_tickers,
            "marketMood": mood,
            "isLive": market_data_service.is_live,
        }

        # Neon stream payload (compact — sent every 2s via SSE)
        # Includes district_states and signals for data-driven city visuals
        neon_stream_payload = {
            "tickers": neon_tickers,
            "news": news[:5],
            "tick": self._rebuild_count,
            "district_states": {
                ds["district_id"]: {
                    "weather": ds.get("weather", "clear"),
                    "traffic": ds.get("traffic", "normal"),
                    "mood": ds.get("mood", "calm"),
                    "glow_intensity": ds.get("glow_intensity", 0.5),
                }
                for ds in district_states
            },
            "signals": {
                "correlations": {
                    "top_positive": signals.get("correlations", {}).get("top_positive", [])[:10],
                    "top_negative": signals.get("correlations", {}).get("top_negative", [])[:5],
                },
                "sector_strength": signals.get("sector_strength", {}),
                "breadth": signals.get("breadth", {}),
                "regimes": signals.get("regimes", {}),
            },
        }

        # --- Rich district states (weather/traffic/mood/glow from signals) ---
        district_regimes = signals.get("regimes", {}).get("districts", {})
        sector_strength = signals.get("sector_strength", {})

        district_states: list[dict] = []
        for dc in DISTRICTS:
            dist_tickers = [t for t in all_tickers if t.get("district_id") == dc.id]
            regime = district_regimes.get(dc.id, "normal")
            strength = sector_strength.get(dc.sector, {}).get("strength", 0.0)

            district_states.append({
                "district_id": dc.id,
                "name": dc.name,
                "sector": dc.sector,
                "weather": _regime_to_weather(regime),
                "traffic": _volume_to_traffic(dist_tickers),
                "mood": district_summaries[dc.id]["mood"],
                "glow_intensity": round(_strength_to_glow(strength), 2),
                "active_tickers": [t.get("neon_id", "") for t in dist_tickers],
            })

        # Bootstrap (what SSE emits and /api/world/state returns)
        bootstrap = {
            "market_state": market_state,
            "districts": district_states,
            "scenarios": [],
            "recent_news": news,
        }

        # Pre-serialize
        all_tickers_json = json.dumps(all_tickers, default=str)
        districts_json = json.dumps(district_summaries, default=str)
        market_state_json = json.dumps(market_state, default=str)
        neon_state_json = json.dumps(neon_state, default=str)
        neon_stream_json = json.dumps(neon_stream_payload, default=str)
        bootstrap_json = json.dumps(bootstrap, default=str)

        rebuild_ms = (time.perf_counter() - t0) * 1000

        # Write to inactive buffer
        inactive = 1 - self._active_idx
        snap = self._snapshots[inactive]
        snap.all_tickers = all_tickers
        snap.all_tickers_json = all_tickers_json
        snap.district_summaries = district_summaries
        snap.districts_json = districts_json
        snap.market_state = market_state
        snap.market_state_json = market_state_json
        snap.ticker_lookup = ticker_lookup
        snap.ticker_history = ticker_history
        snap.news_feed = news
        snap.signals = signals
        snap.neon_tickers = neon_tickers
        snap.neon_state = neon_state
        snap.neon_state_json = neon_state_json
        snap.neon_stream_json = neon_stream_json
        snap.district_states = district_states
        snap.bootstrap = bootstrap
        snap.bootstrap_json = bootstrap_json
        snap.sparklines = sparklines
        snap.timestamp = now
        snap.rebuild_ms = rebuild_ms

        # Atomic swap
        self._active_idx = inactive
        self._rebuild_count += 1

        if self._rebuild_count % 30 == 1:
            logger.info(
                f"Cache rebuild #{self._rebuild_count}: {rebuild_ms:.1f}ms, "
                f"{len(all_tickers)} tickers, live={market_data_service.is_live}"
            )


# Module-level singleton
snapshot_cache = SnapshotCache()
