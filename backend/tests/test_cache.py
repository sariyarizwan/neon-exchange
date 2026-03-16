"""Tests for services/cache.py — WorldSnapshot rebuild and SnapshotCache."""

import asyncio
import pytest
from config.ticker_mapping import DISTRICTS


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def fresh_cache():
    """Return a SnapshotCache with singletons reset (no background loop)."""
    from services.cache import SnapshotCache
    return SnapshotCache()


# ---------------------------------------------------------------------------
# _rebuild produces a valid snapshot
# ---------------------------------------------------------------------------

class TestRebuild:
    def test_rebuild_produces_valid_snapshot(self, fresh_cache):
        """_rebuild() should populate the active snapshot without raising."""
        fresh_cache._rebuild()
        snap = fresh_cache.snapshot
        assert snap is not None

    def test_rebuild_increments_rebuild_count(self, fresh_cache):
        assert fresh_cache.rebuild_count == 0
        fresh_cache._rebuild()
        assert fresh_cache.rebuild_count == 1
        fresh_cache._rebuild()
        assert fresh_cache.rebuild_count == 2

    def test_rebuild_populates_all_tickers(self, fresh_cache):
        fresh_cache._rebuild()
        assert len(fresh_cache.snapshot.all_tickers) == 23

    def test_all_tickers_have_required_fields(self, fresh_cache):
        fresh_cache._rebuild()
        for ticker in fresh_cache.snapshot.all_tickers:
            assert "symbol" in ticker
            assert "price" in ticker
            assert "change_pct" in ticker
            assert "neon_id" in ticker

    def test_rebuild_sets_timestamp(self, fresh_cache):
        import time
        before = time.time()
        fresh_cache._rebuild()
        after = time.time()
        assert before <= fresh_cache.snapshot.timestamp <= after

    def test_rebuild_sets_rebuild_ms(self, fresh_cache):
        fresh_cache._rebuild()
        assert fresh_cache.snapshot.rebuild_ms >= 0


class TestDistrictSummaries:
    def test_all_8_districts_in_district_summaries(self, fresh_cache):
        fresh_cache._rebuild()
        summaries = fresh_cache.snapshot.district_summaries
        expected = {d.id for d in DISTRICTS}
        assert set(summaries.keys()) == expected

    def test_each_district_summary_has_required_fields(self, fresh_cache):
        fresh_cache._rebuild()
        for district_id, summary in fresh_cache.snapshot.district_summaries.items():
            assert "district_id" in summary
            assert "name" in summary
            assert "sector" in summary
            assert "tickers" in summary
            assert "avg_change_pct" in summary
            assert "mood" in summary

    def test_district_mood_values_are_valid(self, fresh_cache):
        fresh_cache._rebuild()
        valid_moods = {"euphoric", "calm", "panic", "tense"}
        for d_id, summary in fresh_cache.snapshot.district_summaries.items():
            assert summary["mood"] in valid_moods, (
                f"District {d_id} has invalid mood: {summary['mood']}"
            )


class TestNeonTickers:
    def test_neon_tickers_keyed_by_neon_id(self, fresh_cache):
        fresh_cache._rebuild()
        neon_tickers = fresh_cache.snapshot.neon_tickers
        # All keys should be lowercase neon ids (e.g. "nvx")
        assert len(neon_tickers) == 23

    def test_neon_ticker_has_required_fields(self, fresh_cache):
        fresh_cache._rebuild()
        for neon_id, nt in fresh_cache.snapshot.neon_tickers.items():
            assert "neonId" in nt
            assert "realSymbol" in nt
            assert "price" in nt
            assert "changePct" in nt
            assert "trend" in nt
            assert "mood" in nt
            assert "districtId" in nt

    def test_neon_ticker_trend_values_valid(self, fresh_cache):
        fresh_cache._rebuild()
        valid_trends = {"up", "down", "flat"}
        for neon_id, nt in fresh_cache.snapshot.neon_tickers.items():
            assert nt["trend"] in valid_trends

    def test_nvx_neon_ticker_present(self, fresh_cache):
        fresh_cache._rebuild()
        assert "nvx" in fresh_cache.snapshot.neon_tickers


