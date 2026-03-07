from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import default_router, market_router, agents_router, voice_router, world_router
import uvicorn
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="NEON EXCHANGE Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(default_router.router)
app.include_router(market_router.router)
app.include_router(agents_router.router)
app.include_router(voice_router.router)
app.include_router(world_router.router)

if __name__ == "__main__":
    logger.info("Starting NEON EXCHANGE backend on 0.0.0.0:8080")
    uvicorn.run(app, host="0.0.0.0", port=8080)
