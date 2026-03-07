import logging
import traceback

from fastapi import APIRouter
from pydantic import BaseModel

from agents.orchestrator import run_orchestrator
from memory.shared_state import shared_memory

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentQueryRequest(BaseModel):
    query: str
    context: dict | None = None


@router.post("/query")
async def query_agents(req: AgentQueryRequest):
    """Run an ad-hoc query through the agent orchestrator."""
    try:
        result = await run_orchestrator(req.query, req.context)
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Agent query failed: {e}\n{traceback.format_exc()}")
        return {"status": "error", "error": str(e)}


@router.post("/analyze")
async def run_full_analysis():
    """Trigger a full market analysis cycle through all agents."""
    try:
        result = await run_orchestrator(
            "Analyze current market conditions, news, correlations, generate scenarios, and render world state.",
            None,
        )
        return {"status": "ok", "result": result}
    except Exception as e:
        logger.error(f"Full analysis failed: {e}\n{traceback.format_exc()}")
        return {"status": "error", "error": str(e)}


@router.get("/conclusions")
async def get_agent_conclusions():
    """Return the latest conclusions from each agent."""
    return shared_memory.agent_conclusions


@router.get("/bootstrap")
async def get_bootstrap():
    """Return full session bootstrap payload for frontend initialization."""
    return shared_memory.get_bootstrap()
