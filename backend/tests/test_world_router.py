"""Integration tests for routers/world_router.py.

Uses FastAPI's TestClient (synchronous).
Cache is manually rebuilt before tests.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    """Create a TestClient with a pre-built cache snapshot."""
    from services.cache import snapshot_cache
    from main import app

    # Ensure snapshot is populated
    snapshot_cache._rebuild()

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


class TestWorldState:
    def test_world_state_returns_200(self, client):
        response = client.get("/api/world/state")
        assert response.status_code == 200

    def test_world_state_has_market_state(self, client):
        data = client.get("/api/world/state").json()
        assert "market_state" in data

    def test_world_state_has_districts(self, client):
        data = client.get("/api/world/state").json()
        assert "districts" in data

    def test_world_state_districts_count(self, client):
        data = client.get("/api/world/state").json()
        assert len(data["districts"]) == 8

    def test_world_state_has_recent_news(self, client):
        data = client.get("/api/world/state").json()
        assert "recent_news" in data


class TestWorldNews:
    def test_news_returns_200(self, client):
        response = client.get("/api/world/news")
        assert response.status_code == 200

    def test_news_has_news_key(self, client):
        data = client.get("/api/world/news").json()
        assert "news" in data

    def test_news_is_list(self, client):
        data = client.get("/api/world/news").json()
        assert isinstance(data["news"], list)

    def test_news_non_empty(self, client):
        data = client.get("/api/world/news").json()
        assert len(data["news"]) > 0

    def test_news_has_is_live_field(self, client):
        data = client.get("/api/world/news").json()
        assert "isLive" in data

    def test_news_is_live_false_in_mock_mode(self, client):
        data = client.get("/api/world/news").json()
        assert data["isLive"] is False


class TestWorldScenarios:
    def test_scenarios_returns_200(self, client):
        response = client.get("/api/world/scenarios")
        assert response.status_code == 200

    def test_scenarios_has_scenarios_key(self, client):
        data = client.get("/api/world/scenarios").json()
        assert "scenarios" in data

    def test_scenarios_is_list(self, client):
        data = client.get("/api/world/scenarios").json()
        assert isinstance(data["scenarios"], list)


class TestEvidenceFeed:
    def test_evidence_feed_returns_200(self, client):
        response = client.get("/api/world/evidence-feed")
        assert response.status_code == 200

    def test_evidence_feed_has_evidence_key(self, client):
        data = client.get("/api/world/evidence-feed").json()
        assert "evidence" in data

    def test_evidence_is_list(self, client):
        data = client.get("/api/world/evidence-feed").json()
        assert isinstance(data["evidence"], list)

    def test_evidence_items_have_id_and_text(self, client):
        """Each evidence item must have id, timestamp, and text."""
        data = client.get("/api/world/evidence-feed").json()
        for item in data["evidence"]:
            assert "id" in item
            assert "text" in item
            assert "timestamp" in item


class TestEvidenceFeedWithMarketMovers:
    def test_evidence_feed_includes_big_movers(self, client):
        """Force a big mover by manipulating cache state, then check evidence."""
        from services.cache import snapshot_cache

        # Inject a big mover into the snapshot
        snap = snapshot_cache.snapshot
        if snap.all_tickers:
            # Temporarily modify the first ticker to have a >3% change
            original_tickers = snap.all_tickers
            modified = [{**t, "change_pct": 5.0, "neon_id": t.get("neon_id", "nvx"),
                         "neon_symbol": t.get("neon_symbol", "NVX"),
                         "district_id": t.get("district_id", "chip-docks")}
                        if i == 0 else t
                        for i, t in enumerate(original_tickers)]
            snap.all_tickers = modified

            response = client.get("/api/world/evidence-feed")
            assert response.status_code == 200
            data = response.json()
            # Should have at least one mover item
            mover_items = [e for e in data["evidence"] if "surging" in e["text"] or "plunging" in e["text"]]
            assert len(mover_items) > 0

            # Restore original
            snap.all_tickers = original_tickers


class TestWorldEvents:
    def test_events_returns_200(self, client):
        response = client.get("/api/world/events")
        assert response.status_code == 200

    def test_events_has_events_key(self, client):
        data = client.get("/api/world/events").json()
        assert "events" in data

    def test_events_is_list(self, client):
        data = client.get("/api/world/events").json()
        assert isinstance(data["events"], list)
