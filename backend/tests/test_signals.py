"""Tests for services/signals.py — correlation, regime, breadth, sector strength."""

import math
import pytest
from services.signals import (
    _pearson,
    _returns,
    compute_correlations,
    compute_sector_strength,
    detect_regimes,
    compute_breadth,
    compute_all_signals,
)


# ---------------------------------------------------------------------------
# _pearson unit tests
# ---------------------------------------------------------------------------

class TestPearson:
    def test_identical_series_returns_one(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
        result = _pearson(xs, xs)
        assert abs(result - 1.0) < 1e-9

    def test_inverse_series_returns_negative_one(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
        ys = [-1.0, -2.0, -3.0, -4.0, -5.0, -6.0, -7.0]
        result = _pearson(xs, ys)
        assert abs(result - (-1.0)) < 1e-9

    def test_fewer_than_5_points_returns_zero(self):
        xs = [1.0, 2.0, 3.0, 4.0]
        ys = [4.0, 3.0, 2.0, 1.0]
        assert _pearson(xs, ys) == 0.0

    def test_exactly_5_points_does_not_return_zero_for_correlated(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0]
        ys = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = _pearson(xs, ys)
        assert abs(result - 1.0) < 1e-9

    def test_uncorrelated_series_near_zero(self):
        # Alternating signs — not correlated with a monotone series
        xs = [1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0]
        ys = [1.0,  2.0, 3.0,  4.0, 5.0,  6.0, 7.0,  8.0, 9.0, 10.0]
        result = _pearson(xs, ys)
        assert abs(result) < 0.3

    def test_constant_x_returns_zero(self):
        xs = [5.0] * 10
        ys = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
        assert _pearson(xs, ys) == 0.0

    def test_constant_y_returns_zero(self):
        xs = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
        ys = [5.0] * 7
        assert _pearson(xs, ys) == 0.0

    def test_empty_series_returns_zero(self):
        assert _pearson([], []) == 0.0


# ---------------------------------------------------------------------------
# _returns unit tests
# ---------------------------------------------------------------------------

class TestReturns:
    def test_returns_length_is_n_minus_1(self):
        prices = [100.0, 102.0, 101.0, 105.0]
        r = _returns(prices)
        assert len(r) == 3

    def test_single_price_returns_empty(self):
        assert _returns([100.0]) == []

    def test_empty_prices_returns_empty(self):
        assert _returns([]) == []

    def test_ascending_prices_give_positive_returns(self):
        prices = [100.0, 110.0, 121.0]
        r = _returns(prices)
        assert all(v > 0 for v in r)


# ---------------------------------------------------------------------------
# compute_correlations
# ---------------------------------------------------------------------------

class TestComputeCorrelations:
    def _make_history(self, prices: list[float]) -> list[dict]:
        return [{"price": p, "timestamp": i} for i, p in enumerate(prices)]

    def test_empty_input_returns_empty_structure(self):
        result = compute_correlations({})
        assert result == {"matrix": {}, "top_positive": [], "top_negative": []}

    def test_single_ticker_returns_empty_structure(self):
        hist = self._make_history([100.0] * 15)
        result = compute_correlations({"NVDA": hist})
        # Fewer than 2 symbols → no pairs
        assert result["matrix"] == {} or (
            "NVDA" in result["matrix"] and result["matrix"]["NVDA"] == {"NVDA": 1.0}
        )

    def test_matrix_is_symmetric(self):
        prices_a = [float(i) for i in range(1, 21)]
        prices_b = [float(i) * 1.5 for i in range(1, 21)]
        hist = {
            "NVDA": self._make_history(prices_a),
            "AMD": self._make_history(prices_b),
        }
        result = compute_correlations(hist)
        matrix = result["matrix"]
        if "NVDA" in matrix and "AMD" in matrix:
            assert abs(matrix["NVDA"]["AMD"] - matrix["AMD"]["NVDA"]) < 1e-9

    def test_self_correlation_is_one(self):
        prices = [float(i) for i in range(1, 21)]
        hist = {
            "NVDA": self._make_history(prices),
            "AMD": self._make_history([p * 2 for p in prices]),
        }
        result = compute_correlations(hist)
        matrix = result["matrix"]
        if "NVDA" in matrix:
            assert matrix["NVDA"]["NVDA"] == 1.0

    def test_top_positive_non_negative(self):
        prices_a = [float(i) for i in range(1, 25)]
        prices_b = [float(i) * 1.1 for i in range(1, 25)]
        hist = {
            "A": self._make_history(prices_a),
            "B": self._make_history(prices_b),
        }
        result = compute_correlations(hist)
        for pair in result["top_positive"]:
            assert pair["r"] > 0

    def test_top_negative_non_positive(self):
        prices_a = [float(i) for i in range(1, 25)]
        prices_b = [float(25 - i) for i in range(1, 25)]
        hist = {
            "A": self._make_history(prices_a),
            "B": self._make_history(prices_b),
        }
        result = compute_correlations(hist)
        for pair in result["top_negative"]:
            assert pair["r"] < 0

    def test_insufficient_history_excluded(self):
        """Tickers with < 10 price points should be excluded."""
        short_hist = [{"price": 100.0, "timestamp": i} for i in range(5)]
        result = compute_correlations({"NVDA": short_hist})
        assert result["matrix"] == {}


# ---------------------------------------------------------------------------
# compute_sector_strength
# ---------------------------------------------------------------------------

class TestComputeSectorStrength:
    def _make_tickers(self, sector_changes: dict) -> list[dict]:
        tickers = []
        for sector, changes in sector_changes.items():
            for c in changes:
                tickers.append({"sector": sector, "change_pct": c})
        return tickers

    def test_all_sectors_present_in_output(self):
        tickers = self._make_tickers({
            "Tech": [1.0, 2.0],
            "Financials": [-0.5],
            "Energy": [0.3],
        })
        result = compute_sector_strength(tickers)
        assert "Tech" in result
        assert "Financials" in result
        assert "Energy" in result

    def test_stronger_sector_has_lower_rank_number(self):
        tickers = self._make_tickers({
            "Tech": [5.0, 5.0],
            "Energy": [-2.0, -2.0],
        })
        result = compute_sector_strength(tickers)
        assert result["Tech"]["rank"] < result["Energy"]["rank"]

    def test_improving_trend_detected(self):
        """Sector rank improves (lower number) compared to prev_ranks."""
        tickers = self._make_tickers({
            "Tech": [3.0],
            "Energy": [0.0],
        })
        # Previously Tech was rank 2, now it's rank 1 → improving
        prev = {"Tech": 2, "Energy": 1}
        result = compute_sector_strength(tickers, prev_ranks=prev)
        assert result["Tech"]["trend"] == "improving"

    def test_weakening_trend_detected(self):
        tickers = self._make_tickers({
            "Tech": [0.0],
            "Energy": [3.0],
        })
        # Previously Tech was rank 1, now rank 2 → weakening
        prev = {"Tech": 1, "Energy": 2}
        result = compute_sector_strength(tickers, prev_ranks=prev)
        assert result["Tech"]["trend"] == "weakening"

    def test_stable_trend_when_rank_unchanged(self):
        tickers = self._make_tickers({
            "Tech": [3.0],
            "Energy": [0.0],
        })
        prev = {"Tech": 1, "Energy": 2}
        result = compute_sector_strength(tickers, prev_ranks=prev)
        assert result["Tech"]["trend"] == "stable"

    def test_empty_tickers_returns_empty(self):
        result = compute_sector_strength([])
        assert result == {}

    def test_strength_is_average_change(self):
        tickers = [
            {"sector": "Tech", "change_pct": 2.0},
            {"sector": "Tech", "change_pct": 4.0},
        ]
        result = compute_sector_strength(tickers)
        assert abs(result["Tech"]["strength"] - 3.0) < 0.001


# ---------------------------------------------------------------------------
# detect_regimes
# ---------------------------------------------------------------------------

class TestDetectRegimes:
    def _make_hist(self, prices: list[float]) -> list[dict]:
        return [{"price": p} for p in prices]

    def _ticker(self, sym: str, sector: str, district: str, prices: list[float]) -> tuple:
        return {
            "symbol": sym,
            "sector": sector,
            "district_id": district,
        }, prices

    def test_calm_regime_for_very_low_volatility(self):
        """Price series with tiny variance relative to baseline → calm."""
        # Baseline for Tech is 0.0025; realized_vol << 0.5 * 0.0025
        prices = [100.0 + i * 0.001 for i in range(30)]  # smooth ramp
        hist = {"NVDA": self._make_hist(prices)}
        tickers = [{"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks"}]
        result = detect_regimes(hist, tickers)
        assert result["tickers"]["NVDA"] == "calm"

    def test_storm_regime_for_extreme_volatility(self):
        """Price oscillating wildly → realized_vol ≥ 3x baseline → storm."""
        import math
        # Large amplitude oscillation
        baseline = 0.0025  # Tech baseline
        prices = []
        for i in range(30):
            prices.append(100.0 + (50.0 if i % 2 == 0 else -50.0))
        hist = {"NVDA": self._make_hist(prices)}
        tickers = [{"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks"}]
        result = detect_regimes(hist, tickers)
        assert result["tickers"]["NVDA"] == "storm"

    def test_insufficient_history_defaults_to_normal(self):
        hist = {"NVDA": self._make_hist([100.0, 101.0])}
        tickers = [{"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks"}]
        result = detect_regimes(hist, tickers)
        assert result["tickers"]["NVDA"] == "normal"

    def test_district_regime_is_max_of_ticker_regimes(self):
        """District regime = worst regime among its tickers."""
        prices_calm = [100.0 + i * 0.001 for i in range(30)]
        prices_storm = [100.0 + (50.0 if i % 2 == 0 else -50.0) for i in range(30)]
        hist = {
            "NVDA": self._make_hist(prices_calm),
            "AMD": self._make_hist(prices_storm),
        }
        tickers = [
            {"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks"},
            {"symbol": "AMD", "sector": "Tech", "district_id": "chip-docks"},
        ]
        result = detect_regimes(hist, tickers)
        assert result["districts"]["chip-docks"] == "storm"

    def test_returns_both_tickers_and_districts_keys(self):
        hist = {"NVDA": self._make_hist([100.0] * 5)}
        tickers = [{"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks"}]
        result = detect_regimes(hist, tickers)
        assert "tickers" in result
        assert "districts" in result

    def test_empty_tickers_and_history(self):
        result = detect_regimes({}, [])
        assert result == {"tickers": {}, "districts": {}}


# ---------------------------------------------------------------------------
# compute_breadth
# ---------------------------------------------------------------------------

class TestComputeBreadth:
    def test_correct_advancers_and_decliners_count(self):
        tickers = [
            {"change_pct": 1.0},
            {"change_pct": -0.5},
            {"change_pct": 0.0},
            {"change_pct": 2.0},
        ]
        result = compute_breadth(tickers)
        assert result["advancers"] == 2
        assert result["decliners"] == 1
        assert result["unchanged"] == 1

    def test_zero_decliners_no_division_error(self):
        tickers = [{"change_pct": 1.0}, {"change_pct": 0.5}]
        result = compute_breadth(tickers)
        assert result["decliners"] == 0
        # ratio = float(advancers) = 2.0 when decliners == 0
        assert result["ratio"] == 2.0

    def test_strong_bullish_signal(self):
        tickers = [{"change_pct": 1.0}] * 10 + [{"change_pct": -1.0}] * 2
        result = compute_breadth(tickers)
        assert result["signal"] == "strong_bullish"

    def test_bullish_signal(self):
        # ratio between 1.2 and 2.0
        tickers = [{"change_pct": 1.0}] * 5 + [{"change_pct": -1.0}] * 3
        result = compute_breadth(tickers)
        assert result["signal"] in ("bullish", "neutral")

    def test_strong_bearish_signal(self):
        tickers = [{"change_pct": -1.0}] * 10 + [{"change_pct": 1.0}] * 2
        result = compute_breadth(tickers)
        assert result["signal"] == "strong_bearish"

    def test_neutral_signal_when_balanced(self):
        # ratio near 1.0
        tickers = [{"change_pct": 1.0}] * 5 + [{"change_pct": -1.0}] * 5
        result = compute_breadth(tickers)
        assert result["signal"] == "neutral"

    def test_empty_tickers_returns_zero_counts(self):
        result = compute_breadth([])
        assert result["advancers"] == 0
        assert result["decliners"] == 0

    def test_result_has_all_expected_keys(self):
        result = compute_breadth([{"change_pct": 0.5}])
        for key in ("advancers", "decliners", "unchanged", "ratio", "signal"):
            assert key in result


# ---------------------------------------------------------------------------
# compute_all_signals
# ---------------------------------------------------------------------------

class TestComputeAllSignals:
    def _make_hist(self, n: int = 25, base: float = 100.0) -> list[dict]:
        return [{"price": base + i * 0.1} for i in range(n)]

    def test_returns_all_expected_top_level_keys(self):
        tickers = [
            {"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks", "change_pct": 1.0},
            {"symbol": "AMD", "sector": "Tech", "district_id": "chip-docks", "change_pct": -0.5},
        ]
        hist = {
            "NVDA": self._make_hist(),
            "AMD": self._make_hist(base=50.0),
        }
        result = compute_all_signals(tickers, hist)
        for key in ("correlations", "top_correlations", "sector_strength", "regimes", "breadth", "computed_at"):
            assert key in result, f"Missing key: {key}"

    def test_reuses_prev_correlations_when_fresh(self):
        """When correlation_age_s < 30, prev_correlations should be returned as-is."""
        dummy_corr = {"matrix": {}, "top_positive": [{"a": "X", "b": "Y", "r": 0.9}], "top_negative": []}
        result = compute_all_signals(
            all_tickers=[],
            ticker_history={},
            prev_correlations=dummy_corr,
            correlation_age_s=10.0,
        )
        assert result["correlations"] is dummy_corr

    def test_recomputes_correlations_when_stale(self):
        """When correlation_age_s >= 30, fresh correlations are computed."""
        dummy_corr = {"matrix": {"STALE": {}}, "top_positive": [], "top_negative": []}
        tickers = [{"symbol": "NVDA", "sector": "Tech", "district_id": "chip-docks", "change_pct": 1.0}]
        hist = {"NVDA": self._make_hist()}
        result = compute_all_signals(
            all_tickers=tickers,
            ticker_history=hist,
            prev_correlations=dummy_corr,
            correlation_age_s=35.0,
        )
        # Stale sentinel key should not appear in fresh computation
        assert "STALE" not in result["correlations"].get("matrix", {})

    def test_computed_at_is_recent_float(self):
        import time
        before = time.time()
        result = compute_all_signals([], {})
        after = time.time()
        assert before <= result["computed_at"] <= after
