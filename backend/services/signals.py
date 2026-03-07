"""Derived market signals: correlations, sector strength, regime detection, breadth.

All functions are pure — they take pre-computed data from the cache and return
signal dicts. The cache calls these during its rebuild cycle.
"""

import math
import time
from config.ticker_mapping import SECTOR_VOLATILITY, DISTRICTS


def _returns(prices: list[float]) -> list[float]:
    """Compute log returns from a price series."""
    if len(prices) < 2:
        return []
    return [
        math.log(prices[i] / prices[i - 1]) if prices[i - 1] > 0 else 0.0
        for i in range(1, len(prices))
    ]


def _pearson(xs: list[float], ys: list[float]) -> float:
    """Pearson correlation between two equal-length series."""
    n = len(xs)
    if n < 5:
        return 0.0
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return 0.0
    return num / (dx * dy)


def compute_correlations(
    ticker_history: dict[str, list[dict]],
) -> dict:
    """Compute pairwise Pearson correlations from price histories.

    Returns:
        dict with "matrix" (sym→sym→float), "top_positive", "top_negative"
    """
    # Extract price series per symbol
    series: dict[str, list[float]] = {}
    for sym, hist in ticker_history.items():
        prices = [h["price"] for h in hist if "price" in h]
        if len(prices) >= 10:
            series[sym] = prices

    symbols = sorted(series.keys())
    returns_map = {s: _returns(series[s]) for s in symbols}

    # Trim to common length
    min_len = min((len(r) for r in returns_map.values()), default=0)
    if min_len < 5:
        return {"matrix": {}, "top_positive": [], "top_negative": []}

    trimmed = {s: r[-min_len:] for s, r in returns_map.items()}

    matrix: dict[str, dict[str, float]] = {}
    pairs: list[dict] = []

    for i, a in enumerate(symbols):
        matrix[a] = {}
        for j, b in enumerate(symbols):
            if i == j:
                matrix[a][b] = 1.0
                continue
            if j < i:
                matrix[a][b] = matrix[b][a]
                continue
            r = round(_pearson(trimmed[a], trimmed[b]), 3)
            matrix[a][b] = r
            pairs.append({"a": a, "b": b, "r": r})

    pairs.sort(key=lambda p: abs(p["r"]), reverse=True)
    top_positive = [p for p in pairs if p["r"] > 0][:10]
    top_negative = [p for p in pairs if p["r"] < 0][:5]

    return {
        "matrix": matrix,
        "top_positive": top_positive,
        "top_negative": top_negative,
    }


def compute_sector_strength(
    all_tickers: list[dict],
    prev_ranks: dict[str, int] | None = None,
) -> dict[str, dict]:
    """Compute sector strength index with ranking and trend.

    Args:
        all_tickers: list of ticker dicts with 'sector' and 'change_pct'
        prev_ranks: previous sector ranks for trend detection

    Returns:
        dict mapping sector name → {strength, rank, trend}
    """
    sector_changes: dict[str, list[float]] = {}
    for t in all_tickers:
        sector = t.get("sector", "Unknown")
        sector_changes.setdefault(sector, []).append(t.get("change_pct", 0.0))

    strengths: dict[str, float] = {}
    for sector, changes in sector_changes.items():
        strengths[sector] = round(sum(changes) / len(changes), 3) if changes else 0.0

    ranked = sorted(strengths.keys(), key=lambda s: strengths[s], reverse=True)

    result: dict[str, dict] = {}
    for rank_idx, sector in enumerate(ranked, 1):
        prev_rank = (prev_ranks or {}).get(sector, rank_idx)
        if rank_idx < prev_rank:
            trend = "improving"
        elif rank_idx > prev_rank:
            trend = "weakening"
        else:
            trend = "stable"

        result[sector] = {
            "strength": strengths[sector],
            "rank": rank_idx,
            "trend": trend,
        }

    return result


