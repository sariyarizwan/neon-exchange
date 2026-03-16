"""Shared fixtures for backend tests."""

import os
import pytest

# Ensure no real API calls during tests
os.environ.pop("FINNHUB_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)


@pytest.fixture(autouse=True)
def _reset_singletons():
    """Reset singleton services between tests."""
    from services.market_data import MarketDataService
    from services.news_feed import NewsFeedService

    # Reset singleton instances so each test gets fresh state
    MarketDataService._instance = None
    NewsFeedService._instance = None
    yield


@pytest.fixture
def market_service():
    """Fresh MarketDataService in mock mode (no API key)."""
    from services.market_data import MarketDataService
    return MarketDataService()


@pytest.fixture
def news_service():
    """Fresh NewsFeedService in mock mode (no API key)."""
    from services.news_feed import NewsFeedService
    return NewsFeedService()
