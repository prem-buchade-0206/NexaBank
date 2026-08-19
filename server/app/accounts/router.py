from fastapi import APIRouter, Depends, Query

from app.accounts.models import Account
from app.accounts.schemas import (
    AccountCreate,
    AccountRead,
    AccountUpdate,
    CloseAccountRequest,
    FreezeAccountRequest,
)
from app.accounts.service import AccountService
from app.auth.dependencies import get_current_user, require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.users.models import User

router = APIRouter(prefix="/accounts", tags=["Accounts"])
service = AccountService()


def _to_read(account: Account) -> AccountRead:
    return AccountRead.model_validate({**account.model_dump(), "id": str(account.id)})


@router.get("/", dependencies=[Depends(require_permissions("accounts:read"))], summary="List accounts")
async def list_accounts(
    customer_id: str | None = Query(default=None),
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    filters = {"customer_id": customer_id} if customer_id else None
    items, total = await service.list(pagination, sort, filters)
    return paginated_response([_to_read(a) for a in items], pagination.page, pagination.limit, total)


@router.get(
    "/{account_id}", dependencies=[Depends(require_permissions("accounts:read"))], summary="Get an account"
)
async def get_account(account_id: str) -> dict:
    account = await service.get_by_id(account_id)
    return success_response(data=_to_read(account))


@router.post("/", dependencies=[Depends(require_permissions("accounts:create"))], summary="Open an account")
async def open_account(payload: AccountCreate, current_user: User = Depends(get_current_user)) -> dict:
    account = await service.open_account(payload, created_by=str(current_user.id))
    return success_response(data=_to_read(account), message="Account opened successfully.")


@router.patch(
    "/{account_id}",
    dependencies=[Depends(require_permissions("accounts:update"))],
    summary="Update an account",
)
async def update_account(
    account_id: str, payload: AccountUpdate, current_user: User = Depends(get_current_user)
) -> dict:
    account = await service.update_account(account_id, payload, updated_by=str(current_user.id))
    return success_response(data=_to_read(account), message="Account updated successfully.")


@router.post(
    "/{account_id}/freeze",
    dependencies=[Depends(require_permissions("accounts:update"))],
    summary="Freeze an account",
)
async def freeze_account(
    account_id: str, payload: FreezeAccountRequest, current_user: User = Depends(get_current_user)
) -> dict:
    account = await service.freeze_account(account_id, payload.reason, frozen_by=str(current_user.id))
    return success_response(data=_to_read(account), message="Account frozen successfully.")


@router.post(
    "/{account_id}/unfreeze",
    dependencies=[Depends(require_permissions("accounts:update"))],
    summary="Unfreeze an account",
)
async def unfreeze_account(account_id: str, current_user: User = Depends(get_current_user)) -> dict:
    account = await service.unfreeze_account(account_id, unfrozen_by=str(current_user.id))
    return success_response(data=_to_read(account), message="Account unfrozen successfully.")


@router.post(
    "/{account_id}/close",
    dependencies=[Depends(require_permissions("accounts:delete"))],
    summary="Close an account (requires zero balance)",
)
async def close_account(
    account_id: str, payload: CloseAccountRequest, current_user: User = Depends(get_current_user)
) -> dict:
    account = await service.close_account(account_id, payload.reason, closed_by=str(current_user.id))
    return success_response(data=_to_read(account), message="Account closed successfully.")
