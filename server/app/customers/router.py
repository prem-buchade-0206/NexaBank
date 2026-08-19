from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user, require_permissions
from app.core.pagination import PaginationParams, SortParams
from app.core.responses import paginated_response, success_response
from app.customers.models import Customer
from app.customers.schemas import CustomerCreate, CustomerRead, CustomerUpdate, KYCRejectRequest
from app.customers.service import CustomerService
from app.dependencies.common import get_pagination_params, get_sort_params
from app.users.models import User

router = APIRouter(prefix="/customers", tags=["Customers"])
service = CustomerService()


def _to_read(customer: Customer) -> CustomerRead:
    return CustomerRead.model_validate({**customer.model_dump(), "id": str(customer.id)})


@router.get(
    "/",
    dependencies=[Depends(require_permissions("customers:read"))],
    summary="List / search customers",
)
async def list_customers(
    q: str | None = Query(default=None, description="Search by name, email, phone, or customer number"),
    kyc_status: str | None = Query(default=None),
    pagination: PaginationParams = Depends(get_pagination_params),
    sort: SortParams = Depends(get_sort_params),
) -> dict:
    items, total = await service.search(pagination, sort, query=q, kyc_status=kyc_status)
    return paginated_response([_to_read(c) for c in items], pagination.page, pagination.limit, total)


@router.get(
    "/{customer_id}",
    dependencies=[Depends(require_permissions("customers:read"))],
    summary="Get a customer's profile",
)
async def get_customer(customer_id: str) -> dict:
    customer = await service.get_by_id(customer_id)
    return success_response(data=_to_read(customer))


@router.post(
    "/",
    dependencies=[Depends(require_permissions("customers:create"))],
    summary="Create a customer",
)
async def create_customer(payload: CustomerCreate, current_user: User = Depends(get_current_user)) -> dict:
    customer = await service.create_customer(payload, created_by=str(current_user.id))
    return success_response(data=_to_read(customer), message="Customer created successfully.")


@router.patch(
    "/{customer_id}",
    dependencies=[Depends(require_permissions("customers:update"))],
    summary="Update a customer",
)
async def update_customer(
    customer_id: str, payload: CustomerUpdate, current_user: User = Depends(get_current_user)
) -> dict:
    customer = await service.update_customer(customer_id, payload, updated_by=str(current_user.id))
    return success_response(data=_to_read(customer), message="Customer updated successfully.")


@router.delete(
    "/{customer_id}",
    dependencies=[Depends(require_permissions("customers:delete"))],
    summary="Deactivate a customer",
)
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)) -> dict:
    await service.delete(customer_id, deleted_by=str(current_user.id))
    return success_response(message="Customer deactivated successfully.")


@router.post(
    "/{customer_id}/kyc/verify",
    dependencies=[Depends(require_permissions("customers:update"))],
    summary="Approve a customer's KYC",
)
async def verify_kyc(customer_id: str, current_user: User = Depends(get_current_user)) -> dict:
    customer = await service.verify_kyc(customer_id, verified_by=str(current_user.id))
    return success_response(data=_to_read(customer), message="KYC verified successfully.")


@router.post(
    "/{customer_id}/kyc/reject",
    dependencies=[Depends(require_permissions("customers:update"))],
    summary="Reject a customer's KYC",
)
async def reject_kyc(
    customer_id: str, payload: KYCRejectRequest, current_user: User = Depends(get_current_user)
) -> dict:
    customer = await service.reject_kyc(customer_id, payload.reason, rejected_by=str(current_user.id))
    return success_response(data=_to_read(customer), message="KYC rejected.")
