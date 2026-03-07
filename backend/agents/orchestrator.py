"""ADK Orchestrator -- coordinates all 5 agents using SequentialAgent + ParallelAgent."""

import json
import logging
import os

from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from memory.shared_state import shared_memory
from services.cache import snapshot_cache
from services.market_data import market_data_service
from services.news_feed import news_feed_service

logger = logging.getLogger(__name__)

APP_NAME = "neon_exchange"
_session_service = InMemorySessionService()
_session_created = False


def _build_market_context() -> str:
    """Build a compact market context string for agent consumption (from cache)."""
    snap = snapshot_cache.snapshot
    ticker_data = []
    for t in snap.all_tickers:
        ticker_data.append(
            f"{t['symbol']}: ${t['price']:.2f} ({t['change_pct']:+.1f}%) vol={t['volume']} "
            f"trend={t['trend']} momentum={t['momentum']:.2f} volatility={t['volatility_regime']}"
        )

    news_lines = [f"- {n['headline']} [{n['severity']}]" for n in snap.news_feed[:5]]

    ctx = (
        "CURRENT MARKET STATE:\n"
        + "\n".join(ticker_data)
        + "\n\nRECENT NEWS:\n"
        + "\n".join(news_lines)
        + "\n\nDISTRICTS: chip-docks(tech), bank-towers(finance), energy-yard(energy), "
        "industrials-foundry(industrials), consumer-strip(consumer), "
        "crypto-alley(crypto), bio-dome(healthcare), comms-neon-ridge(telecom)"
    )

    # Append signals summary if available
    signals = snap.signals
    if signals.get("sector_strength"):
        strength_lines = [
            f"  {s}: strength={d['strength']:.2f} rank={d['rank']} {d['trend']}"
            for s, d in signals["sector_strength"].items()
        ]
        ctx += "\n\nSECTOR STRENGTH:\n" + "\n".join(strength_lines)
    if signals.get("top_correlations"):
        corr_lines = [
            f"  {c['a']} <-> {c['b']}: {c['r']:.2f}"
            for c in signals["top_correlations"][:5]
        ]
        ctx += "\n\nTOP CORRELATIONS:\n" + "\n".join(corr_lines)
    if signals.get("breadth"):
        b = signals["breadth"]
        ctx += f"\n\nMARKET BREADTH: {b.get('advancers', 0)} up / {b.get('decliners', 0)} down"

    return ctx


# --- Tool functions injected into agents ---

def get_market_data() -> dict:
    """Retrieves current market data for all tickers including price, volume, trend, and momentum.

    Returns:
        dict: Market data with ticker states and district information.
    """
    snap = snapshot_cache.snapshot
    return {
        "tickers": snap.all_tickers,
        "districts": {
            did: d["tickers"] for did, d in snap.district_summaries.items()
        },
    }


def get_news_feed() -> dict:
    """Retrieves recent financial news headlines with severity and sector classification.

    Returns:
        dict: Recent news items with headline, sector, severity, and affected tickers.
    """
    return {"headlines": snapshot_cache.snapshot.news_feed}


def get_correlation_context() -> dict:
    """Retrieves current market state and agent conclusions for correlation analysis.

    Returns:
        dict: Market state, signals, and any existing agent analysis results.
    """
    snap = snapshot_cache.snapshot
    return {
        "market": get_market_data(),
        "signals": snap.signals,
        "agent_conclusions": shared_memory.agent_conclusions,
    }


def get_scenario_context() -> dict:
    """Retrieves all available intelligence for scenario generation including market, news, and correlations.

    Returns:
        dict: Combined context from market data, news, and agent analyses.
    """
    return {
        "market": get_market_data(),
        "news": get_news_feed(),
        "agent_conclusions": shared_memory.agent_conclusions,
        "active_scenarios": [
            s if isinstance(s, dict) else s.model_dump()
            for s in shared_memory.active_scenarios
        ],
    }


def get_world_context() -> dict:
    """Retrieves all agent outputs for world rendering including market state, scenarios, and analyses.

    Returns:
        dict: Full context needed to render the cyberpunk city world state.
    """
    return {
        "market": get_market_data(),
        "agent_conclusions": shared_memory.agent_conclusions,
        "active_scenarios": [
            s if isinstance(s, dict) else s.model_dump()
            for s in shared_memory.active_scenarios
        ],
    }


# --- Agent definitions ---

