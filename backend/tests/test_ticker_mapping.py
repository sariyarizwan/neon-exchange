"""Tests for config/ticker_mapping.py — data integrity of ticker and district config."""

import pytest
from config.ticker_mapping import (
    TICKERS,
    DISTRICTS,
    TICKER_BY_ID,
    TICKER_BY_REAL,
    TICKER_BY_SYMBOL,
    DISTRICT_BY_ID,
    DISTRICT_TICKERS,
    ALL_REAL_SYMBOLS,
    SECTOR_VOLATILITY,
    SECTOR_KEYWORDS,
    SECTOR_TO_DISTRICT,
    COMPANY_NAMES,
    _SHORT_SYMBOLS,
    TickerConfig,
    DistrictConfig,
)


class TestTickerCount:
    def test_exactly_23_tickers_defined(self):
        assert len(TICKERS) == 23

    def test_exactly_8_districts_defined(self):
        assert len(DISTRICTS) == 8

    def test_all_real_symbols_count(self):
        assert len(ALL_REAL_SYMBOLS) == 23


class TestTickerFields:
    def test_all_tickers_have_id(self):
        for t in TICKERS:
            assert t.id, f"Ticker missing id: {t}"

    def test_all_tickers_have_symbol(self):
        for t in TICKERS:
            assert t.symbol, f"Ticker missing symbol: {t}"

    def test_all_tickers_have_real_symbol(self):
        for t in TICKERS:
            assert t.real_symbol, f"Ticker missing real_symbol: {t}"

    def test_all_tickers_have_valid_district_id(self):
        valid_district_ids = {d.id for d in DISTRICTS}
        for t in TICKERS:
            assert t.district_id in valid_district_ids, (
                f"Ticker {t.id} has invalid district_id: {t.district_id}"
            )

    def test_all_tickers_have_sector(self):
        for t in TICKERS:
            assert t.sector, f"Ticker missing sector: {t}"

    def test_all_tickers_are_frozen(self):
        t = TICKERS[0]
        with pytest.raises((AttributeError, TypeError)):
            t.id = "mutated"


class TestLookups:
    def test_ticker_by_id_lookup(self):
        nvx = TICKER_BY_ID.get("nvx")
        assert nvx is not None
        assert nvx.real_symbol == "NVDA"

    def test_ticker_by_real_lookup(self):
        tc = TICKER_BY_REAL.get("NVDA")
        assert tc is not None
        assert tc.id == "nvx"

    def test_ticker_by_symbol_lookup(self):
        tc = TICKER_BY_SYMBOL.get("NVX")
        assert tc is not None
        assert tc.real_symbol == "NVDA"

    def test_ticker_by_id_contains_all_ids(self):
        assert len(TICKER_BY_ID) == 23

    def test_ticker_by_real_contains_all_real_symbols(self):
        assert len(TICKER_BY_REAL) == 23

    def test_unknown_id_returns_none(self):
        assert TICKER_BY_ID.get("doesnotexist") is None

    def test_unknown_real_symbol_returns_none(self):
        assert TICKER_BY_REAL.get("ZZZZ") is None


class TestDistrictTickers:
    def test_district_tickers_has_all_8_districts(self):
        expected = {d.id for d in DISTRICTS}
        assert set(DISTRICT_TICKERS.keys()) == expected

    def test_chip_docks_has_3_tickers(self):
        chip = DISTRICT_TICKERS.get("chip-docks", [])
        assert len(chip) == 3

    def test_bank_towers_has_3_tickers(self):
        bank = DISTRICT_TICKERS.get("bank-towers", [])
        assert len(bank) == 3

    def test_all_districts_non_empty(self):
        for district_id, tickers in DISTRICT_TICKERS.items():
            assert len(tickers) > 0, f"District {district_id} has no tickers"

    def test_total_tickers_across_districts_is_23(self):
        total = sum(len(v) for v in DISTRICT_TICKERS.values())
        assert total == 23


class TestSectorVolatility:
    def test_sector_volatility_has_all_sectors(self):
        expected_sectors = {d.sector for d in DISTRICTS}
        for sector in expected_sectors:
            assert sector in SECTOR_VOLATILITY, f"Sector {sector} missing from SECTOR_VOLATILITY"

    def test_all_volatilities_are_positive(self):
        for sector, vol in SECTOR_VOLATILITY.items():
            assert vol > 0, f"Sector {sector} has non-positive volatility: {vol}"

    def test_crypto_has_highest_volatility(self):
        """Crypto should have the highest volatility baseline."""
        assert SECTOR_VOLATILITY["Crypto"] == max(SECTOR_VOLATILITY.values())


class TestSectorToDistrict:
    def test_all_sectors_mapped_to_districts(self):
        expected_sectors = {d.sector for d in DISTRICTS}
        for sector in expected_sectors:
            assert sector in SECTOR_TO_DISTRICT

    def test_sector_maps_to_valid_district_id(self):
        valid_ids = {d.id for d in DISTRICTS}
        for sector, district_id in SECTOR_TO_DISTRICT.items():
            assert district_id in valid_ids


class TestShortSymbols:
    def test_short_symbols_are_two_chars_or_less(self):
        for sym in _SHORT_SYMBOLS:
            assert len(sym) <= 2, f"Short symbol {sym} is longer than 2 chars"

    def test_T_is_a_short_symbol(self):
        assert "T" in _SHORT_SYMBOLS

    def test_DE_is_a_short_symbol(self):
        assert "DE" in _SHORT_SYMBOLS
