from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field


# --- Output Schema ---

class ClassifiedStory(BaseModel):
    headline: str = Field(description="Original news headline")
    category: str = Field(description="Category: earnings, macro, sector, rumor, or breaking")
    severity: str = Field(description="Severity level: low, medium, high, or critical")
    affected_tickers: list[str] = Field(description="List of ticker symbols affected by this story")
    affected_districts: list[str] = Field(description="List of city districts affected")
    sentiment: str = Field(description="Sentiment: positive, negative, or neutral")


class CatalystEvent(BaseModel):
    event_name: str = Field(description="Name of the potential catalyst event")
    probability: float = Field(description="Estimated probability of occurrence (0-1)")
    impact_description: str = Field(description="Description of potential market impact")


class NewsAnalysis(BaseModel):
    classified_stories: list[ClassifiedStory] = Field(
        description="All news stories classified with metadata"
    )
    catalyst_events: list[CatalystEvent] = Field(
        description="Potential catalyst events identified from the news"
    )
    newsstand_updates: dict[str, list[str]] = Field(
        description="Mapping of district_id to list of headline strings for kiosk display"
    )


# --- Tool ---

def get_news_feed() -> dict:
    """Retrieves the current news feed for analysis. Returns mock news context that will be injected at runtime."""
    return {
        "status": "news_feed_placeholder",
        "message": "News feed will be injected at runtime via session state or tool override.",
    }


# --- Agent ---

news_analyst = LlmAgent(
    name="news_analyst",
    model="gemini-2.5-flash",
    description="Classifies and maps news headlines to tickers and districts",
    instruction="""You are the News Analyst for NEON EXCHANGE. Classify incoming news headlines.
Map each story to affected tickers and city districts. Score severity and sentiment.
Generate newsstand updates for each district's kiosk display.
Districts: chip_docks (tech), bank_towers (finance), energy_yard (energy), pharma_heights (healthcare), crypto_alley (crypto).""",
    output_schema=NewsAnalysis,
    output_key="news_analysis",
    tools=[get_news_feed],
)
