"""Tests for memory/shared_state.py — singleton, thread safety, caps."""

import threading
import time
import pytest
from schemas.market import MarketState, TickerState
from schemas.district import DistrictState
from schemas.scenario import ScenarioBranch
from schemas.world_event import WorldEvent


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_shared_memory():
    """Reset SharedMemory singleton between tests."""
    from memory.shared_state import SharedMemory
    # Force re-initialization
    SharedMemory._instance = None
    yield
    SharedMemory._instance = None


@pytest.fixture
def shared():
    """Fresh SharedMemory instance."""
    from memory.shared_state import SharedMemory
    return SharedMemory()


def _make_ticker_state(**overrides) -> TickerState:
    defaults = dict(
        symbol="NVDA",
        name="Nova Vect Systems",
        sector="Tech",
        district_id="chip-docks",
        price=130.5,
        change_pct=1.2,
        volume=1_000_000,
        trend="bullish",
        momentum=0.24,
        volatility_regime="normal",
        neon_id="nvx",
        neon_symbol="NVX",
    )
    defaults.update(overrides)
    return TickerState(**defaults)


def _make_market_state(n_tickers: int = 1) -> MarketState:
    tickers = [_make_ticker_state() for _ in range(n_tickers)]
    return MarketState(tickers=tickers, timestamp="2026-03-15T10:00:00", market_mood="bullish")


def _make_district_state() -> DistrictState:
    return DistrictState(
        district_id="chip-docks",
        name="CHIP DOCKS",
        sector="Tech",
        weather="clear",
        traffic="normal",
        mood="calm",
        glow_intensity=0.5,
        active_tickers=["nvx"],
    )


def _make_scenario() -> ScenarioBranch:
    return ScenarioBranch(
        id="s1",
        title="Chip Rally",
        type="continuation",
        probability=0.7,
        description="Chips go up",
        affected_tickers=["nvx"],
        affected_districts=["chip-docks"],
        severity="low",
        created_at="2026-03-15T10:00:00",
    )


def _make_world_event() -> WorldEvent:
    return WorldEvent(
        event_id="e1",
        event_type="market_move",
        district_id="chip-docks",
        ticker="nvx",
        payload={"change": 2.5},
        timestamp="2026-03-15T10:00:00",
        source_agent="test_agent",
    )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

class TestSingleton:
    def test_same_instance_returned_each_time(self, reset_shared_memory):
        from memory.shared_state import SharedMemory
        a = SharedMemory()
        b = SharedMemory()
        assert a is b

    def test_singleton_id_stable(self, reset_shared_memory):
        from memory.shared_state import SharedMemory
        a = SharedMemory()
        assert id(a) == id(SharedMemory())

    def test_initialized_flag_set(self, shared):
        assert shared._initialized is True


# ---------------------------------------------------------------------------
# update_market_state / get_context_for_agents
# ---------------------------------------------------------------------------

class TestUpdateMarketState:
    def test_stores_market_state(self, shared):
        state = _make_market_state()
        shared.update_market_state(state)
        assert shared.current_market_state is state

    def test_get_context_includes_market_state(self, shared):
        state = _make_market_state()
        shared.update_market_state(state)
        ctx = shared.get_context_for_agents()
        assert ctx["market_state"] is not None

    def test_get_context_market_state_is_dict(self, shared):
        state = _make_market_state()
        shared.update_market_state(state)
        ctx = shared.get_context_for_agents()
        assert isinstance(ctx["market_state"], dict)

    def test_get_context_market_state_none_when_not_set(self, shared):
        ctx = shared.get_context_for_agents()
        assert ctx["market_state"] is None


# ---------------------------------------------------------------------------
# add_news
# ---------------------------------------------------------------------------

class TestAddNews:
    def test_add_news_stored(self, shared):
        shared.add_news({"headline": "Test headline"})
        assert len(shared.recent_news) == 1

    def test_add_news_respects_50_cap(self, shared):
        for i in range(60):
            shared.add_news({"headline": f"Headline {i}"})
        assert len(shared.recent_news) == 50

    def test_add_news_keeps_most_recent(self, shared):
        for i in range(60):
            shared.add_news({"headline": f"Headline {i}"})
        # The last item should be the most recent
        assert shared.recent_news[-1]["headline"] == "Headline 59"

    def test_add_news_appears_in_context(self, shared):
        shared.add_news({"headline": "Market surge"})
        ctx = shared.get_context_for_agents()
        assert len(ctx["recent_news"]) == 1


# ---------------------------------------------------------------------------
# log_event
# ---------------------------------------------------------------------------

class TestLogEvent:
    def test_log_event_stored(self, shared):
        event = _make_world_event()
        shared.log_event(event)
        assert len(shared.event_log) == 1

    def test_log_event_respects_1000_cap(self, shared):
        for i in range(1050):
            e = WorldEvent(
                event_id=f"e{i}",
                event_type="move",
                payload={"i": i},
                timestamp="2026-03-15T10:00:00",
                source_agent="test",
            )
            shared.log_event(e)
        assert len(shared.event_log) == 1000

    def test_log_event_keeps_most_recent(self, shared):
        for i in range(1050):
            e = WorldEvent(
                event_id=f"e{i}",
                event_type="move",
                payload={"i": i},
                timestamp="2026-03-15T10:00:00",
                source_agent="test",
            )
            shared.log_event(e)
        # Most recent 1000 events kept; last one should have id e1049
        assert shared.event_log[-1].event_id == "e1049"


