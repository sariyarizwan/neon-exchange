"""News feed service providing mock financial headlines for the Neon Exchange."""

import random
import time
from typing import Optional


# Headline templates per sector.
# {T} is replaced with a random ticker from that sector.
HEADLINE_TEMPLATES: dict[str, list[str]] = {
    "tech": [
        "{T} surges on AI chip demand as data-center spending soars",
        "{T} beats earnings estimates, shares jump in after-hours trading",
        "{T} announces $10B stock buyback program",
        "{T} unveils next-gen processor, analysts raise price targets",
        "{T} faces antitrust probe in EU, shares dip",
        "Cloud revenue growth drives {T} to record quarter",
        "{T} acquires robotics startup for $2.4B",
        "Chip shortage easing lifts outlook for {T}",
        "{T} partners with defense contractor on AI systems",
        "{T} stock slides on weaker-than-expected guidance",
        "Analysts upgrade {T} citing strong ad revenue momentum",
        "{T} launches mixed-reality headset, market reacts",
        "{T} CFO signals margin expansion ahead",
        "Semiconductor rally puts {T} at all-time high",
        "{T} data breach reports spark sell-off",
        "{T} expands into quantum computing research",
        "AI regulation fears weigh on {T} and peers",
        "{T} hires former government cyber chief as CSO",
        "{T} cloud unit posts 40% YoY growth",
        "{T} cuts 5% of workforce in restructuring push",
        "Street raises {T} target on autonomous vehicle progress",
        "{T} developer conference reveals new API platform",
        "{T} insider selling triggers analyst concern",
        "{T} reports record services revenue",
        "Supply chain improvements boost {T} margins",
        "{T} wins major government cloud contract",
        "Options activity surges in {T} ahead of earnings",
        "{T} CEO outlines 5-year AI roadmap",
        "{T} faces patent lawsuit from rival chipmaker",
        "{T} shares rally on inclusion in major index",
    ],
    "finance": [
        "Fed signals rate pause, banks rally across the board",
        "{T} posts record trading revenue in volatile quarter",
        "{T} raises dividend by 12%, signals confidence",
        "Banking sector lifts as yield curve steepens",
        "{T} announces merger with regional bank",
        "{T} wealth management unit sees record inflows",
        "Stress test results boost {T} and peers",
        "{T} CEO warns of commercial real-estate headwinds",
        "{T} expands into digital asset custody",
        "Net interest margins widen, lifting {T} outlook",
        "{T} cuts bonus pool amid deal-making slowdown",
        "Investment banking fees rebound for {T}",
        "{T} fined $200M over compliance failures",
        "Consumer lending growth supports {T} earnings beat",
        "{T} rolls out AI-powered fraud detection system",
        "Rate-cut expectations push {T} shares lower",
        "{T} announces strategic review of retail unit",
        "Credit quality holds steady at {T}, easing fears",
        "{T} fixed-income desk posts best quarter in 3 years",
        "Regional banking concerns drag on {T} sentiment",
        "{T} launches sustainable finance initiative",
        "Mortgage originations climb at {T}",
        "{T} CFO sees loan growth accelerating next quarter",
        "Analysts downgrade {T} on exposure to office loans",
        "{T} reports surge in mobile banking adoption",
        "Private equity deal flow lifts {T} advisory revenue",
        "{T} sets aside $1B for credit reserves",
        "Treasury volatility boosts {T} trading desks",
        "{T} eyes expansion into Asian wealth market",
        "{T} shares jump on better-than-expected provisions",
    ],
    "energy": [
        "Oil prices climb on OPEC+ supply cut extension",
        "{T} boosts capital return with special dividend",
        "{T} strikes high-yield discovery in Permian Basin",
        "Natural gas rally lifts {T} and sector peers",
        "{T} CEO pledges carbon neutrality by 2040",
        "Geopolitical tensions push crude above $90, {T} benefits",
        "{T} shuts Gulf operations ahead of hurricane season",
        "Refining margins expand, boosting {T} quarterly profit",
        "{T} announces $3B renewable energy investment",
        "Energy sector sell-off drags {T} to 3-month low",
        "{T} acquires deepwater assets in $5B deal",
        "Drilling efficiency gains cut costs for {T}",
        "{T} reports record free cash flow",
        "LNG export demand supports {T} production growth",
        "{T} faces environmental lawsuit in Gulf region",
        "OPEC meeting outcome sends {T} shares higher",
        "{T} partners with utility on hydrogen pilot project",
        "Analyst upgrades {T} on improving oil fundamentals",
        "{T} divests non-core assets to focus on shale",
        "Pipeline expansion clears regulatory hurdle for {T}",
        "{T} production tops estimates on Permian strength",
        "Wind and solar pivot earns {T} ESG fund interest",
        "{T} raises full-year guidance on strong demand",
        "Oil inventory drawdown supports {T} bull case",
        "{T} reduces methane emissions by 30%",
        "Service sector tightness benefits {T} pricing power",
        "{T} warns of capex inflation in upcoming cycle",
        "Strategic reserve release weighs on {T} near-term",
        "{T} inks long-term LNG supply deal with Europe",
        "{T} shares volatile after mixed production report",
    ],
    "healthcare": [
        "{T} wins FDA approval for blockbuster cancer drug",
        "{T} beats earnings on strong pharma segment",
        "Drug pricing reform fears hit {T} and sector",
        "{T} acquires biotech firm for rare-disease pipeline",
        "{T} raises guidance after strong prescription trends",
        "Patent cliff concerns weigh on {T} outlook",
        "{T} reports positive Phase 3 trial results",
        "Medicare negotiation list rattles {T} investors",
        "{T} launches biosimilar, opening new revenue stream",
        "Hospital spending growth lifts {T} medical devices unit",
        "{T} announces $4B share repurchase program",
        "Obesity drug competition heats up, {T} adjusts strategy",
        "{T} COVID treatment demand fades, diversification key",
        "Analyst raises {T} target on oncology pipeline depth",
        "{T} partners with AI startup for drug discovery",
        "Vaccine revenue decline pressures {T} top line",
        "{T} expands manufacturing capacity in Ireland",
        "Health insurers push back on {T} pricing",
        "{T} divests consumer health unit to focus on Rx",
        "Clinical trial setback sends {T} shares down 5%",
        "{T} CEO highlights gene therapy potential",
        "Aging population trends underpin {T} long-term thesis",
        "{T} faces generic competition on key franchise",
        "MedTech innovation drives {T} surgical robotics growth",
        "{T} settles opioid litigation for $1.5B",
        "Regulatory pathway clears for {T} Alzheimer's therapy",
        "{T} dividend yield attracts income investors",
        "Biotech index rally lifts {T} sentiment",
        "{T} reports record international revenue growth",
        "{T} pipeline update impresses at medical conference",
    ],
    "crypto": [
        "Bitcoin breaks $100K, {T} shares soar on volume surge",
        "{T} reports record transaction revenue as crypto rallies",
        "SEC crypto framework boosts {T} regulatory clarity",
        "{T} expands staking services, recurring revenue grows",
        "Crypto winter fears ease, lifting {T} and peers",
        "{T} partners with major bank on custody solution",
        "Hash rate hits all-time high, benefiting {T} miners",
        "{T} faces SEC scrutiny over token listings",
        "Institutional adoption accelerates, {T} sees record inflows",
        "Bitcoin halving anticipation drives {T} rally",
        "{T} launches layer-2 scaling platform",
        "DeFi resurgence supports {T} trading volumes",
        "{T} stock surges on Bitcoin ETF flow data",
        "Mining profitability improves for {T} after difficulty drop",
        "{T} expands into international markets",
        "Crypto regulation bill advances, {T} reacts positively",
        "{T} announces AI-powered trading analytics product",
        "Ethereum upgrade lifts sentiment for {T}",
        "Payment volume surges at {T} on merchant adoption",
        "{T} reduces operating costs through energy efficiency",
        "Stablecoin integration drives {T} payments growth",
        "{T} CFO highlights path to profitability",
        "Blockchain gaming boom lifts {T} platform revenue",
        "{T} forms advisory board with former regulators",
        "Crypto market cap tops $3T, {T} hits 52-week high",
        "{T} acquires compliance startup to strengthen KYC",
        "Lightning Network growth benefits {T} payment rails",
        "{T} mining fleet expansion on track for Q2",
        "NFT marketplace revenue surprises at {T}",
        "{T} shares dip on profit-taking after 40% monthly run",
    ],
}