def detect_regimes(
    ticker_history: dict[str, list[dict]],
    all_tickers: list[dict],
) -> dict[str, dict]:
    """Detect volatility regime per ticker and per district.

    Returns:
        dict with "tickers" (sym→regime) and "districts" (dist_id→regime)
    """
    ticker_regimes: dict[str, str] = {}

    for t in all_tickers:
        sym = t.get("symbol", "")
        sector = t.get("sector", "")
        hist = ticker_history.get(sym, [])
        prices = [h["price"] for h in hist if "price" in h]

        baseline = SECTOR_VOLATILITY.get(sector, 0.002)

        if len(prices) >= 10:
            window = prices[-20:] if len(prices) >= 20 else prices
            avg = sum(window) / len(window)
            if avg > 0:
                var = sum((p - avg) ** 2 for p in window) / len(window)
                realized_vol = math.sqrt(var) / avg
            else:
                realized_vol = 0.0

            ratio = realized_vol / baseline if baseline > 0 else 1.0
            if ratio < 0.5:
                regime = "calm"
            elif ratio < 1.5:
                regime = "normal"
            elif ratio < 3.0:
                regime = "choppy"
            else:
                regime = "storm"
        else:
            regime = "normal"

        ticker_regimes[sym] = regime

    # Aggregate per district
    district_tickers: dict[str, list[str]] = {}
    for t in all_tickers:
        did = t.get("district_id", "")
        sym = t.get("symbol", "")
        district_tickers.setdefault(did, []).append(sym)

    district_regimes: dict[str, str] = {}
    regime_rank = {"calm": 0, "normal": 1, "choppy": 2, "storm": 3}
    for did, syms in district_tickers.items():
        regimes = [ticker_regimes.get(s, "normal") for s in syms]
        max_regime = max(regimes, key=lambda r: regime_rank.get(r, 1))
        district_regimes[did] = max_regime

    return {"tickers": ticker_regimes, "districts": district_regimes}


def compute_breadth(all_tickers: list[dict]) -> dict:
    """Compute market breadth: advancers, decliners, ratio."""
    advancers = sum(1 for t in all_tickers if t.get("change_pct", 0) > 0)
    decliners = sum(1 for t in all_tickers if t.get("change_pct", 0) < 0)
    unchanged = len(all_tickers) - advancers - decliners

    ratio = round(advancers / decliners, 2) if decliners > 0 else float(advancers)

    if ratio > 2.0:
        signal = "strong_bullish"
    elif ratio > 1.2:
        signal = "bullish"
    elif ratio < 0.5:
        signal = "strong_bearish"
    elif ratio < 0.8:
        signal = "bearish"
    else:
        signal = "neutral"

    return {
        "advancers": advancers,
        "decliners": decliners,
        "unchanged": unchanged,
        "ratio": ratio,
        "signal": signal,
    }


def compute_all_signals(
    all_tickers: list[dict],
    ticker_history: dict[str, list[dict]],
    prev_sector_ranks: dict[str, int] | None = None,
    prev_correlations: dict | None = None,
    correlation_age_s: float = 0.0,
) -> dict:
    """Compute all signals. Correlations are only recalculated every 30s.

    Args:
        prev_correlations: previous correlation result to reuse if fresh
        correlation_age_s: seconds since last correlation computation

    Returns:
        dict with all signal categories
    """
    # Correlations: expensive, recalculate every 30s
    if prev_correlations and correlation_age_s < 30.0:
        correlations = prev_correlations
    else:
        correlations = compute_correlations(ticker_history)

    sector_strength = compute_sector_strength(all_tickers, prev_sector_ranks)
    regimes = detect_regimes(ticker_history, all_tickers)
    breadth = compute_breadth(all_tickers)

    # Flatten top correlations for easy agent consumption
    top_correlations = correlations.get("top_positive", [])[:5] + correlations.get("top_negative", [])[:3]

    return {
        "correlations": correlations,
        "top_correlations": top_correlations,
        "sector_strength": sector_strength,
        "regimes": regimes,
        "breadth": breadth,
        "computed_at": time.time(),
    }
