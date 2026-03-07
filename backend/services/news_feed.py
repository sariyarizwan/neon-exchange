"""News feed service: real headlines from Finnhub with mock template fallback.

Fetches general market news from Finnhub REST API. Maps headlines to sectors and
tickers using keyword matching. Falls back to template-based generation when the
API is unavailable.
"""

import logging
import os
import random
import time
from datetime import datetime, timedelta

import requests

from config.ticker_mapping import (
    TICKERS,
    DISTRICT_TICKERS,
    SECTOR_KEYWORDS,
    SECTOR_TO_DISTRICT,
    ALL_REAL_SYMBOLS,
    TickerConfig,
)

logger = logging.getLogger(__name__)


# Cyberpunk-themed source names for mock headlines
_MOCK_SOURCES = [
    "NeonWire", "CyberBloomberg", "Grid Financial", "DataPulse",
    "SynthReuters", "NightMarket Journal", "Circuit Street Daily",
    "HoloTrade Report",
]

# Sector key used internally (lowercase, matching Finnhub-era naming)
_SECTOR_KEY_MAP: dict[str, str] = {
    "Tech": "tech",
    "Financials": "finance",
    "Energy": "energy",
    "Industrials": "industrials",
    "Consumer": "consumer",
    "Crypto": "crypto",
    "Healthcare": "healthcare",
    "Telecom": "telecom",
}

# Compact mock templates for fallback (subset of originals)
_MOCK_TEMPLATES: dict[str, list[str]] = {
    "tech": [
        "{T} surges on AI chip demand as data-center spending soars",
        "{T} beats earnings estimates, shares jump in after-hours",
        "Semiconductor rally puts {T} at all-time high",
        "{T} cloud unit posts 40% YoY growth",
        "AI regulation fears weigh on {T} and peers",
    ],
    "finance": [
        "Fed signals rate pause, banks rally across the board",
        "{T} posts record trading revenue in volatile quarter",
        "Banking sector lifts as yield curve steepens",
        "Net interest margins widen, lifting {T} outlook",
        "{T} raises dividend by 12%, signals confidence",
    ],
    "energy": [
        "Oil prices climb on OPEC+ supply cut extension",
        "{T} boosts capital return with special dividend",
        "Natural gas rally lifts {T} and sector peers",
        "Refining margins expand, boosting {T} quarterly profit",
        "Geopolitical tensions push crude above $90, {T} benefits",
    ],
    "industrials": [
        "Infrastructure spending bill lifts {T} and peers",
        "{T} reports record backlog on equipment demand",
        "Supply chain improvements boost {T} margins",
        "Logistics surge drives {T} revenue beat",
        "{T} raises full-year guidance on construction boom",
    ],
    "consumer": [
        "Holiday spending tops forecasts, {T} leads gainers",
        "{T} same-store sales beat expectations",
        "Consumer confidence rises, lifting {T} outlook",
        "{T} expands loyalty program, membership jumps 15%",
        "E-commerce growth accelerates at {T}",
    ],
    "crypto": [
        "Bitcoin breaks $100K, {T} shares soar on volume surge",
        "{T} reports record transaction revenue as crypto rallies",
        "SEC crypto framework boosts {T} regulatory clarity",
        "Institutional adoption accelerates, {T} sees record inflows",
        "Hash rate hits all-time high, benefiting {T} miners",
    ],
    "healthcare": [
        "{T} wins FDA approval for blockbuster cancer drug",
        "{T} reports positive Phase 3 trial results",
        "Hospital spending growth lifts {T} medical devices unit",
        "Analyst raises {T} target on oncology pipeline depth",
        "{T} partners with AI startup for drug discovery",
    ],
    "telecom": [
        "5G rollout accelerates, boosting {T} subscriber growth",
        "{T} ad revenue surges on engagement gains",
        "{T} broadband expansion clears regulatory hurdle",
        "Streaming competition heats up, {T} adjusts strategy",
        "Fiber deployment drives {T} revenue growth",
    ],
}

_SECTOR_TICKERS: dict[str, list[str]] = {}
for _tc in TICKERS:
    key = _SECTOR_KEY_MAP.get(_tc.sector, _tc.sector.lower())
    _SECTOR_TICKERS.setdefault(key, []).append(_tc.real_symbol)


def _classify_sector(headline: str) -> str:
    text = headline.lower()
    best_sector = "general"
    best_score = 0
    for sector, keywords in SECTOR_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_sector = _SECTOR_KEY_MAP.get(sector, sector.lower())
    return best_sector


def _extract_tickers(headline: str) -> list[str]:
    text = headline.upper()
    found: list[str] = []
    for sym in ALL_REAL_SYMBOLS:
        if sym in text:
            found.append(sym)
    return found


def _score_severity(headline: str) -> str:
    text = headline.lower()
    high_words = ["surge", "soar", "crash", "plunge", "record", "breaking",
                  "halt", "crisis", "probe", "fraud", "breach"]
    med_words = ["beat", "miss", "raise", "cut", "warn", "slip", "dip",
                 "rally", "jump", "upgrade", "downgrade"]
    high_count = sum(1 for w in high_words if w in text)
    med_count = sum(1 for w in med_words if w in text)
    if high_count >= 2:
        return "high"
    if high_count >= 1 or med_count >= 2:
        return "medium"
    return "low"


