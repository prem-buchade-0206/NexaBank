from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.permissions.schemas import PermissionCreate, PermissionRead
from app.permissions.service import PermissionService
from app.users.models import User

router = APIRouter(prefix="/permissions", tags=["Permissions"])
service = PermissionService()


@router.get("/", dependencies=[Depends(require_permissions("permissions:read"))], summary="List permissions")
async def list_permissions(
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.list(pagination, sort)
    data = [PermissionRead.model_validate({**p.model_dump(), "id": str(p.id)}) for p in items]
    return paginated_response(data, pagination.page, pagination.limit, total)


@router.post(
    "/", dependencies=[Depends(require_permissions("permissions:create"))], summary="Create a permission"
)
async def create_permission(
    payload: PermissionCreate, current_user: User = Depends(get_current_user)
) -> dict:
    permission = await service.create_permission(payload, created_by=str(current_user.id))
    return success_response(
        data=PermissionRead.model_validate({**permission.model_dump(), "id": str(permission.id)}),
        message="Permission created successfully.",
    )
