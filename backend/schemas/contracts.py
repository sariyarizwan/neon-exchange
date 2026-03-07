from pydantic import BaseModel

from schemas.market import MarketState
from schemas.district import DistrictState
from schemas.scenario import ScenarioBranch


class AgentQueryRequest(BaseModel):
    query: str
    context: dict | None = None


class AgentQueryResponse(BaseModel):
    response: str
    agent: str
    structured_data: dict | None = None
    confidence: float


class SessionBootstrap(BaseModel):
    market_state: MarketState
    districts: list[DistrictState]
    scenarios: list[ScenarioBranch]
    recent_news: list[dict]