class NewsFeedService:
    """Fetches real financial news from Finnhub and falls back to mock templates."""

    def __init__(self) -> None:
        self._headlines: list[dict] = []
        self._finnhub_key: str = os.environ.get("FINNHUB_API_KEY", "")
        self._last_fetch: float = 0.0
        self._fetch_interval: float = 120.0  # seconds between Finnhub fetches
        self._mock_mode: bool = not bool(self._finnhub_key)

        if self._finnhub_key:
            self._fetch_real_news()

    # --- Finnhub news ---

    def _fetch_real_news(self) -> None:
        try:
            resp = requests.get(
                "https://finnhub.io/api/v1/news",
                params={"category": "general", "token": self._finnhub_key},
                timeout=10,
            )
            if resp.status_code != 200:
                logger.warning(f"Finnhub news returned {resp.status_code}")
                self._mock_mode = True
                return

            articles = resp.json()
            if not isinstance(articles, list) or not articles:
                logger.warning("Finnhub news returned empty list")
                self._mock_mode = True
                return

            new_items: list[dict] = []
            for article in articles[:25]:
                headline_text = article.get("headline", "")
                if not headline_text:
                    continue

                sector = _classify_sector(headline_text)
                tickers_found = _extract_tickers(headline_text)
                severity = _score_severity(headline_text)

                district_id = None
                for sec_name, dist_id in SECTOR_TO_DISTRICT.items():
                    if _SECTOR_KEY_MAP.get(sec_name, "") == sector:
                        district_id = dist_id
                        break

                entry = {
                    "headline": headline_text,
                    "sector": sector,
                    "tickers": tickers_found,
                    "severity": severity,
                    "source": article.get("source", "Unknown"),
                    "timestamp": article.get("datetime", time.time()),
                    "url": article.get("url", ""),
                    "district_id": district_id,
                }
                new_items.append(entry)

            if new_items:
                self._headlines.extend(new_items)
                if len(self._headlines) > 100:
                    self._headlines = self._headlines[-100:]
                self._last_fetch = time.time()
                self._mock_mode = False
                logger.info(f"Finnhub news: fetched {len(new_items)} articles")
            else:
                self._mock_mode = True

        except Exception as exc:
            logger.warning(f"Finnhub news fetch failed: {exc}")
            self._mock_mode = True

    def _fetch_company_news(self, symbol: str) -> list[dict]:
        if not self._finnhub_key:
            return []
        today = datetime.utcnow().strftime("%Y-%m-%d")
        week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        try:
            resp = requests.get(
                "https://finnhub.io/api/v1/company-news",
                params={
                    "symbol": symbol,
                    "from": week_ago,
                    "to": today,
                    "token": self._finnhub_key,
                },
                timeout=8,
            )
            if resp.status_code != 200:
                return []
            articles = resp.json()
            if not isinstance(articles, list):
                return []
            return articles[:5]
        except Exception:
            return []

    # --- Mock fallback ---

    def _generate_mock_headlines(self, n: int) -> list[dict]:
        sectors = list(_MOCK_TEMPLATES.keys())
        new_items: list[dict] = []

        for _ in range(n):
            sector = random.choice(sectors)
            tickers_pool = _SECTOR_TICKERS.get(sector, [])
            if not tickers_pool:
                continue
            primary = random.choice(tickers_pool)
            template = random.choice(_MOCK_TEMPLATES[sector])
            headline_text = template.replace("{T}", primary)

            affected = [primary]
            if random.random() < 0.3 and len(tickers_pool) > 1:
                extra = random.choice([t for t in tickers_pool if t != primary])
                affected.append(extra)

            entry = {
                "headline": headline_text,
                "sector": sector,
                "tickers": affected,
                "severity": random.choices(
                    ["low", "medium", "high"], weights=[0.5, 0.35, 0.15]
                )[0],
                "source": random.choice(_MOCK_SOURCES),
                "timestamp": time.time(),
                "url": "",
                "district_id": None,
            }
            new_items.append(entry)
            self._headlines.append(entry)

        return new_items

    # --- Public interface (preserved) ---

    def generate_headlines(self, n: int = 5) -> list[dict]:
        now = time.time()

        # Refresh real news if stale
        if self._finnhub_key and now - self._last_fetch > self._fetch_interval:
            self._fetch_real_news()

        # If we have real headlines, return the most recent ones
        if self._headlines and not self._mock_mode:
            return self._headlines[-n:]

        # Fall back to mock generation
        return self._generate_mock_headlines(n)

    def get_recent(self, n: int = 10) -> list[dict]:
        if not self._headlines:
            self._generate_mock_headlines(n)
        return self._headlines[-n:]

    @property
    def is_live(self) -> bool:
        return not self._mock_mode


# Module-level singleton
news_feed_service = NewsFeedService()
