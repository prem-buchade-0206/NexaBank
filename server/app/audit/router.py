from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.audit.models import AuditLog
from app.audit.schemas import AuditLogRead
from app.audit.service import AuditService
from app.auth.dependencies import require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params

router = APIRouter(prefix="/audit", tags=["Audit"])
service = AuditService()


def _to_read(entry: AuditLog) -> AuditLogRead:
    return AuditLogRead.model_validate({**entry.model_dump(), "id": str(entry.id)})


@router.get(
    "/", dependencies=[Depends(require_permissions("audit:read"))], summary="Search audit logs (staff only)"
)
async def list_audit_logs(
    user_id: str | None = Query(default=None),
    module: str | None = Query(default=None),
    action: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.search(
        pagination, sort, user_id=user_id, module=module, action=action, date_from=date_from, date_to=date_to
    )
    return paginated_response([_to_read(e) for e in items], pagination.page, pagination.limit, total)


@router.get(
    "/{audit_id}",
    dependencies=[Depends(require_permissions("audit:read"))],
    summary="Get a single audit log entry",
)
async def get_audit_log(audit_id: str) -> dict:
    entry = await service.get_by_id(audit_id)
    return success_response(data=_to_read(entry))