market_analyst = LlmAgent(
    name="market_analyst",
    model="gemini-2.5-flash",
    description="Analyzes live market data to identify trends, momentum, and volatility regimes for each ticker and district.",
    instruction="""You are the Market Analyst for NEON EXCHANGE, a cyberpunk city where stocks are NPCs.
Analyze the provided market data and produce structured analysis.
Focus on: trend direction, momentum strength, volatility regime, and notable movers.
Think like a senior quant analyst. Use the get_market_data tool to fetch current data.""",
    tools=[get_market_data],
    output_key="market_analysis",
)

news_analyst = LlmAgent(
    name="news_analyst",
    model="gemini-2.5-flash",
    description="Classifies and maps news headlines to tickers, districts, and severity levels.",
    instruction="""You are the News Analyst for NEON EXCHANGE. Classify incoming news headlines.
Map each story to affected tickers and city districts. Score severity and sentiment.
Generate newsstand updates for each district's kiosk display.
Districts: chip-docks (tech), bank-towers (finance), energy-yard (energy), industrials-foundry (industrials), consumer-strip (consumer), crypto-alley (crypto), bio-dome (healthcare), comms-neon-ridge (telecom).
Use the get_news_feed tool to fetch current headlines.""",
    tools=[get_news_feed],
    output_key="news_analysis",
)

correlation_agent = LlmAgent(
    name="correlation_agent",
    model="gemini-2.5-flash",
    description="Tracks relationships between tickers and identifies contagion paths across districts.",
    instruction="""You are the Correlation Agent for NEON EXCHANGE. Analyze relationships between stocks.
Identify alliances (stocks moving together), contagion paths (how a move in one stock spreads),
and district links. Use the get_correlation_context tool to fetch data.""",
    tools=[get_correlation_context],
    output_key="correlation_analysis",
)

scenario_generator = LlmAgent(
    name="scenario_generator",
    model="gemini-2.5-pro",
    description="Generates plausible market scenarios based on all available intelligence.",
    instruction="""You are the Scenario Generator for NEON EXCHANGE. Using market analysis, news, and correlations,
generate 2-4 plausible scenarios for what happens next in the city.
Types: continuation (trend continues), reversal (trend reverses), shock (unexpected event).
Each scenario should feel like a story arc in the cyberpunk city. Be creative but grounded.
Assign realistic probabilities. Use get_scenario_context tool to fetch intelligence.""",
    tools=[get_scenario_context],
    output_key="scenario_output",
)

world_renderer = LlmAgent(
    name="world_renderer",
    model="gemini-2.5-flash",
    description="Translates all AI analysis into visual city updates for the frontend.",
    instruction="""You are the World Renderer for NEON EXCHANGE. Transform market intelligence into
visual city state. Map market conditions to:
- weather: volatility -> storms, calm -> clear
- traffic: volume -> congestion levels
- NPC moods: bullish -> excited, bearish -> nervous
- district glow: performance -> brightness
- ambient: overall market mood -> sky color, music intensity

Use get_world_context tool. Output a structured world state update.
Be cinematic but consistent.""",
    tools=[get_world_context],
    output_key="world_render",
)

# --- Orchestration: parallel fan-out then sequential pipeline ---

parallel_analysts = ParallelAgent(
    name="parallel_analysts",
    sub_agents=[market_analyst, news_analyst, correlation_agent],
)

full_pipeline = SequentialAgent(
    name="neon_orchestrator",
    sub_agents=[parallel_analysts, scenario_generator, world_renderer],
)


async def run_orchestrator(query: str, context: dict | None) -> dict:
    """Run the full agent pipeline and return results."""
    global _session_created

    if not _session_created:
        await _session_service.create_session(
            app_name=APP_NAME, user_id="system", session_id="main"
        )
        _session_created = True

    # Cache handles tick generation; just read current state
    market_context = _build_market_context()
    full_query = f"{query}\n\n{market_context}"

    runner = Runner(
        agent=full_pipeline,
        app_name=APP_NAME,
        session_service=_session_service,
    )

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=full_query)],
    )

    results = {}
    async for event in runner.run_async(
        user_id="system", session_id="main", new_message=content
    ):
        if event.is_final_response() and event.content and event.content.parts:
            text = event.content.parts[0].text if event.content.parts[0].text else ""
            results["final_response"] = text

            # Try to parse as JSON for structured data
            try:
                parsed = json.loads(text)
                results["structured"] = parsed
            except (json.JSONDecodeError, TypeError):
                pass

    # Store agent conclusions in shared memory
    for key in ["market_analysis", "news_analysis", "correlation_analysis", "scenario_output", "world_render"]:
        if key in results.get("structured", {}):
            shared_memory.set_agent_conclusion(key, results["structured"][key])

    # Also store the final response
    shared_memory.set_agent_conclusion("last_orchestrator_run", results)

    logger.info(f"Orchestrator run complete. Keys: {list(results.keys())}")
    return results
