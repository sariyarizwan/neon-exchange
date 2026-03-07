"""Market data service: real data from Finnhub with mock random-walk fallback.

Fetches live quotes from Finnhub REST API every ~30 seconds. Between refreshes,
applies tiny perturbations so the city always feels alive. Falls back to a
seeded random walk if the API key is missing or the market is closed.
"""

import logging
import os
import random
import time
from typing import Literal, Optional

import requests
from pydantic import BaseModel, Field

from config.ticker_mapping import (
    TICKERS,
    TICKER_BY_ID,
    TICKER_BY_REAL,
    DISTRICT_TICKERS,
    ALL_REAL_SYMBOLS,
    SECTOR_VOLATILITY,
    TickerConfig,
)

logger = logging.getLogger(__name__)


class TickerState(BaseModel):
    symbol: str
    name: str = ""
    sector: str = ""
    district_id: str = ""
    price: float = 0.0
    change_pct: float = 0.0
    volume: int = 0
    trend: Literal["bullish", "bearish", "neutral"] = "neutral"
    momentum: float = Field(default=0.0, ge=-1.0, le=1.0)
    volatility_regime: Literal["low", "normal", "high", "extreme"] = "normal"
    neon_id: str = ""
    neon_symbol: str = ""


# Fallback prices used when Finnhub is unavailable or returns 0
_FALLBACK_PRICES: dict[str, float] = {
    "NVDA": 130.50, "AMD": 120.80, "INTC": 24.30,
    "JPM": 245.60, "BAC": 44.20, "GS": 580.10,
    "XOM": 108.40, "NEE": 76.90, "CVX": 155.20,
    "CAT": 355.70, "UPS": 130.40, "DE": 395.80,
    "AMZN": 205.30, "NKE": 72.50, "MCD": 295.60,
    "COIN": 260.40, "MARA": 18.90, "SQ": 82.10,
    "JNJ": 160.20, "MDT": 88.50, "MRNA": 38.70,
    "META": 605.40, "T": 27.60,
}


class _CachedQuote:
    __slots__ = ("price", "prev_close", "high", "low", "volume", "timestamp", "history")

    def __init__(self, price: float, prev_close: float, volume: int,
                 high: float, low: float, timestamp: float) -> None:
        self.price = price
        self.prev_close = prev_close
        self.high = high
        self.low = low
        self.volume = volume
        self.timestamp = timestamp
        self.history: list[dict] = [{"price": price, "timestamp": timestamp}]


