from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user, require_permissions
from app.auth.ownership import ensure_customer_access
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.dependencies.common import get_pagination_params, get_sort_params
from app.loans.models import Loan, LoanPayment
from app.loans.schemas import (
    LoanApplyRequest,
    LoanPaymentRead,
    LoanPaymentRequest,
    LoanRead,
    LoanRejectRequest,
)
from app.loans.service import LoanService
from app.users.models import User

router = APIRouter(prefix="/loans", tags=["Loans"])
service = LoanService()


def _to_read(loan: Loan) -> LoanRead:
    return LoanRead.model_validate({**loan.model_dump(), "id": str(loan.id)})


def _payment_to_read(payment: LoanPayment) -> LoanPaymentRead:
    return LoanPaymentRead.model_validate({**payment.model_dump(), "id": str(payment.id)})


@router.get("/", dependencies=[Depends(require_permissions("loans:read"))], summary="List / search loans")
async def list_loans(
    loan_status: str | None = Query(default=None),
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.search(pagination, sort, loan_status=loan_status)
    return paginated_response([_to_read(loan) for loan in items], pagination.page, pagination.limit, total)


@router.get("/{loan_id}", dependencies=[Depends(require_permissions("loans:read"))], summary="Get a loan")
async def get_loan(loan_id: str) -> dict:
    loan = await service.get_by_id(loan_id)
    return success_response(data=_to_read(loan))


@router.post(
    "/apply", dependencies=[Depends(require_permissions("loans:create"))], summary="Apply for a loan"
)
async def apply_for_loan(payload: LoanApplyRequest, current_user: User = Depends(get_current_user)) -> dict:
    await ensure_customer_access(current_user, payload.customer_id)
    loan = await service.apply(payload, applied_by=str(current_user.id))
    return success_response(data=_to_read(loan), message="Loan application submitted successfully.")


@router.post(
    "/{loan_id}/approve",
    dependencies=[Depends(require_permissions("loans:update"))],
    summary="Approve and disburse a loan (staff only)",
)
async def approve_loan(loan_id: str, current_user: User = Depends(get_current_user)) -> dict:
    loan = await service.approve_and_disburse(loan_id, approved_by=str(current_user.id))
    return success_response(data=_to_read(loan), message="Loan approved and disbursed successfully.")


@router.post(
    "/{loan_id}/reject",
    dependencies=[Depends(require_permissions("loans:update"))],
    summary="Reject a loan application (staff only)",
)
async def reject_loan(
    loan_id: str, payload: LoanRejectRequest, current_user: User = Depends(get_current_user)
) -> dict:
    loan = await service.reject(loan_id, payload.reason, rejected_by=str(current_user.id))
    return success_response(data=_to_read(loan), message="Loan application rejected.")


@router.get(
    "/{loan_id}/payments",
    dependencies=[Depends(require_permissions("loans:read"))],
    summary="Get a loan's payment schedule / history",
)
async def get_loan_payments(loan_id: str, current_user: User = Depends(get_current_user)) -> dict:
    loan = await service.get_by_id(loan_id)
    await ensure_customer_access(current_user, loan.customer_id)
    schedule = await service.get_schedule(loan_id)
    return success_response(data=[_payment_to_read(p) for p in schedule])


@router.post(
    "/{loan_id}/payments",
    dependencies=[Depends(require_permissions("loans:update"))],
    summary="Make a loan repayment",
)
async def make_loan_payment(
    loan_id: str, payload: LoanPaymentRequest, current_user: User = Depends(get_current_user)
) -> dict:
    loan = await service.get_by_id(loan_id)
    await ensure_customer_access(current_user, loan.customer_id)
    payment = await service.make_payment(
        loan_id,
        payload.source_account_id,
        payload.installment_number,
        payload.amount,
        paid_by=str(current_user.id),
    )
    return success_response(data=_payment_to_read(payment), message="Loan payment processed successfully.")
