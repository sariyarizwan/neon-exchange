import asyncio
import json
import logging

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from memory.shared_state import shared_memory
from services.market_data import market_data_service
from agents.orchestrator import run_orchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/world", tags=["world"])


@router.get("/state")
async def get_world_state():
    """Return current full world state snapshot."""
    return shared_memory.get_bootstrap()


@router.get("/stream")
async def world_stream(request: Request):
    """SSE stream that emits world updates every 2 seconds.

    Each tick:
    1. Advances market simulation
    2. Optionally runs agent analysis (every 10 ticks)
    3. Emits updated world state
    """

    async def event_generator():
        tick_count = 0
        while True:
            if await request.is_disconnected():
                break

            # Advance market
            market_data_service.generate_tick()
            tickers = market_data_service.get_all_tickers()
            shared_memory.update_market_state({
                "tickers": [t.model_dump() for t in tickers],
                "market_mood": _mood(tickers),
            })

            # Run full agent analysis every 10 ticks (~20 seconds)
            if tick_count % 10 == 0 and tick_count > 0:
                try:
                    await run_orchestrator(
                        "Analyze current market state and update world.",
                        None,
                    )
                except Exception as e:
                    logger.warning(f"Agent cycle failed: {e}")

            state = shared_memory.get_bootstrap()
            yield {
                "event": "world_update",
                "data": json.dumps(state, default=str),
            }

            tick_count += 1
            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())


@router.get("/events")
async def get_recent_events():
    """Return recent world events from the event log."""
    return {"events": [e if isinstance(e, dict) else e.model_dump() for e in shared_memory.event_log[-50:]]}


@router.get("/scenarios")
async def get_scenarios():
    """Return currently active scenarios."""
    return {
        "scenarios": [
            s if isinstance(s, dict) else s.model_dump()
            for s in shared_memory.active_scenarios
        ]
    }


@router.get("/news")
async def get_news():
    """Return recent news headlines."""
    return {"news": shared_memory.recent_news}


def _mood(tickers) -> str:
    if not tickers:
        return "neutral"
    avg = sum(t.change_pct for t in tickers) / len(tickers)
    if avg > 2:
        return "euphoric"
    elif avg > 0.5:
        return "bullish"
    elif avg < -2:
        return "fearful"
    elif avg < -0.5:
        return "bearish"
    return "cautious"
