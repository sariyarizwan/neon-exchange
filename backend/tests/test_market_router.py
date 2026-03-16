"""Integration tests for routers/market_router.py.

Uses FastAPI's TestClient (synchronous) to avoid requiring pytest-asyncio.
The cache is manually rebuilt before tests to ensure snapshot data exists.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    """Create a TestClient with a pre-built cache snapshot.

    Using lifespan=False skips the background cache loop entirely.
    We manually call _rebuild() so the snapshot is populated.
    """
    from services.cache import snapshot_cache
    from main import app

    # Ensure at least one rebuild has happened so snapshot is populated
    snapshot_cache._rebuild()

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


class TestNeonState:
    def test_get_neon_state_returns_200(self, client):
        response = client.get("/api/market/neon-state")
        assert response.status_code == 200

    def test_neon_state_has_tickers_key(self, client):
        data = client.get("/api/market/neon-state").json()
        assert "tickers" in data

    def test_neon_state_has_market_mood(self, client):
        data = client.get("/api/market/neon-state").json()
        assert "marketMood" in data

    def test_neon_state_tickers_count(self, client):
        data = client.get("/api/market/neon-state").json()
        tickers = data.get("tickers", {})
        assert len(tickers) == 23


class TestMarketSnapshot:
    def test_snapshot_returns_200(self, client):
        response = client.get("/api/market/snapshot")
        assert response.status_code == 200

    def test_snapshot_has_tickers(self, client):
        data = client.get("/api/market/snapshot").json()
        assert "tickers" in data
        assert len(data["tickers"]) == 23

    def test_snapshot_filtered_by_district(self, client):
        response = client.get("/api/market/snapshot?district=chip-docks")
        assert response.status_code == 200
        data = response.json()
        tickers = data.get("tickers", {})
        # chip-docks has exactly 3 tickers
        assert len(tickers) == 3

    def test_snapshot_district_filter_returns_correct_district(self, client):
        data = client.get("/api/market/snapshot?district=chip-docks").json()
        for neon_id, ticker_data in data["tickers"].items():
            assert ticker_data["districtId"] == "chip-docks"

    def test_snapshot_invalid_district_returns_empty_tickers(self, client):
        data = client.get("/api/market/snapshot?district=mars-base").json()
        assert data["tickers"] == {}


class TestTickerHistory:
    def test_history_by_neon_id_returns_list(self, client):
        response = client.get("/api/market/history/nvx")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_history_candles_have_ohlc_fields(self, client):
        # Need at least one history point (after rebuild)
        from services.cache import snapshot_cache
        for _ in range(3):
            snapshot_cache._rebuild()
        data = client.get("/api/market/history/nvx").json()
        if data:
            candle = data[0]
            assert "open" in candle
            assert "high" in candle
            assert "low" in candle
            assert "close" in candle
            assert "timestamp" in candle

    def test_history_unknown_ticker_returns_empty(self, client):
        data = client.get("/api/market/history/zzzz").json()
        assert data == []


class TestSignals:
    def test_signals_returns_200(self, client):
        response = client.get("/api/market/signals")
        assert response.status_code == 200

    def test_signals_has_sector_strength(self, client):
        data = client.get("/api/market/signals").json()
        assert "sector_strength" in data

    def test_signals_has_breadth(self, client):
        data = client.get("/api/market/signals").json()
        assert "breadth" in data

    def test_signals_has_regimes(self, client):
        data = client.get("/api/market/signals").json()
        assert "regimes" in data

    def test_signals_has_top_correlations(self, client):
        data = client.get("/api/market/signals").json()
        assert "top_correlations" in data


class TestSparklines:
    def test_sparklines_returns_200(self, client):
        response = client.get("/api/market/sparklines")
        assert response.status_code == 200

    def test_sparklines_is_dict(self, client):
        data = client.get("/api/market/sparklines").json()
        assert isinstance(data, dict)

    def test_sparklines_has_23_entries(self, client):
        data = client.get("/api/market/sparklines").json()
        assert len(data) == 23


class TestMarketState:
    def test_market_state_returns_200(self, client):
        response = client.get("/api/market/state")
        assert response.status_code == 200

    def test_market_state_has_tickers(self, client):
        data = client.get("/api/market/state").json()
        assert "tickers" in data

    def test_market_state_has_market_mood(self, client):
        data = client.get("/api/market/state").json()
        assert "market_mood" in data


class TestPostTick:
    def test_tick_endpoint_returns_200(self, client):
        response = client.post("/api/market/tick")
        assert response.status_code == 200

    def test_tick_endpoint_returns_ticked_status(self, client):
        data = client.post("/api/market/tick").json()
        assert data.get("status") == "ticked"
