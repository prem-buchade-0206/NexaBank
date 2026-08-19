from datetime import UTC, datetime

from app.accounts.service import AccountService
from app.beneficiaries.constants import BeneficiaryType, BeneficiaryVerificationStatus
from app.beneficiaries.models import Beneficiary
from app.beneficiaries.repository import BeneficiaryRepository
from app.beneficiaries.schemas import BeneficiaryCreate, BeneficiaryUpdate
from app.core.exceptions import BusinessRuleException, DuplicateResourceException
from app.services.base import BaseService


class BeneficiaryService(BaseService[Beneficiary]):
    def __init__(self) -> None:
        self.beneficiary_repository = BeneficiaryRepository()
        self.account_service = AccountService()
        super().__init__(self.beneficiary_repository)

    async def add_beneficiary(self, payload: BeneficiaryCreate, created_by: str | None = None) -> Beneficiary:
        if payload.beneficiary_type == BeneficiaryType.INTERNAL:
            assert payload.account_id is not None  # enforced by schema validator
            account = await self.account_service.get_by_id(payload.account_id)
            if account.customer_id == payload.owner_customer_id:
                raise BusinessRuleException("You cannot add your own account as a beneficiary.")

            existing = await self.beneficiary_repository.get_duplicate_internal(
                payload.owner_customer_id, payload.account_id
            )
            if existing:
                raise DuplicateResourceException("This beneficiary")

        beneficiary = Beneficiary(
            owner_customer_id=payload.owner_customer_id,
            nickname=payload.nickname,
            beneficiary_type=payload.beneficiary_type,
            account_id=payload.account_id,
            external_bank_name=payload.external_bank_name,
            external_account_number=payload.external_account_number,
            external_account_holder_name=payload.external_account_holder_name,
            created_by=created_by,
        )

        # Internal beneficiaries are auto-verified — the referenced account's
        # existence is itself sufficient proof. External ones need review.
        if payload.beneficiary_type == BeneficiaryType.INTERNAL:
            beneficiary.verification_status = BeneficiaryVerificationStatus.VERIFIED
            beneficiary.verified_at = datetime.now(UTC)
            beneficiary.verified_by = "system"

        return await self.beneficiary_repository.create(beneficiary)

    async def update_beneficiary(
        self, beneficiary_id: str, payload: BeneficiaryUpdate, updated_by: str | None = None
    ) -> Beneficiary:
        beneficiary = await self.beneficiary_repository.get_by_id_or_raise(beneficiary_id)
        updates = payload.model_dump(exclude_none=True)
        return await self.beneficiary_repository.update(beneficiary, updates, updated_by)

    async def verify(self, beneficiary_id: str, verified_by: str) -> Beneficiary:
        beneficiary = await self.beneficiary_repository.get_by_id_or_raise(beneficiary_id)
        beneficiary.verification_status = BeneficiaryVerificationStatus.VERIFIED
        beneficiary.verified_at = datetime.now(UTC)
        beneficiary.verified_by = verified_by
        beneficiary.mark_updated(verified_by)
        await beneficiary.save()
        return beneficiary

    async def reject(self, beneficiary_id: str, rejected_by: str) -> Beneficiary:
        beneficiary = await self.beneficiary_repository.get_by_id_or_raise(beneficiary_id)
        beneficiary.verification_status = BeneficiaryVerificationStatus.REJECTED
        beneficiary.verified_at = None
        beneficiary.verified_by = None
        beneficiary.mark_updated(rejected_by)
        await beneficiary.save()
        return beneficiary

    async def list_for_customer(self, customer_id: str) -> list[Beneficiary]:
        return await self.beneficiary_repository.list_for_customer(customer_id)
