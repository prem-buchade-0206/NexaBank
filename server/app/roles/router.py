from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.roles.models import Role
from app.roles.schemas import RoleCreate, RoleRead, RoleUpdate
from app.roles.service import RoleService
from app.users.models import User

router = APIRouter(prefix="/roles", tags=["Roles"])
service = RoleService()


def _to_read(role: Role) -> RoleRead:
    return RoleRead.model_validate({**role.model_dump(), "id": str(role.id)})


@router.get("/", dependencies=[Depends(require_permissions("roles:read"))], summary="List roles")
async def list_roles(
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.list(pagination, sort)
    return paginated_response([_to_read(r) for r in items], pagination.page, pagination.limit, total)


@router.get("/{role_id}", dependencies=[Depends(require_permissions("roles:read"))], summary="Get a role")
async def get_role(role_id: str) -> dict:
    role = await service.get_by_id(role_id)
    return success_response(data=_to_read(role))


@router.post("/", dependencies=[Depends(require_permissions("roles:create"))], summary="Create a role")
async def create_role(payload: RoleCreate, current_user: User = Depends(get_current_user)) -> dict:
    role = await service.create_role(payload, created_by=str(current_user.id))
    return success_response(data=_to_read(role), message="Role created successfully.")


@router.patch(
    "/{role_id}", dependencies=[Depends(require_permissions("roles:update"))], summary="Update a role"
)
async def update_role(
    role_id: str, payload: RoleUpdate, current_user: User = Depends(get_current_user)
) -> dict:
    role = await service.update_role(role_id, payload, updated_by=str(current_user.id))
    return success_response(data=_to_read(role), message="Role updated successfully.")


@router.delete(
    "/{role_id}", dependencies=[Depends(require_permissions("roles:delete"))], summary="Delete a role"
)
async def delete_role(role_id: str, current_user: User = Depends(get_current_user)) -> dict:
    await service.delete_role(role_id, deleted_by=str(current_user.id))
    return success_response(message="Role deleted successfully.")