class MarketDataService:
    """Provides real stock market data from Finnhub with mock fallback."""

    def __init__(self) -> None:
        self._finnhub_key: str = os.environ.get("FINNHUB_API_KEY", "")
        self._cache: dict[str, _CachedQuote] = {}
        self._last_full_refresh: float = 0.0
        self._refresh_interval: float = 30.0
        self._mock_mode: bool = False
        self._refresh_batch_idx: int = 0

        self.district_map: dict[str, list[str]] = {}

        self._initialize()

    def _initialize(self) -> None:
        now = time.time()
        for district_id, tickers in DISTRICT_TICKERS.items():
            symbols: list[str] = []
            for tc in tickers:
                fallback = _FALLBACK_PRICES.get(tc.real_symbol, 100.0)
                self._cache[tc.real_symbol] = _CachedQuote(
                    price=fallback, prev_close=fallback,
                    volume=random.randint(500_000, 5_000_000),
                    high=fallback, low=fallback, timestamp=now,
                )
                symbols.append(tc.real_symbol)
            self.district_map[district_id] = symbols

        if self._finnhub_key:
            self._fetch_all_quotes()
        else:
            logger.warning("No FINNHUB_API_KEY — running in mock mode")
            self._mock_mode = True

    # --- Finnhub integration ---

    def _fetch_quote(self, real_symbol: str) -> Optional[dict]:
        try:
            resp = requests.get(
                "https://finnhub.io/api/v1/quote",
                params={"symbol": real_symbol, "token": self._finnhub_key},
                timeout=5,
            )
            if resp.status_code == 429:
                logger.warning("Finnhub rate limit hit, backing off")
                return None
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("c", 0) <= 0:
                return None
            return data
        except Exception as exc:
            logger.debug(f"Quote fetch failed for {real_symbol}: {exc}")
            return None

    def _apply_quote(self, real_symbol: str, data: dict, now: float) -> None:
        cached = self._cache.get(real_symbol)
        if not cached:
            return
        c = data["c"]
        cached.price = c
        cached.prev_close = data.get("pc", c) or c
        cached.high = data.get("h", c) or c
        cached.low = data.get("l", c) or c
        cached.timestamp = now
        cached.history.append({"price": c, "timestamp": now})
        if len(cached.history) > 500:
            cached.history = cached.history[-500:]

    def _fetch_all_quotes(self) -> None:
        if not self._finnhub_key:
            return
        now = time.time()
        fetched = 0
        for tc in TICKERS:
            data = self._fetch_quote(tc.real_symbol)
            if data:
                self._apply_quote(tc.real_symbol, data, now)
                fetched += 1
            time.sleep(0.08)  # ~12 req/s to stay under 60/min bursts

        if fetched > 0:
            self._last_full_refresh = now
            self._mock_mode = False
            logger.info(f"Finnhub: fetched {fetched}/{len(TICKERS)} quotes")
        else:
            logger.warning("Finnhub: no quotes fetched — falling back to mock")
            self._mock_mode = True

    def _fetch_batch(self, batch_size: int = 5) -> None:
        if not self._finnhub_key:
            return
        now = time.time()
        start = self._refresh_batch_idx
        batch = TICKERS[start:start + batch_size]
        if not batch:
            self._refresh_batch_idx = 0
            batch = TICKERS[:batch_size]

        for tc in batch:
            data = self._fetch_quote(tc.real_symbol)
            if data:
                self._apply_quote(tc.real_symbol, data, now)
            time.sleep(0.08)

        self._refresh_batch_idx = (start + batch_size) % len(TICKERS)

    # --- Tick logic ---

    def generate_tick(self) -> None:
        now = time.time()

        # Periodically refresh real data
        if not self._mock_mode and self._finnhub_key:
            if now - self._last_full_refresh > self._refresh_interval:
                try:
                    self._fetch_batch(batch_size=5)
                    self._last_full_refresh = now
                except Exception as exc:
                    logger.warning(f"Batch refresh failed: {exc}")

        # Apply micro-perturbations
        for tc in TICKERS:
            cached = self._cache.get(tc.real_symbol)
            if not cached:
                continue

            vol = SECTOR_VOLATILITY.get(tc.sector, 0.002)
            if self._mock_mode:
                drift = 0.001 * random.choice([-1, 0, 1])
                shock = random.gauss(0, vol)
            else:
                shock = random.gauss(0, vol * 0.25)
                drift = 0.0

            new_price = round(cached.price * (1 + drift + shock), 2)

            if cached.prev_close > 0:
                cap = cached.prev_close * 0.15
                new_price = max(cached.prev_close - cap,
                                min(cached.prev_close + cap, new_price))
            new_price = max(0.01, new_price)

            cached.price = new_price
            if new_price > cached.high:
                cached.high = new_price
            if new_price < cached.low:
                cached.low = new_price
            cached.volume += random.randint(1_000, 50_000)
            cached.history.append({"price": new_price, "timestamp": now})
            if len(cached.history) > 500:
                cached.history = cached.history[-500:]

    # --- Public accessors (interface preserved) ---

    def get_ticker_state(self, symbol: str) -> Optional[TickerState]:
        tc = TICKER_BY_REAL.get(symbol.upper())
        if not tc:
            tc = TICKER_BY_ID.get(symbol.lower())
        if not tc:
            return None

        cached = self._cache.get(tc.real_symbol)
        if not cached:
            return None

        price = cached.price
        prev = cached.prev_close
        change_pct = round(((price - prev) / prev) * 100, 2) if prev > 0 else 0.0

        if change_pct > 1.0:
            trend = "bullish"
        elif change_pct < -1.0:
            trend = "bearish"
        else:
            trend = "neutral"

        momentum = max(-1.0, min(1.0, change_pct / 5.0))

        hist = cached.history
        if len(hist) >= 10:
            recent = [h["price"] for h in hist[-10:]]
            avg = sum(recent) / len(recent)
            var = sum((p - avg) ** 2 for p in recent) / len(recent)
            vol_pct = (var ** 0.5) / avg * 100 if avg > 0 else 0
            if vol_pct > 3:
                vol_regime = "extreme"
            elif vol_pct > 1.5:
                vol_regime = "high"
            elif vol_pct > 0.5:
                vol_regime = "normal"
            else:
                vol_regime = "low"
        else:
            vol_regime = "normal"

        return TickerState(
            symbol=tc.real_symbol,
            name=tc.full_name,
            sector=tc.sector,
            district_id=tc.district_id,
            price=price,
            change_pct=change_pct,
            volume=cached.volume,
            trend=trend,
            momentum=round(momentum, 3),
            volatility_regime=vol_regime,
            neon_id=tc.id,
            neon_symbol=tc.symbol,
        )

    def get_all_tickers(self) -> list[TickerState]:
        results: list[TickerState] = []
        for tc in TICKERS:
            state = self.get_ticker_state(tc.real_symbol)
            if state is not None:
                results.append(state)
        return results

    def get_district_tickers(self, district_id: str) -> list[TickerState]:
        symbols = self.district_map.get(district_id, [])
        results: list[TickerState] = []
        for s in symbols:
            state = self.get_ticker_state(s)
            if state is not None:
                results.append(state)
        return results

    def get_price_history(self, symbol: str, periods: int = 20) -> list[dict]:
        tc = TICKER_BY_REAL.get(symbol.upper()) or TICKER_BY_ID.get(symbol.lower())
        if not tc:
            return []
        cached = self._cache.get(tc.real_symbol)
        if not cached:
            return []
        return cached.history[-periods:]

    @property
    def is_live(self) -> bool:
        return not self._mock_mode


# Module-level singleton
market_data_service = MarketDataService()
