from pydantic import BaseModel, Field
from typing import Literal


class TickerState(BaseModel):
    symbol: str
    name: str
    sector: str
    district_id: str
    price: float
    change_pct: float
    volume: int
    trend: Literal["bullish", "bearish", "neutral"]
    momentum: float = Field(ge=-1.0, le=1.0)
    volatility_regime: Literal["low", "normal", "high", "extreme"]
    neon_id: str = ""
    neon_symbol: str = ""


class MarketState(BaseModel):
    tickers: list[TickerState]
    timestamp: str = ""
    market_mood: str
