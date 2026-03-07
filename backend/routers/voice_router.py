import asyncio
import json
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

        # Import shared memory for context injection
        from memory.shared_state import shared_memory
        context = shared_memory.get_bootstrap()
        context_summary = json.dumps(context, default=str)[:2000]

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part.from_text(
                    text=f"""You are NEON, the AI voice assistant for NEON EXCHANGE - a cyberpunk city
where the stock market is visualized as a living world. Districts represent sectors, stocks are NPC characters.

You help users understand market conditions, explain what's happening in different districts,
discuss stock movements, and provide market intelligence. Be concise, engaging, and stay in the
cyberpunk theme. You can see, hear, and speak.

Current market context:
{context_summary}"""
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
