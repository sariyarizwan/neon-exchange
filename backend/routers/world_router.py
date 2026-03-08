import asyncio
import hashlib
import logging
import time

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from memory.shared_state import shared_memory
from services.cache import snapshot_cache
from agents.orchestrator import run_orchestrator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/world", tags=["world"])


@router.get("/state")
async def get_world_state():
    """Return current full world state snapshot."""
    return snapshot_cache.snapshot.bootstrap


@router.get("/stream")
async def world_stream(request: Request):
    """SSE stream that emits world updates every 2 seconds.

    Cache rebuilds in the background. This loop just reads the
    pre-serialized snapshot and emits it — zero computation.
    Agent analysis runs every 10 ticks (~20 seconds).
    """

    async def event_generator():
        tick_count = 0
        while True:
            if await request.is_disconnected():
                break

            # Sync cache state into shared_memory for agent access
            snap = snapshot_cache.snapshot
            shared_memory.update_market_state(snap.market_state)

            # Run full agent analysis every 10 ticks (~20 seconds)
            if tick_count % 10 == 0 and tick_count > 0:
                try:
                    await run_orchestrator(
                        "Analyze current market state and update world.",
                        None,
                    )
                except Exception as e:
                    logger.warning(f"Agent cycle failed: {e}")

            yield {
                "event": "world_update",
                "data": snap.bootstrap_json,
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
    from services.news_feed import news_feed_service
    headlines = news_feed_service.get_recent(20)
    if not headlines:
        headlines = news_feed_service.generate_headlines(10)
    return {"news": headlines, "isLive": news_feed_service.is_live}


@router.get("/neon-stream")
async def neon_stream(request: Request):
    """SSE stream optimized for the frontend.

    Emits pre-computed neon-formatted market data (keyed by frontend ticker IDs)
    every 2 seconds. Zero computation — reads pre-serialized JSON from cache.
    Does NOT run the heavy agent pipeline — use /stream for that.
    """

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            yield {
                "event": "neon_update",
                "data": snapshot_cache.snapshot.neon_stream_json,
            }

            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())


@router.get("/evidence-feed")
async def get_evidence_feed():
    """Return evidence items for the frontend timeline.

    Merges agent conclusions with significant market events (big movers,
    regime changes) into EvidenceItem-compatible objects:
    {id, timestamp, text, districtId?, tickerId?}
    """
    items: list[dict] = []

    # 1. Agent conclusions → evidence
    conclusions = shared_memory.agent_conclusions
    for agent_name, conclusion in conclusions.items():
        text = conclusion.get("summary", conclusion.get("conclusion", ""))
        if not text:
            continue
        ts = conclusion.get("timestamp", time.time())
        ts_str = time.strftime("%H:%M", time.localtime(ts)) if isinstance(ts, (int, float)) else str(ts)
        item_id = f"agent-{agent_name}-{hashlib.md5(text[:50].encode()).hexdigest()[:8]}"
        items.append({
            "id": item_id,
            "timestamp": ts_str,
            "text": f"[{agent_name}] {text[:200]}",
        })

    # 2. Significant market events from snapshot
    snap = snapshot_cache.snapshot
    now_str = time.strftime("%H:%M", time.localtime(snap.timestamp)) if snap.timestamp else "00:00"

    # Big movers (|change| > 3%)
    for td in snap.all_tickers:
        change = td.get("change_pct", 0)
        if abs(change) >= 3.0:
            neon_id = td.get("neon_id", "")
            district_id = td.get("district_id", "")
            direction = "surging" if change > 0 else "plunging"
            item = {
                "id": f"mover-{neon_id}-{snapshot_cache.rebuild_count}",
                "timestamp": now_str,
                "text": f"{td.get('neon_symbol', td.get('symbol', '?'))} {direction} {change:+.1f}%",
            }
            if district_id:
                item["districtId"] = district_id
            if neon_id:
                item["tickerId"] = neon_id
            items.append(item)

    # District regime alerts (storm = notable)
    for ds in snap.district_states:
        if ds.get("weather") == "storm":
            items.append({
                "id": f"storm-{ds['district_id']}-{snapshot_cache.rebuild_count}",
                "timestamp": now_str,
                "text": f"{ds['name']} district entered storm conditions",
                "districtId": ds["district_id"],
            })

    # Breadth signal if extreme
    breadth = snap.signals.get("breadth", {})
    signal = breadth.get("signal", "")
    if signal in ("strong_bullish", "strong_bearish"):
        label = "strong rally" if signal == "strong_bullish" else "heavy selling"
        items.append({
            "id": f"breadth-{snapshot_cache.rebuild_count}",
            "timestamp": now_str,
            "text": f"Market breadth shows {label} ({breadth.get('advancers', 0)}A/{breadth.get('decliners', 0)}D)",
        })

    return {"evidence": items}