SECTOR_TICKERS: dict[str, list[str]] = {
    "tech": ["AAPL", "MSFT", "NVDA", "GOOG", "META"],
    "finance": ["JPM", "GS", "BAC", "MS", "WFC"],
    "energy": ["XOM", "CVX", "COP", "SLB", "EOG"],
    "healthcare": ["JNJ", "PFE", "UNH", "ABBV", "MRK"],
    "crypto": ["COIN", "SQ", "PYPL", "MARA", "RIOT"],
}

NEWS_SOURCES = [
    "NeonWire",
    "CyberBloomberg",
    "Grid Financial",
    "DataPulse",
    "SynthReuters",
    "NightMarket Journal",
    "Circuit Street Daily",
    "HoloTrade Report",
]


class NewsFeedService:
    """Generates and stores mock financial news headlines."""

    def __init__(self) -> None:
        self._headlines: list[dict] = []

    def generate_headlines(self, n: int = 5) -> list[dict]:
        """Generate *n* random headlines and store them internally.

        Returns the newly created headlines.
        """
        new_headlines: list[dict] = []
        sectors = list(HEADLINE_TEMPLATES.keys())

        for _ in range(n):
            sector = random.choice(sectors)
            tickers_pool = SECTOR_TICKERS[sector]
            primary_ticker = random.choice(tickers_pool)

            template = random.choice(HEADLINE_TEMPLATES[sector])
            headline_text = template.replace("{T}", primary_ticker)

            # Determine affected tickers: always include the primary,
            # sometimes include a second from the same sector.
            affected_tickers = [primary_ticker]
            if random.random() < 0.3:
                extra = random.choice(
                    [t for t in tickers_pool if t != primary_ticker]
                )
                affected_tickers.append(extra)

            severity = random.choices(
                ["low", "medium", "high"], weights=[0.5, 0.35, 0.15]
            )[0]

            entry = {
                "headline": headline_text,
                "sector": sector,
                "tickers": affected_tickers,
                "severity": severity,
                "source": random.choice(NEWS_SOURCES),
                "timestamp": time.time(),
            }

            new_headlines.append(entry)
            self._headlines.append(entry)

        return new_headlines

    def get_recent(self, n: int = 10) -> list[dict]:
        """Return the last *n* headlines that have been generated."""
        return self._headlines[-n:]


# Module-level singleton
news_feed_service = NewsFeedService()
