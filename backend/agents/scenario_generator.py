from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field


# --- Output Schema ---

class Scenario(BaseModel):
    id: str = Field(description="Unique scenario ID (UUID format)")
    title: str = Field(description="Short descriptive title for the scenario")
    type: str = Field(description="Scenario type: continuation, reversal, or shock")
    probability: float = Field(description="Probability of this scenario occurring (0-1)")
    description: str = Field(description="Detailed narrative description of the scenario")
    affected_tickers: list[str] = Field(description="Tickers most impacted by this scenario")
    affected_districts: list[str] = Field(description="City districts most impacted")
    severity: str = Field(description="Impact severity: low, medium, high, or critical")
    time_horizon: str = Field(description="Expected timeframe, e.g. '1h', '4h', '1d', '1w'")


class ScenarioOutput(BaseModel):
    scenarios: list[Scenario] = Field(
        description="2-4 plausible scenarios for what happens next in the city"
    )
    invalidated_scenarios: list[str] = Field(
        description="IDs of previously generated scenarios that are no longer valid"
    )


# --- Agent ---

scenario_generator = LlmAgent(
    name="scenario_generator",
    model="gemini-2.5-pro",
    description="Generates market scenarios based on all available intelligence",
    instruction="""You are the Scenario Generator for NEON EXCHANGE. Using market analysis, news, and correlations,
generate 2-4 plausible scenarios for what happens next in the city.
Types: continuation (trend continues), reversal (trend reverses), shock (unexpected event).
Each scenario should feel like a story arc in the cyberpunk city. Be creative but grounded in the data.
Assign realistic probabilities that sum to roughly 1.0.""",
    output_schema=ScenarioOutput,
    output_key="scenario_output",
)
