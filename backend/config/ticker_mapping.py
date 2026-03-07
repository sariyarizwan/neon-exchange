"""Mapping between frontend fictional tickers and real market symbols.

The frontend uses 23 fictional tickers across 8 cyberpunk districts.
Each fictional ticker maps to a real US stock for live data ingestion.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TickerConfig:
    id: str            # Frontend ticker ID (e.g., "nvx")
    symbol: str        # Frontend display symbol (e.g., "NVX")
    real_symbol: str   # Real market symbol (e.g., "NVDA")
    full_name: str     # Fictional display name
    district_id: str   # Frontend district ID (hyphenated)
    sector: str        # Sector name


@dataclass(frozen=True)
class DistrictConfig:
    id: str
    name: str
    sector: str


DISTRICTS: list[DistrictConfig] = [
    DistrictConfig("chip-docks", "CHIP DOCKS", "Tech"),
    DistrictConfig("bank-towers", "BANK TOWERS", "Financials"),
    DistrictConfig("energy-yard", "ENERGY YARD", "Energy"),
    DistrictConfig("industrials-foundry", "INDUSTRIALS FOUNDRY", "Industrials"),
    DistrictConfig("consumer-strip", "CONSUMER STRIP", "Consumer"),
    DistrictConfig("crypto-alley", "CRYPTO ALLEY", "Crypto"),
    DistrictConfig("bio-dome", "BIO DOME", "Healthcare"),
    DistrictConfig("comms-neon-ridge", "COMMS NEON RIDGE", "Telecom"),
]

TICKERS: list[TickerConfig] = [
    # CHIP DOCKS (Tech)
    TickerConfig("nvx", "NVX", "NVDA", "Nova Vect Systems", "chip-docks", "Tech"),
    TickerConfig("qntm", "QNTM", "AMD", "Quantum Harbor Logic", "chip-docks", "Tech"),
    TickerConfig("sphr", "SPHR", "INTC", "Sphere Optics Grid", "chip-docks", "Tech"),
    # BANK TOWERS (Financials)
    TickerConfig("mint", "MINT", "JPM", "Mintline Capital", "bank-towers", "Financials"),
    TickerConfig("vault", "VLT", "BAC", "Vault Meridian Bank", "bank-towers", "Financials"),
    TickerConfig("shld", "SHLD", "GS", "Shield Underwrite", "bank-towers", "Financials"),
    # ENERGY YARD (Energy)
    TickerConfig("flux", "FLUX", "XOM", "Flux Barrel Works", "energy-yard", "Energy"),
    TickerConfig("grid", "GRID", "NEE", "Gridline Utilities", "energy-yard", "Energy"),
    TickerConfig("spark", "SPRK", "CVX", "Spark Freight Fuel", "energy-yard", "Energy"),
    # INDUSTRIALS FOUNDRY (Industrials)
    TickerConfig("forge", "FRGE", "CAT", "Forge Atlas Robotics", "industrials-foundry", "Industrials"),
    TickerConfig("haul", "HAUL", "UPS", "Haulstone Logistics", "industrials-foundry", "Industrials"),
    TickerConfig("bolt", "BOLT", "DE", "Boltline Machine Co.", "industrials-foundry", "Industrials"),
    # CONSUMER STRIP (Consumer)
    TickerConfig("cart", "CART", "AMZN", "Cartel Retail Loop", "consumer-strip", "Consumer"),
    TickerConfig("luxe", "LUXE", "NKE", "Luxe District Goods", "consumer-strip", "Consumer"),
    TickerConfig("bite", "BITE", "MCD", "Biteshift Hospitality", "consumer-strip", "Consumer"),
    # CRYPTO ALLEY (Crypto / FinTech)
    TickerConfig("coin", "COIN", "COIN", "Coin Circuit Holdings", "crypto-alley", "Crypto"),
    TickerConfig("hash", "HASH", "MARA", "Hashrail Networks", "crypto-alley", "Crypto"),
    TickerConfig("mintx", "MNTX", "SQ", "MintX Transfer Lab", "crypto-alley", "Crypto"),
    # BIO DOME (Healthcare)
    TickerConfig("helx", "HELX", "JNJ", "Helix Bioware", "bio-dome", "Healthcare"),
    TickerConfig("pulse", "PLS", "MDT", "Pulse Device Array", "bio-dome", "Healthcare"),
    TickerConfig("viva", "VIVA", "MRNA", "Viva Culture Labs", "bio-dome", "Healthcare"),
    # COMMS NEON RIDGE (Telecom)
    TickerConfig("beam", "BEAM", "META", "Beamline Media Grid", "comms-neon-ridge", "Telecom"),
    TickerConfig("wave", "WAVE", "T", "Wavefront Telecom", "comms-neon-ridge", "Telecom"),
]

# --- Lookup helpers ---

TICKER_BY_ID: dict[str, TickerConfig] = {t.id: t for t in TICKERS}
TICKER_BY_REAL: dict[str, TickerConfig] = {t.real_symbol: t for t in TICKERS}
TICKER_BY_SYMBOL: dict[str, TickerConfig] = {t.symbol: t for t in TICKERS}
DISTRICT_BY_ID: dict[str, DistrictConfig] = {d.id: d for d in DISTRICTS}

DISTRICT_TICKERS: dict[str, list[TickerConfig]] = {}
for _t in TICKERS:
    DISTRICT_TICKERS.setdefault(_t.district_id, []).append(_t)

ALL_REAL_SYMBOLS: list[str] = [t.real_symbol for t in TICKERS]

SECTOR_VOLATILITY: dict[str, float] = {
    "Tech": 0.0025,
    "Financials": 0.0018,
    "Energy": 0.0022,
    "Industrials": 0.0016,
    "Consumer": 0.0020,
    "Crypto": 0.0045,
    "Healthcare": 0.0015,
    "Telecom": 0.0017,
}

# Keywords for mapping news headlines to sectors
SECTOR_KEYWORDS: dict[str, list[str]] = {
    "Tech": [
        "tech", "chip", "semiconductor", "ai ", "software", "cloud",
        "nvidia", "amd", "intel", "apple", "microsoft", "google",
        "gpu", "processor", "data center", "cybersecurity",
    ],
    "Financials": [
        "bank", "financial", "rate", "fed ", "interest", "jpmorgan",
        "goldman", "loan", "mortgage", "credit", "treasury", "yield",
    ],
    "Energy": [
        "oil", "energy", "crude", "gas", "pipeline", "exxon", "chevron",
        "refin", "opec", "drilling", "solar", "renewable",
    ],
    "Industrials": [
        "industrial", "manufactur", "construction", "caterpillar",
        "ups", "deere", "freight", "logistics", "machinery",
    ],
    "Consumer": [
        "retail", "consumer", "amazon", "nike", "mcdonald",
        "restaurant", "shopping", "e-commerce", "spending",
    ],
    "Crypto": [
        "crypto", "bitcoin", "blockchain", "coinbase", "digital asset",
        "token", "mining", "defi", "ethereum", "stablecoin",
    ],
    "Healthcare": [
        "health", "pharma", "drug", "fda", "biotech", "medical",
        "vaccine", "johnson", "clinical", "hospital", "therapy",
    ],
    "Telecom": [
        "telecom", "5g", "wireless", "broadband", "at&t", "media",
        "streaming", "network", "communication", "fiber",
    ],
}

# Map sector to district ID
SECTOR_TO_DISTRICT: dict[str, str] = {d.sector: d.id for d in DISTRICTS}
