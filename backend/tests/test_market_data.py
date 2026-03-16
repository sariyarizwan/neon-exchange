"""Tests for services/market_data.py — mock mode behavior, tick logic, accessors."""

import pytest
from config.ticker_mapping import TICKERS, DISTRICT_TICKERS


class TestMockMode:
    def test_is_live_false_without_api_key(self, market_service):
        """No API key → mock mode → is_live is False."""
        assert market_service.is_live is False

    def test_mock_mode_flag_set(self, market_service):
        assert market_service._mock_mode is True

    def test_no_api_key_set(self, market_service):
        assert market_service._finnhub_key == ""


class TestInitialization:
    def test_cache_populated_for_all_tickers(self, market_service):
        for tc in TICKERS:
            assert tc.real_symbol in market_service._cache

    def test_district_map_has_8_districts(self, market_service):
        assert len(market_service.district_map) == 8

    def test_district_map_keys_match_config(self, market_service):
        from config.ticker_mapping import DISTRICTS
        expected = {d.id for d in DISTRICTS}
        assert set(market_service.district_map.keys()) == expected

    def test_initial_prices_from_fallback(self, market_service):
        """Initial prices must be > 0 (from fallback prices)."""
        for tc in TICKERS:
            cached = market_service._cache[tc.real_symbol]
            assert cached.price > 0

    def test_history_starts_with_one_entry(self, market_service):
        for tc in TICKERS:
            cached = market_service._cache[tc.real_symbol]
            assert len(cached.history) >= 1


class TestGenerateTick:
    def test_generate_tick_changes_prices(self, market_service):
        """After a tick, at least one price should have changed."""
        before = {tc.real_symbol: market_service._cache[tc.real_symbol].price for tc in TICKERS}
        market_service.generate_tick()
        after = {tc.real_symbol: market_service._cache[tc.real_symbol].price for tc in TICKERS}
        changed = sum(1 for sym in before if before[sym] != after[sym])
        assert changed > 0

    def test_generate_tick_appends_to_history(self, market_service):
        tc = TICKERS[0]
        before_len = len(market_service._cache[tc.real_symbol].history)
        market_service.generate_tick()
        after_len = len(market_service._cache[tc.real_symbol].history)
        assert after_len > before_len

    def test_price_stays_above_zero(self, market_service):
        for _ in range(5):
            market_service.generate_tick()
        for tc in TICKERS:
            assert market_service._cache[tc.real_symbol].price > 0

    def test_price_within_15_percent_cap(self, market_service):
        """Price should not move more than 15% from prev_close in mock mode."""
        for _ in range(10):
            market_service.generate_tick()
        for tc in TICKERS:
            cached = market_service._cache[tc.real_symbol]
            prev = cached.prev_close
            if prev > 0:
                pct_change = abs(cached.price - prev) / prev
                assert pct_change <= 0.15 + 1e-9, (
                    f"{tc.real_symbol}: price={cached.price}, prev_close={prev}, "
                    f"pct_change={pct_change:.4f}"
                )

    def test_history_capped_at_500(self, market_service):
        """History list should not exceed 500 entries."""
        for _ in range(510):
            market_service.generate_tick()
        for tc in TICKERS:
            assert len(market_service._cache[tc.real_symbol].history) <= 500

    def test_volume_increases_each_tick(self, market_service):
        tc = TICKERS[0]
        before_vol = market_service._cache[tc.real_symbol].volume
        market_service.generate_tick()
        after_vol = market_service._cache[tc.real_symbol].volume
        assert after_vol > before_vol


