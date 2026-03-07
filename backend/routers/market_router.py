from fastapi import APIRouter
import logging

from services.market_data import market_data_service
from memory.shared_state import shared_memory

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/state")
async def get_market_state():
    """Return current market state for all tickers."""
    tickers = market_data_service.get_all_tickers()
    market_state = {
        "tickers": [t.model_dump() for t in tickers],
        "market_mood": _compute_market_mood(tickers),
    }
    return market_state


@router.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    """Return detailed state for a single ticker."""
    ticker = market_data_service.get_ticker_state(symbol.upper())
    if ticker is None:
        return {"error": f"Ticker {symbol} not found"}
    history = market_data_service.get_price_history(symbol.upper())
    return {
        "ticker": ticker.model_dump(),
        "history": history,
    }


@router.get("/districts")
async def get_districts():
    """Return all district states with their tickers."""
    districts = {}
    for district_id, ticker_symbols in market_data_service.district_map.items():
        tickers = market_data_service.get_district_tickers(district_id)
        avg_change = sum(t.change_pct for t in tickers) / len(tickers) if tickers else 0
        districts[district_id] = {
            "district_id": district_id,
            "tickers": [t.model_dump() for t in tickers],
            "avg_change_pct": round(avg_change, 2),
            "mood": _district_mood(avg_change),
        }
    return districts


@router.get("/neon-state")
async def get_neon_state():
    """Return market data keyed by frontend neon ticker IDs.

    Maps backend real-symbol data to the frontend's fictional ticker format
    so the frontend can look up live prices by its own ticker IDs (nvx, qntm, etc.).
    """
    tickers = market_data_service.get_all_tickers()
    result: dict[str, dict] = {}
    for t in tickers:
        change = t.change_pct
        if change > 0.3:
            trend = "up"
        elif change < -0.3:
            trend = "down"
        else:
            trend = "flat"

        if abs(change) > 3:
            mood = "erratic"
        elif change > 0.5:
            mood = "confident"
        else:
            mood = "nervous"

        regime = "calm"
        if t.volatility_regime == "extreme":
            regime = "storm"
        elif t.volatility_regime in ("high", "normal"):
            regime = "choppy"

        result[t.neon_id] = {
            "neonId": t.neon_id,
            "neonSymbol": t.neon_symbol,
            "realSymbol": t.symbol,
            "name": t.name,
            "price": t.price,
            "changePct": t.change_pct,
            "volume": t.volume,
            "trend": trend,
            "mood": mood,
            "regime": regime,
            "momentum": t.momentum,
            "volatilityRegime": t.volatility_regime,
            "districtId": t.district_id,
            "sector": t.sector,
        }

    return {
        "tickers": result,
        "marketMood": _compute_market_mood(tickers),
        "isLive": market_data_service.is_live,
    }


@router.post("/tick")
async def trigger_tick():
    """Advance market simulation by one tick. Used for testing."""
    market_data_service.generate_tick()
    return {"status": "ticked"}


def _compute_market_mood(tickers) -> str:
    if not tickers:
        return "neutral"
    avg = sum(t.change_pct for t in tickers) / len(tickers)
    if avg > 2:
        return "euphoric"
    elif avg > 0.5:
        return "bullish"
    elif avg < -2:
        return "fearful"
    elif avg < -0.5:
        return "bearish"
    return "cautious"


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
