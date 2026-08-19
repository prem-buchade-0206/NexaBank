from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_permissions
from app.auth.ownership import ensure_customer_access
from app.beneficiaries.models import Beneficiary
from app.beneficiaries.schemas import BeneficiaryCreate, BeneficiaryRead, BeneficiaryUpdate
from app.beneficiaries.service import BeneficiaryService
from app.core.responses import success_response
from app.users.models import User

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])
service = BeneficiaryService()


def _to_read(beneficiary: Beneficiary) -> BeneficiaryRead:
    return BeneficiaryRead.model_validate({**beneficiary.model_dump(), "id": str(beneficiary.id)})


@router.get(
    "/customer/{customer_id}",
    dependencies=[Depends(require_permissions("beneficiaries:read"))],
    summary="List a customer's beneficiaries",
)
async def list_beneficiaries(customer_id: str, current_user: User = Depends(get_current_user)) -> dict:
    await ensure_customer_access(current_user, customer_id)
    items = await service.list_for_customer(customer_id)
    return success_response(data=[_to_read(b) for b in items])


@router.post(
    "/", dependencies=[Depends(require_permissions("beneficiaries:create"))], summary="Add a beneficiary"
)
async def add_beneficiary(payload: BeneficiaryCreate, current_user: User = Depends(get_current_user)) -> dict:
    await ensure_customer_access(current_user, payload.owner_customer_id)
    beneficiary = await service.add_beneficiary(payload, created_by=str(current_user.id))
    return success_response(data=_to_read(beneficiary), message="Beneficiary added successfully.")


@router.patch(
    "/{beneficiary_id}",
    dependencies=[Depends(require_permissions("beneficiaries:update"))],
    summary="Update a beneficiary's nickname",
)
async def update_beneficiary(
    beneficiary_id: str, payload: BeneficiaryUpdate, current_user: User = Depends(get_current_user)
) -> dict:
    beneficiary = await service.get_by_id(beneficiary_id)
    await ensure_customer_access(current_user, beneficiary.owner_customer_id)
    updated = await service.update_beneficiary(beneficiary_id, payload, updated_by=str(current_user.id))
    return success_response(data=_to_read(updated), message="Beneficiary updated successfully.")


@router.delete(
    "/{beneficiary_id}",
    dependencies=[Depends(require_permissions("beneficiaries:delete"))],
    summary="Remove a beneficiary",
)
async def remove_beneficiary(beneficiary_id: str, current_user: User = Depends(get_current_user)) -> dict:
    beneficiary = await service.get_by_id(beneficiary_id)
    await ensure_customer_access(current_user, beneficiary.owner_customer_id)
    await service.delete(beneficiary_id, deleted_by=str(current_user.id))
    return success_response(message="Beneficiary removed successfully.")


@router.post(
    "/{beneficiary_id}/verify",
    dependencies=[Depends(require_permissions("beneficiaries:update"))],
    summary="Verify an external beneficiary (staff only)",
)
async def verify_beneficiary(beneficiary_id: str, current_user: User = Depends(get_current_user)) -> dict:
    beneficiary = await service.verify(beneficiary_id, verified_by=str(current_user.id))
    return success_response(data=_to_read(beneficiary), message="Beneficiary verified successfully.")


@router.post(
    "/{beneficiary_id}/reject",
    dependencies=[Depends(require_permissions("beneficiaries:update"))],
    summary="Reject an external beneficiary (staff only)",
)
async def reject_beneficiary(beneficiary_id: str, current_user: User = Depends(get_current_user)) -> dict:
    beneficiary = await service.reject(beneficiary_id, rejected_by=str(current_user.id))
    return success_response(data=_to_read(beneficiary), message="Beneficiary rejected.")
