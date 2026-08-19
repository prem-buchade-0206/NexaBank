from fastapi import APIRouter, Depends, Query

from app.accounts.service import AccountService
from app.auth.dependencies import get_current_user, require_permissions
from app.auth.ownership import ensure_customer_access
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.transactions.models import Transaction
from app.transactions.schemas import DepositRequest, TransactionRead, TransferRequest, WithdrawalRequest
from app.transactions.service import TransactionService
from app.users.models import User

router = APIRouter(prefix="/transactions", tags=["Transactions"])
service = TransactionService()
account_service = AccountService()


def _to_read(transaction: Transaction) -> TransactionRead:
    return TransactionRead.model_validate({**transaction.model_dump(), "id": str(transaction.id)})


@router.post(
    "/deposit", dependencies=[Depends(require_permissions("transactions:create"))], summary="Deposit funds"
)
async def deposit(payload: DepositRequest, current_user: User = Depends(get_current_user)) -> dict:
    account = await account_service.get_by_id(payload.account_id)
    await ensure_customer_access(current_user, account.customer_id)

    transaction = await service.deposit(
        payload.account_id, payload.amount, payload.description, initiated_by=str(current_user.id)
    )
    return success_response(data=_to_read(transaction), message="Deposit completed successfully.")


@router.post(
    "/withdraw", dependencies=[Depends(require_permissions("transactions:create"))], summary="Withdraw funds"
)
async def withdraw(payload: WithdrawalRequest, current_user: User = Depends(get_current_user)) -> dict:
    account = await account_service.get_by_id(payload.account_id)
    await ensure_customer_access(current_user, account.customer_id)

    transaction = await service.withdraw(
        payload.account_id, payload.amount, payload.description, initiated_by=str(current_user.id)
    )
    return success_response(data=_to_read(transaction), message="Withdrawal completed successfully.")


@router.post(
    "/transfer",
    dependencies=[Depends(require_permissions("transactions:create"))],
    summary="Transfer funds between two accounts",
)
async def transfer(payload: TransferRequest, current_user: User = Depends(get_current_user)) -> dict:
    source = await account_service.get_by_id(payload.source_account_id)
    # Only the source account's owner needs to be verified — a customer can
    # transfer OUT to any valid destination account (e.g. paying someone else).
    await ensure_customer_access(current_user, source.customer_id)

    transaction = await service.transfer(
        payload.source_account_id,
        payload.destination_account_id,
        payload.amount,
        payload.description,
        initiated_by=str(current_user.id),
    )
    return success_response(data=_to_read(transaction), message="Transfer completed successfully.")


@router.get(
    "/",
    dependencies=[Depends(require_permissions("transactions:read"))],
    summary="List / search transactions",
)
async def list_transactions(
    account_id: str | None = Query(default=None),
    transaction_type: str | None = Query(default=None),
    transaction_status: str | None = Query(default=None),
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.search(
        pagination,
        sort,
        transaction_type=transaction_type,
        transaction_status=transaction_status,
        account_id=account_id,
    )
    return paginated_response([_to_read(t) for t in items], pagination.page, pagination.limit, total)


@router.get(
    "/{transaction_id}",
    dependencies=[Depends(require_permissions("transactions:read"))],
    summary="Get a transaction",
)
async def get_transaction(transaction_id: str) -> dict:
    transaction = await service.get_by_id(transaction_id)
    return success_response(data=_to_read(transaction))
