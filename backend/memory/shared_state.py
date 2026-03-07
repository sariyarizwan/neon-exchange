import threading
from typing import Optional

from schemas.market import MarketState
from schemas.district import DistrictState
from schemas.scenario import ScenarioBranch
from schemas.world_event import WorldEvent
from schemas.contracts import SessionBootstrap


class SharedMemory:
    """Singleton in-memory shared state for all agents and services."""

    _instance: Optional["SharedMemory"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "SharedMemory":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._state_lock = threading.Lock()
        self.current_market_state: MarketState | None = None
        self.district_states: dict[str, DistrictState] = {}
        self.active_scenarios: list[ScenarioBranch] = []
        self.event_log: list[WorldEvent] = []
        self.recent_news: list[dict] = []
        self.agent_conclusions: dict[str, dict] = {}

    # -- Market --

    def update_market_state(self, state: MarketState) -> None:
        with self._state_lock:
            self.current_market_state = state

    # -- Districts --

    def update_district(self, district_id: str, state: DistrictState) -> None:
        with self._state_lock:
            self.district_states[district_id] = state

    # -- Scenarios --

    def add_scenario(self, scenario: ScenarioBranch) -> None:
        with self._state_lock:
            self.active_scenarios.append(scenario)

    def invalidate_scenario(self, scenario_id: str) -> None:
        with self._state_lock:
            self.active_scenarios = [
                s for s in self.active_scenarios if s.id != scenario_id
            ]

    # -- Events --

    def log_event(self, event: WorldEvent) -> None:
        with self._state_lock:
            self.event_log.append(event)
            if len(self.event_log) > 1000:
                self.event_log = self.event_log[-1000:]

    # -- News --

    def add_news(self, headline_dict: dict) -> None:
        with self._state_lock:
            self.recent_news.append(headline_dict)
            if len(self.recent_news) > 50:
                self.recent_news = self.recent_news[-50:]

    # -- Agent conclusions --

    def set_agent_conclusion(self, agent_name: str, conclusion: dict) -> None:
        with self._state_lock:
            self.agent_conclusions[agent_name] = conclusion

    # -- Accessors --

    def get_context_for_agents(self) -> dict:
        with self._state_lock:
            return {
                "market_state": self.current_market_state.model_dump() if self.current_market_state else None,
                "districts": {k: v.model_dump() for k, v in self.district_states.items()},
                "active_scenarios": [s.model_dump() for s in self.active_scenarios],
                "recent_events": [e.model_dump() for e in self.event_log[-50:]],
                "recent_news": list(self.recent_news),
                "agent_conclusions": dict(self.agent_conclusions),
            }

    def get_bootstrap(self) -> dict:
        with self._state_lock:
            ms = self.current_market_state
            if isinstance(ms, dict):
                market = ms
            elif ms is not None:
                market = ms.model_dump()
            else:
                market = {"tickers": [], "timestamp": "", "market_mood": "unknown"}

            districts = []
            for v in self.district_states.values():
                districts.append(v.model_dump() if hasattr(v, "model_dump") else v)

            scenarios = []
            for s in self.active_scenarios:
                scenarios.append(s.model_dump() if hasattr(s, "model_dump") else s)

            return {
                "market_state": market,
                "districts": districts,
                "scenarios": scenarios,
                "recent_news": list(self.recent_news),
            }


shared_memory = SharedMemory()
