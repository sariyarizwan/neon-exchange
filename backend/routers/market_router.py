import time

from fastapi import APIRouter
import logging

from services.cache import snapshot_cache
from services.market_data import market_data_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/state")
async def get_market_state():
    """Return current market state for all tickers (from pre-computed cache)."""
    return snapshot_cache.snapshot.market_state


@router.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    """Return detailed state for a single ticker (O(1) cache lookup)."""
    entry = snapshot_cache.snapshot.ticker_lookup.get(symbol.upper())
    if entry is None:
        entry = snapshot_cache.snapshot.ticker_lookup.get(symbol.lower())
    if entry is None:
        return {"error": f"Ticker {symbol} not found"}
    return {"ticker": entry}


@router.get("/districts")
async def get_districts():
    """Return all district states with their tickers (pre-computed)."""
    return snapshot_cache.snapshot.district_summaries


@router.get("/neon-state")
async def get_neon_state():
    """Return market data keyed by frontend neon ticker IDs (from pre-computed cache).

    Maps backend real-symbol data to the frontend's fictional ticker format
    so the frontend can look up live prices by its own ticker IDs (nvx, qntm, etc.).
    """
    return snapshot_cache.snapshot.neon_state


@router.post("/tick")
async def trigger_tick():
    """Advance market simulation by one tick. Used for testing."""
    market_data_service.generate_tick()
    return {"status": "ticked"}


@router.get("/signals")
async def get_signals():
    """Return derived market signals: correlations, sector strength, regimes, breadth."""
    snap = snapshot_cache.snapshot
    signals = snap.signals
    # Return a summary without the full correlation matrix (too large for casual use)
    return {
        "top_correlations": signals.get("top_correlations", []),
        "sector_strength": signals.get("sector_strength", {}),
        "regimes": signals.get("regimes", {}),
        "breadth": signals.get("breadth", {}),
        "computed_at": signals.get("computed_at"),
    }


@router.get("/sparklines")
async def get_sparklines():
    """Return last 20 prices per neon ticker ID for mini-charts."""
    return snapshot_cache.snapshot.sparklines


@router.get("/debug/cache-stats")
async def cache_stats():
    """Diagnostics: cache age, rebuild time, data source status."""
    snap = snapshot_cache.snapshot
    return {
        "snapshot_age_s": round(time.time() - snap.timestamp, 2),
        "rebuild_ms": round(snap.rebuild_ms, 2),
        "rebuild_count": snapshot_cache.rebuild_count,
        "tickers_cached": len(snap.all_tickers),
        "districts_cached": len(snap.district_summaries),
        "news_cached": len(snap.news_feed),
        "market_live": market_data_service.is_live,
        "signals_keys": list(snap.signals.keys()),
    }
