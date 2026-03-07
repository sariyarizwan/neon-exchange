from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field


# --- Output Schema ---

class Alliance(BaseModel):
    tickers: list[str] = Field(description="List of correlated ticker symbols")
    strength: float = Field(description="Correlation strength from 0.0 to 1.0")
    type: str = Field(description="Alliance type: sector, momentum, or inverse")


class ContagionPath(BaseModel):
    source_ticker: str = Field(description="Ticker that originates the contagion")
    affected_tickers: list[str] = Field(description="Tickers affected by the contagion")
    mechanism: str = Field(description="Description of how the contagion spreads")
    probability: float = Field(description="Probability of contagion occurring (0-1)")


class DistrictLink(BaseModel):
    from_district: str = Field(description="Source district ID")
    to_district: str = Field(description="Target district ID")
    link_type: str = Field(description="Type of inter-district link")
    strength: float = Field(description="Link strength from 0.0 to 1.0")


class CorrelationAnalysis(BaseModel):
    alliances: list[Alliance] = Field(
        description="Groups of correlated tickers (stocks moving together)"
    )
    contagion_paths: list[ContagionPath] = Field(
        description="Paths through which price movements spread between tickers"
    )
    district_links: list[DistrictLink] = Field(
        description="Links between city districts showing sector influence"
    )


# --- Tool ---

def get_correlation_context() -> dict:
    """Retrieves correlation context data for analysis. Returns mock context that will be injected at runtime."""
    return {
        "status": "correlation_context_placeholder",
        "message": "Correlation context will be injected at runtime via session state or tool override.",
    }


# --- Agent ---

correlation_agent = LlmAgent(
    name="correlation_agent",
    model="gemini-2.5-flash",
    description="Tracks relationships between tickers and identifies contagion paths",
    instruction="""You are the Correlation Agent for NEON EXCHANGE. Analyze relationships between stocks.
Identify alliances (stocks moving together), contagion paths (how a move in one stock spreads),
and district links (how sectors influence each other). Think in terms of the city's social network.""",
    output_schema=CorrelationAnalysis,
    output_key="correlation_analysis",
    tools=[get_correlation_context],
)
