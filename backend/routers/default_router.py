from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["default"])


@router.get("/")
async def root():
    return {"message": "NEON EXCHANGE Backend", "status": "running"}


@router.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "neon-exchange-backend"}
