from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field


# --- Output Schema ---

class DistrictUpdate(BaseModel):
    district_id: str = Field(description="District identifier, e.g. chip_docks")
    weather: str = Field(description="Weather condition: clear, rain, storm, or fog")
    traffic: str = Field(description="Traffic level: low, normal, heavy, or gridlock")
    mood: str = Field(description="District mood: calm, tense, euphoric, or panic")
    glow_intensity: float = Field(description="Neon glow intensity from 0.0 to 1.0")
    special_effects: list[str] = Field(
        description="Active visual effects, e.g. neon_flicker, rain, lightning"
    )


class TickerUpdate(BaseModel):
    symbol: str = Field(description="Ticker symbol")
    npc_mood: str = Field(description="NPC emotional state, e.g. confident, nervous, euphoric")
    glow_color: str = Field(description="Hex color for the NPC glow, e.g. #00ff88")
    animation: str = Field(description="Animation state: idle, excited, nervous, celebrating, fleeing")


class CityEvent(BaseModel):
    event_type: str = Field(description="Type of city event, e.g. parade, riot, blackout")
    description: str = Field(description="Narrative description of the event")
    location: str = Field(description="District ID where the event occurs")
    duration_seconds: int = Field(description="Duration of the event in seconds")


class Ambient(BaseModel):
    global_mood: str = Field(description="Overall city mood descriptor")
    sky_color: str = Field(description="Sky color as a description or hex value")
    music_intensity: float = Field(description="Background music intensity from 0.0 to 1.0")


class WorldRenderOutput(BaseModel):
    district_updates: list[DistrictUpdate] = Field(
        description="Visual state updates for each city district"
    )
    ticker_updates: list[TickerUpdate] = Field(
        description="Visual state updates for each ticker NPC"
    )
    city_events: list[CityEvent] = Field(
        description="Special city-wide events triggered by market conditions"
    )
    ambient: Ambient = Field(
        description="Global ambient settings for the city"
    )


# --- Agent ---

world_renderer = LlmAgent(
    name="world_renderer",
    model="gemini-2.5-flash",
    description="Translates all AI analysis into visual city updates for the frontend",
    instruction="""You are the World Renderer for NEON EXCHANGE. Transform market intelligence into
visual city state. Map market conditions to weather (volatility=storms), traffic (volume=congestion),
NPC moods, district glow, and ambient effects. Make the city feel alive and responsive to market data.
Be cinematic but consistent. A bullish tech sector means chip_docks glows bright with clear skies.
A market crash means storms across all districts with panicked NPCs.""",
    output_schema=WorldRenderOutput,
    output_key="world_render",
)