# ---------------------------------------------------------------------------
# get_context_for_agents — expected keys
# ---------------------------------------------------------------------------

class TestGetContextForAgents:
    def test_all_expected_keys_present(self, shared):
        ctx = shared.get_context_for_agents()
        for key in ("market_state", "districts", "active_scenarios", "recent_events",
                    "recent_news", "agent_conclusions"):
            assert key in ctx

    def test_districts_is_dict(self, shared):
        ctx = shared.get_context_for_agents()
        assert isinstance(ctx["districts"], dict)

    def test_active_scenarios_is_list(self, shared):
        ctx = shared.get_context_for_agents()
        assert isinstance(ctx["active_scenarios"], list)

    def test_recent_events_limited_to_50(self, shared):
        for i in range(200):
            e = WorldEvent(
                event_id=f"e{i}",
                event_type="move",
                payload={},
                timestamp="2026-03-15T10:00:00",
                source_agent="test",
            )
            shared.log_event(e)
        ctx = shared.get_context_for_agents()
        assert len(ctx["recent_events"]) == 50


# ---------------------------------------------------------------------------
# Thread safety
# ---------------------------------------------------------------------------

class TestDistrictUpdate:
    def test_update_district_stored(self, shared):
        ds = _make_district_state()
        shared.update_district("chip-docks", ds)
        assert "chip-docks" in shared.district_states
        assert shared.district_states["chip-docks"] is ds

    def test_update_district_appears_in_context(self, shared):
        ds = _make_district_state()
        shared.update_district("chip-docks", ds)
        ctx = shared.get_context_for_agents()
        assert "chip-docks" in ctx["districts"]


class TestScenarioManagement:
    def test_add_scenario_stored(self, shared):
        s = _make_scenario()
        shared.add_scenario(s)
        assert len(shared.active_scenarios) == 1

    def test_add_scenario_appears_in_context(self, shared):
        s = _make_scenario()
        shared.add_scenario(s)
        ctx = shared.get_context_for_agents()
        assert len(ctx["active_scenarios"]) == 1

    def test_invalidate_scenario_removes_it(self, shared):
        s = _make_scenario()
        shared.add_scenario(s)
        shared.invalidate_scenario("s1")
        assert len(shared.active_scenarios) == 0

    def test_invalidate_unknown_scenario_safe(self, shared):
        """Invalidating a nonexistent id should not crash."""
        shared.invalidate_scenario("doesnotexist")
        assert len(shared.active_scenarios) == 0


class TestAgentConclusions:
    def test_set_agent_conclusion(self, shared):
        shared.set_agent_conclusion("market_analyst", {"summary": "Bullish", "timestamp": 1234567890})
        assert "market_analyst" in shared.agent_conclusions

    def test_agent_conclusion_in_context(self, shared):
        shared.set_agent_conclusion("market_analyst", {"summary": "Bullish", "timestamp": 1234567890})
        ctx = shared.get_context_for_agents()
        assert "market_analyst" in ctx["agent_conclusions"]


class TestGetBootstrap:
    def test_get_bootstrap_has_required_keys(self, shared):
        bootstrap = shared.get_bootstrap()
        for key in ("market_state", "districts", "scenarios", "recent_news"):
            assert key in bootstrap

    def test_get_bootstrap_market_state_default_when_none(self, shared):
        bootstrap = shared.get_bootstrap()
        # When current_market_state is None, should return fallback dict
        assert isinstance(bootstrap["market_state"], dict)

    def test_get_bootstrap_includes_set_market_state(self, shared):
        state = _make_market_state()
        shared.update_market_state(state)
        bootstrap = shared.get_bootstrap()
        assert bootstrap["market_state"]["market_mood"] == "bullish"


class TestThreadSafety:
    def test_concurrent_add_news_does_not_crash(self, shared):
        """Concurrent writes from multiple threads should not corrupt state."""
        errors: list[Exception] = []

        def add_news_thread(idx: int) -> None:
            try:
                for j in range(10):
                    shared.add_news({"headline": f"Thread {idx} item {j}"})
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=add_news_thread, args=(i,)) for i in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        # 10 threads * 10 items = 100 items → capped at 50
        assert len(shared.recent_news) == 50

    def test_concurrent_log_event_does_not_crash(self, shared):
        errors: list[Exception] = []

        def log_thread(idx: int) -> None:
            try:
                for j in range(20):
                    e = WorldEvent(
                        event_id=f"t{idx}-e{j}",
                        event_type="move",
                        payload={},
                        timestamp="2026-03-15T10:00:00",
                        source_agent="test",
                    )
                    shared.log_event(e)
            except Exception as exc:
                errors.append(exc)

        threads = [threading.Thread(target=log_thread, args=(i,)) for i in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0

    def test_concurrent_update_market_state_does_not_crash(self, shared):
        errors: list[Exception] = []

        def update_thread() -> None:
            try:
                for _ in range(20):
                    shared.update_market_state(_make_market_state())
            except Exception as exc:
                errors.append(exc)

        threads = [threading.Thread(target=update_thread) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        assert shared.current_market_state is not None
