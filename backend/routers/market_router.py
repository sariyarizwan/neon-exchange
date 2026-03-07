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


@router.post("/tick")
async def trigger_tick():
    """Advance market simulation by one tick. Used for testing."""
    market_data_service.generate_tick()
    return {"status": "ticked"}


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
