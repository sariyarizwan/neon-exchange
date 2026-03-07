from pydantic import BaseModel
from typing import Literal


class ScenarioBranch(BaseModel):
    id: str
    title: str
    type: Literal["continuation", "reversal", "shock"]
    probability: float
    description: str
    affected_tickers: list[str]
    affected_districts: list[str]
    severity: Literal["low", "medium", "high", "critical"]
    created_at: str
    expires_at: str | None = None


class ScenarioUpdate(BaseModel):
    active_scenarios: list[ScenarioBranch]
    invalidated_ids: list[str]
