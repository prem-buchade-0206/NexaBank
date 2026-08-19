from datetime import date

from fastapi import APIRouter, Depends, Query

from app.analytics.service import AnalyticsService
from app.auth.dependencies import require_permissions
from app.core.responses import success_response

router = APIRouter(prefix="/analytics", tags=["Analytics"])
service = AnalyticsService()


@router.get(
    "/dashboard",
    dependencies=[Depends(require_permissions("analytics:read"))],
    summary="Dashboard KPIs (cached briefly if Redis is configured)",
)
async def dashboard() -> dict:
    summary = await service.dashboard()
    return success_response(data=summary)


@router.get(
    "/growth",
    dependencies=[Depends(require_permissions("analytics:read"))],
    summary="New-customer growth trend over the last N months",
)
async def growth(months: int = Query(default=6, ge=1, le=36)) -> dict:
    report = await service.growth(months)
    return success_response(data=report)


@router.get(
    "/revenue",
    dependencies=[Depends(require_permissions("analytics:read"))],
    summary="Revenue (transaction charges) for an arbitrary date range",
)
async def revenue(date_from: date = Query(...), date_to: date = Query(...)) -> dict:
    total = await service.revenue_for_range(date_from, date_to)
    return success_response(data={"period_start": date_from, "period_end": date_to, "total_revenue": total})