class TestGetTickerState:
    def test_returns_ticker_state_for_real_symbol(self, market_service):
        from services.market_data import TickerState
        state = market_service.get_ticker_state("NVDA")
        assert state is not None
        assert isinstance(state, TickerState)

    def test_returns_ticker_state_by_neon_id(self, market_service):
        state = market_service.get_ticker_state("nvx")
        assert state is not None
        assert state.symbol == "NVDA"

    def test_neon_id_populated(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert state.neon_id == "nvx"

    def test_neon_symbol_populated(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert state.neon_symbol == "NVX"

    def test_district_id_populated(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert state.district_id == "chip-docks"

    def test_sector_populated(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert state.sector == "Tech"

    def test_trend_bullish_when_price_up_more_than_1pct(self, market_service):
        cached = market_service._cache["NVDA"]
        cached.prev_close = 100.0
        cached.price = 102.0
        state = market_service.get_ticker_state("NVDA")
        assert state.trend == "bullish"

    def test_trend_bearish_when_price_down_more_than_1pct(self, market_service):
        cached = market_service._cache["NVDA"]
        cached.prev_close = 100.0
        cached.price = 98.0
        state = market_service.get_ticker_state("NVDA")
        assert state.trend == "bearish"

    def test_trend_neutral_when_within_1pct(self, market_service):
        cached = market_service._cache["NVDA"]
        cached.prev_close = 100.0
        cached.price = 100.5
        state = market_service.get_ticker_state("NVDA")
        assert state.trend == "neutral"

    def test_momentum_within_bounds(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert -1.0 <= state.momentum <= 1.0

    def test_returns_none_for_unknown_symbol(self, market_service):
        state = market_service.get_ticker_state("ZZZZ")
        assert state is None

    def test_change_pct_computed_correctly(self, market_service):
        cached = market_service._cache["NVDA"]
        cached.prev_close = 100.0
        cached.price = 110.0
        state = market_service.get_ticker_state("NVDA")
        assert abs(state.change_pct - 10.0) < 0.01

    def test_volatility_regime_field_valid(self, market_service):
        state = market_service.get_ticker_state("NVDA")
        assert state.volatility_regime in ("low", "normal", "high", "extreme")


class TestGetAllTickers:
    def test_returns_23_items(self, market_service):
        all_tickers = market_service.get_all_tickers()
        assert len(all_tickers) == 23

    def test_all_items_are_ticker_state(self, market_service):
        from services.market_data import TickerState
        for state in market_service.get_all_tickers():
            assert isinstance(state, TickerState)

    def test_no_duplicates(self, market_service):
        states = market_service.get_all_tickers()
        symbols = [s.symbol for s in states]
        assert len(symbols) == len(set(symbols))


class TestGetDistrictTickers:
    def test_chip_docks_returns_3_items(self, market_service):
        result = market_service.get_district_tickers("chip-docks")
        assert len(result) == 3

    def test_all_tickers_belong_to_district(self, market_service):
        for district_id in market_service.district_map:
            tickers = market_service.get_district_tickers(district_id)
            for state in tickers:
                assert state.district_id == district_id

    def test_unknown_district_returns_empty_list(self, market_service):
        result = market_service.get_district_tickers("mars-base")
        assert result == []


class TestGetPriceHistory:
    def test_returns_list(self, market_service):
        hist = market_service.get_price_history("NVDA")
        assert isinstance(hist, list)

    def test_returns_up_to_n_items(self, market_service):
        # Add enough history first
        for _ in range(25):
            market_service.generate_tick()
        hist = market_service.get_price_history("NVDA", periods=10)
        assert len(hist) <= 10

    def test_history_entries_have_price_field(self, market_service):
        hist = market_service.get_price_history("NVDA")
        for entry in hist:
            assert "price" in entry

    def test_history_entries_have_timestamp_field(self, market_service):
        hist = market_service.get_price_history("NVDA")
        for entry in hist:
            assert "timestamp" in entry

    def test_unknown_symbol_returns_empty(self, market_service):
        hist = market_service.get_price_history("ZZZZ")
        assert hist == []

    def test_neon_id_lookup_works(self, market_service):
        """get_price_history should accept neon_id as well."""
        hist = market_service.get_price_history("nvx")
        assert isinstance(hist, list)
        assert len(hist) >= 1
