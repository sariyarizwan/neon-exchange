import asyncio
import logging
import os
import base64

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["voice"])

LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"


@router.websocket("/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket relay between browser and Gemini Live API.

    Protocol:
    - Client sends JSON: {"type": "audio", "data": "<base64 PCM>"} or {"type": "text", "text": "..."}
    - Server sends JSON: {"type": "audio", "data": "<base64 PCM>"} or {"type": "text", "text": "..."}
    - Client sends {"type": "end"} to close
    """
    await websocket.accept()
    logger.info("Voice WebSocket connected")

    try:
        from google import genai
        from google.genai import types

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            await websocket.send_json({"type": "error", "message": "GEMINI_API_KEY not set"})
            await websocket.close()
            return

        client = genai.Client(api_key=api_key)

        # Build rich context from pre-computed cache snapshot
        from services.cache import snapshot_cache
        snap = snapshot_cache.snapshot
        # Structured summary: mood, top movers, district conditions
        top_movers = sorted(
            snap.all_tickers, key=lambda t: abs(t.get("change_pct", 0)), reverse=True
        )[:5]
        movers_text = ", ".join(
            f"{t.get('neon_symbol', t.get('symbol', '?'))} {t.get('change_pct', 0):+.1f}%"
            for t in top_movers
        )
        district_text = "; ".join(
            f"{d['name']} ({d['weather']}, {d['mood']})"
            for d in snap.district_states[:8]
        )
        breadth = snap.signals.get("breadth", {})
        breadth_text = (
            f"{breadth.get('advancers', 0)} advancing, "
            f"{breadth.get('decliners', 0)} declining, "
            f"signal: {breadth.get('signal', 'neutral')}"
        )
        news_text = "; ".join(
            n.get("headline", n.get("title", ""))[:80]
            for n in snap.news_feed[:3]
        )
        context_block = (
            f"Market mood: {snap.market_state.get('market_mood', 'unknown')}\n"
            f"Top movers: {movers_text}\n"
            f"Districts: {district_text}\n"
            f"Breadth: {breadth_text}\n"
            f"Headlines: {news_text}"
        )

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part.from_text(
                    text=f"""You are NEON, the AI voice assistant for NEON EXCHANGE - a cyberpunk city
where the stock market is visualized as a living world. Districts represent sectors, stocks are NPC characters.

You help users understand market conditions, explain what's happening in different districts,
discuss stock movements, and provide market intelligence. Be concise, engaging, and stay in the
cyberpunk theme. You can see, hear, and speak.

Current market snapshot:
{context_block}"""
                )]
            ),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            ),
        )

        async with client.aio.live.connect(model=LIVE_MODEL, config=config) as session:
            logger.info("Connected to Gemini Live API")

            async def receive_from_gemini():
                """Forward Gemini responses to the browser."""
                try:
                    async for response in session.receive():
                        if response.data is not None:
                            audio_b64 = base64.b64encode(response.data).decode("utf-8")
                            await websocket.send_json({
                                "type": "audio",
                                "data": audio_b64,
                            })
                        if response.text is not None:
                            await websocket.send_json({
                                "type": "text",
                                "text": response.text,
                            })
                        if response.tool_call is not None:
                            for fc in response.tool_call.function_calls:
                                await websocket.send_json({
                                    "type": "tool_call",
                                    "name": fc.name,
                                    "args": fc.args,
                                })
                except Exception as e:
                    logger.error(f"Gemini receive error: {e}")

            gemini_task = asyncio.create_task(receive_from_gemini())

            try:
                while True:
                    data = await websocket.receive_json()
                    msg_type = data.get("type")

                    if msg_type == "audio":
                        audio_bytes = base64.b64decode(data["data"])
                        await session.send_realtime_input(
                            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                        )
                    elif msg_type == "text":
                        await session.send_client_content(
                            turns=types.Content(
                                role="user",
                                parts=[types.Part.from_text(text=data["text"])]
                            )
                        )
                    elif msg_type == "end":
                        break
            finally:
                gemini_task.cancel()

    except WebSocketDisconnect:
        logger.info("Voice WebSocket disconnected")
    except ImportError:
        await websocket.send_json({"type": "error", "message": "google-genai not installed"})
        await websocket.close()
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
