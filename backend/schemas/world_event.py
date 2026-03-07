from pydantic import BaseModel

from schemas.district import DistrictState
from schemas.market import MarketState


class WorldEvent(BaseModel):
    event_id: str
    event_type: str
    district_id: str | None = None
    ticker: str | None = None
    payload: dict
    timestamp: str
    source_agent: str


class WorldUpdatePayload(BaseModel):
    events: list[WorldEvent]
    districts: list[DistrictState]
    market_snapshot: MarketState | None = None
