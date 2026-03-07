from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field


# --- Output Schema ---

class TickerSummary(BaseModel):
    symbol: str = Field(description="Ticker symbol, e.g. AAPL")
    trend: str = Field(description="Trend direction: up, down, or sideways")
    momentum_score: float = Field(description="Momentum score from -1.0 (strong down) to 1.0 (strong up)")
    volatility_level: str = Field(description="Volatility regime: low, normal, high, extreme")
    recommendation: str = Field(description="Action recommendation: buy, sell, hold, watch")


class MarketAnalysis(BaseModel):
    ticker_summaries: list[TickerSummary] = Field(
        description="Analysis summary for each tracked ticker"
    )
    market_mood: str = Field(
        description="Overall market mood: bullish, bearish, cautious, euphoric, or fearful"
    )
    key_movers: list[str] = Field(
        description="Top 3 tickers driving the market right now"
    )
    analysis_summary: str = Field(
        description="2-3 sentence summary of current market conditions"
    )


# --- Tool ---

def get_market_data() -> dict:
    """Retrieves current market data for analysis. Returns mock market context that will be injected at runtime."""
    return {
        "status": "market_data_placeholder",
        "message": "Market data will be injected at runtime via session state or tool override.",
    }


# --- Agent ---

market_analyst = LlmAgent(
    name="market_analyst",
    model="gemini-2.5-flash",
    description="Analyzes live market data to identify trends, momentum, and volatility regimes",
    instruction="""You are the Market Analyst for NEON EXCHANGE, a cyberpunk city where stocks are NPCs.
Analyze the provided market data and produce structured analysis.
Focus on: trend direction, momentum strength, volatility regime, and notable movers.
Think like a senior quant analyst but express results in a way that maps to a living city.""",
    output_schema=MarketAnalysis,
    output_key="market_analysis",
    tools=[get_market_data],
)
