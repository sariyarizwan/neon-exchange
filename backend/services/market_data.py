"""Market data service providing mock stock data for the Neon Exchange cyberpunk city."""

import random
import time
from pydantic import BaseModel, Field
from typing import Literal, Optional


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


TICKER_NAMES = {
    "AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA", "GOOG": "Alphabet", "META": "Meta",
    "JPM": "JPMorgan", "GS": "Goldman Sachs", "BAC": "Bank of America", "MS": "Morgan Stanley", "WFC": "Wells Fargo",
    "XOM": "ExxonMobil", "CVX": "Chevron", "COP": "ConocoPhillips", "SLB": "Schlumberger", "EOG": "EOG Resources",
    "JNJ": "Johnson & Johnson", "PFE": "Pfizer", "UNH": "UnitedHealth", "ABBV": "AbbVie", "MRK": "Merck",
    "COIN": "Coinbase", "SQ": "Block", "PYPL": "PayPal", "MARA": "Marathon Digital", "RIOT": "Riot Platforms",
}

DISTRICT_CONFIG = {
    "chip_docks": {
        "sector": "tech",
        "tickers": {"AAPL": 178.50, "MSFT": 415.20, "NVDA": 875.40, "GOOG": 141.80, "META": 505.60},
    },
    "bank_towers": {
        "sector": "finance",
        "tickers": {"JPM": 198.30, "GS": 412.70, "BAC": 35.40, "MS": 92.15, "WFC": 55.80},
    },
    "energy_yard": {
        "sector": "energy",
        "tickers": {"XOM": 104.20, "CVX": 155.60, "COP": 118.90, "SLB": 52.30, "EOG": 124.50},
    },
    "pharma_heights": {
        "sector": "healthcare",
        "tickers": {"JNJ": 156.40, "PFE": 27.80, "UNH": 528.90, "ABBV": 174.30, "MRK": 125.70},
    },
    "crypto_alley": {
        "sector": "crypto",
        "tickers": {"COIN": 225.40, "SQ": 78.60, "PYPL": 63.20, "MARA": 22.50, "RIOT": 15.80},
    },
}

SECTOR_VOLATILITY = {
    "tech": 0.0025,
    "finance": 0.0018,
    "energy": 0.0022,
    "healthcare": 0.0015,
    "crypto": 0.0045,
}


class MarketDataService:
    """Provides mock stock market data with realistic random-walk price movement."""

    def __init__(self) -> None:
        self._prices: dict[str, float] = {}
        self._base_prices: dict[str, float] = {}
        self._prev_close: dict[str, float] = {}
        self._volumes: dict[str, int] = {}
        self._highs: dict[str, float] = {}
        self._lows: dict[str, float] = {}
        self._history: dict[str, list[dict]] = {}
        self._symbol_district: dict[str, str] = {}
        self._symbol_sector: dict[str, str] = {}

        # Public district map for routers
        self.district_map: dict[str, list[str]] = {}

        self._initialize()

    def _initialize(self) -> None:
        for district_id, config in DISTRICT_CONFIG.items():
            sector = config["sector"]
            symbols = []
            for symbol, base_price in config["tickers"].items():
                self._base_prices[symbol] = base_price
                self._prices[symbol] = base_price
                self._prev_close[symbol] = base_price
                self._volumes[symbol] = random.randint(500_000, 5_000_000)
                self._highs[symbol] = base_price
                self._lows[symbol] = base_price
                self._history[symbol] = [{"price": base_price, "timestamp": time.time()}]
                self._symbol_district[symbol] = district_id
                self._symbol_sector[symbol] = sector
                symbols.append(symbol)
            self.district_map[district_id] = symbols

    def generate_tick(self) -> None:
        """Advance all prices by one tick using a random walk with mean reversion."""
        now = time.time()
        for symbol in self._prices:
            sector = self._symbol_sector[symbol]
            volatility = SECTOR_VOLATILITY[sector]
            base = self._base_prices[symbol]
            current = self._prices[symbol]

            drift = 0.002 * (base - current) / base
            shock = random.gauss(0, volatility)
            pct_change = drift + shock
            new_price = round(current * (1 + pct_change), 2)
            new_price = max(new_price, base * 0.5)
            new_price = min(new_price, base * 2.0)

            self._prices[symbol] = new_price
            if new_price > self._highs[symbol]:
                self._highs[symbol] = new_price
            if new_price < self._lows[symbol]:
                self._lows[symbol] = new_price

            self._volumes[symbol] += random.randint(1_000, 50_000)

            self._history[symbol].append({"price": new_price, "timestamp": now})
            if len(self._history[symbol]) > 500:
                self._history[symbol] = self._history[symbol][-500:]

    def get_ticker_state(self, symbol: str) -> Optional[TickerState]:
        if symbol not in self._prices:
            return None

        price = self._prices[symbol]
        prev = self._prev_close[symbol]
        change_pct = round(((price - prev) / prev) * 100, 2) if prev else 0.0

        # Derive trend and momentum from change
        if change_pct > 1.0:
            trend = "bullish"
        elif change_pct < -1.0:
            trend = "bearish"
        else:
            trend = "neutral"

        momentum = max(-1.0, min(1.0, change_pct / 5.0))

        # Volatility regime from recent history
        hist = self._history.get(symbol, [])
        if len(hist) >= 10:
            recent_prices = [h["price"] for h in hist[-10:]]
            avg = sum(recent_prices) / len(recent_prices)
            variance = sum((p - avg) ** 2 for p in recent_prices) / len(recent_prices)
            vol_pct = (variance ** 0.5) / avg * 100
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
            symbol=symbol,
            name=TICKER_NAMES.get(symbol, symbol),
            sector=self._symbol_sector[symbol],
            district_id=self._symbol_district[symbol],
            price=price,
            change_pct=change_pct,
            volume=self._volumes[symbol],
            trend=trend,
            momentum=round(momentum, 3),
            volatility_regime=vol_regime,
        )

    def get_all_tickers(self) -> list[TickerState]:
        return [
            self.get_ticker_state(s)
            for s in sorted(self._prices)
            if self.get_ticker_state(s) is not None
        ]

    def get_district_tickers(self, district_id: str) -> list[TickerState]:
        symbols = self.district_map.get(district_id, [])
        return [
            self.get_ticker_state(s)
            for s in sorted(symbols)
            if self.get_ticker_state(s) is not None
        ]

    def get_price_history(self, symbol: str, periods: int = 20) -> list[dict]:
        history = self._history.get(symbol, [])
        return history[-periods:]


# Module-level singleton
market_data_service = MarketDataService()
