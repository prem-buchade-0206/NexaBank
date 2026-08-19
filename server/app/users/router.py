from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.users.models import User
from app.users.schemas import UserCreate, UserRead, UserUpdate
from app.users.service import UserService

router = APIRouter(prefix="/users", tags=["Users"])
service = UserService()


def _to_read(user: User) -> UserRead:
    return UserRead.model_validate({**user.model_dump(), "id": str(user.id)})


@router.get("/", dependencies=[Depends(require_permissions("users:read"))], summary="List users")
async def list_users(
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.list(pagination, sort)
    return paginated_response([_to_read(u) for u in items], pagination.page, pagination.limit, total)


@router.get("/{user_id}", dependencies=[Depends(require_permissions("users:read"))], summary="Get a user")
async def get_user(user_id: str) -> dict:
    user = await service.get_by_id(user_id)
    return success_response(data=_to_read(user))


@router.post(
    "/", dependencies=[Depends(require_permissions("users:create"))], summary="Create a staff/admin user"
)
async def create_user(payload: UserCreate, current_user: User = Depends(get_current_user)) -> dict:
    user = await service.create_user(payload, created_by=str(current_user.id))
    return success_response(data=_to_read(user), message="User created successfully.")


@router.patch(
    "/{user_id}", dependencies=[Depends(require_permissions("users:update"))], summary="Update a user"
)
async def update_user(
    user_id: str, payload: UserUpdate, current_user: User = Depends(get_current_user)
) -> dict:
    user = await service.update_user(user_id, payload, updated_by=str(current_user.id))
    return success_response(data=_to_read(user), message="User updated successfully.")


@router.delete(
    "/{user_id}", dependencies=[Depends(require_permissions("users:delete"))], summary="Deactivate a user"
)
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)) -> dict:
    await service.delete(user_id, deleted_by=str(current_user.id))
    return success_response(message="User deactivated successfully.")
