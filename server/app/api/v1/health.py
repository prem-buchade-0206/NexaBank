"""Health check endpoints for liveness/readiness probes and monitoring."""

import time

from fastapi import APIRouter

from app.core.config import settings
from app.core.responses import success_response
from app.database.mongodb import check_database_health

router = APIRouter(prefix="/health", tags=["Health"])

_start_time = time.time()


@router.get("/live", summary="Liveness probe", description="Returns 200 if the process is running.")
async def liveness() -> dict:
    return success_response(data={"status": "alive"})


@router.get(
    "/ready",
    summary="Readiness probe",
    description="Returns 200 only if the application can serve traffic (DB reachable).",
)
async def readiness() -> dict:
    db_healthy = await check_database_health()
    status_data = {
        "status": "ready" if db_healthy else "not_ready",
        "database": "connected" if db_healthy else "disconnected",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - _start_time, 2),
    }
    return success_response(data=status_data)
