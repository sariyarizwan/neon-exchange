from pydantic import BaseModel, Field
from typing import Literal


class DistrictState(BaseModel):
    district_id: str
    name: str
    sector: str
    weather: Literal["clear", "rain", "storm", "fog"]
    traffic: Literal["low", "normal", "heavy", "gridlock"]
    mood: Literal["calm", "tense", "euphoric", "panic"]
    glow_intensity: float = Field(ge=0.0, le=1.0)
    active_tickers: list[str]