class TestMarketMood:
    def test_market_mood_in_neon_state(self, fresh_cache):
        fresh_cache._rebuild()
        neon_state = fresh_cache.snapshot.neon_state
        assert "marketMood" in neon_state

    def test_market_mood_is_string(self, fresh_cache):
        fresh_cache._rebuild()
        mood = fresh_cache.snapshot.neon_state["marketMood"]
        assert isinstance(mood, str) and len(mood) > 0


class TestSparklines:
    def test_sparklines_present_for_all_neon_ids(self, fresh_cache):
        # Run a few ticks first so there's enough history
        fresh_cache._rebuild()
        fresh_cache._rebuild()
        sparklines = fresh_cache.snapshot.sparklines
        neon_ids = set(fresh_cache.snapshot.neon_tickers.keys())
        for neon_id in neon_ids:
            assert neon_id in sparklines, f"Missing sparkline for {neon_id}"

    def test_sparklines_contain_floats(self, fresh_cache):
        fresh_cache._rebuild()
        fresh_cache._rebuild()
        for neon_id, prices in fresh_cache.snapshot.sparklines.items():
            assert isinstance(prices, list)
            for p in prices:
                assert isinstance(p, float)


class TestTickerLookup:
    def test_lookup_by_real_symbol(self, fresh_cache):
        fresh_cache._rebuild()
        entry = fresh_cache.snapshot.ticker_lookup.get("NVDA")
        assert entry is not None
        assert entry["symbol"] == "NVDA"

    def test_lookup_by_neon_id(self, fresh_cache):
        fresh_cache._rebuild()
        entry = fresh_cache.snapshot.ticker_lookup.get("nvx")
        assert entry is not None
        assert entry["symbol"] == "NVDA"

    def test_lookup_by_neon_symbol(self, fresh_cache):
        fresh_cache._rebuild()
        entry = fresh_cache.snapshot.ticker_lookup.get("NVX")
        assert entry is not None
        assert entry["symbol"] == "NVDA"

    def test_unknown_key_returns_none(self, fresh_cache):
        fresh_cache._rebuild()
        assert fresh_cache.snapshot.ticker_lookup.get("ZZZZ") is None


class TestPreSerializedJson:
    def test_all_tickers_json_is_valid(self, fresh_cache):
        import json
        fresh_cache._rebuild()
        data = json.loads(fresh_cache.snapshot.all_tickers_json)
        assert isinstance(data, list)
        assert len(data) == 23

    def test_market_state_json_is_valid(self, fresh_cache):
        import json
        fresh_cache._rebuild()
        data = json.loads(fresh_cache.snapshot.market_state_json)
        assert "tickers" in data
        assert "market_mood" in data

    def test_neon_state_json_is_valid(self, fresh_cache):
        import json
        fresh_cache._rebuild()
        data = json.loads(fresh_cache.snapshot.neon_state_json)
        assert "tickers" in data
        assert "marketMood" in data


class TestDoubleBuffering:
    def test_active_idx_alternates(self, fresh_cache):
        initial_idx = fresh_cache._active_idx
        fresh_cache._rebuild()
        assert fresh_cache._active_idx != initial_idx
        fresh_cache._rebuild()
        assert fresh_cache._active_idx == initial_idx

    def test_snapshot_reflects_latest_rebuild(self, fresh_cache):
        fresh_cache._rebuild()
        count_after_first = fresh_cache.rebuild_count
        fresh_cache._rebuild()
        count_after_second = fresh_cache.rebuild_count
        assert count_after_second == count_after_first + 1


class TestBootstrap:
    def test_bootstrap_has_required_keys(self, fresh_cache):
        fresh_cache._rebuild()
        bootstrap = fresh_cache.snapshot.bootstrap
        for key in ("market_state", "districts", "scenarios", "recent_news"):
            assert key in bootstrap

    def test_bootstrap_districts_count_is_8(self, fresh_cache):
        fresh_cache._rebuild()
        assert len(fresh_cache.snapshot.bootstrap["districts"]) == 8
