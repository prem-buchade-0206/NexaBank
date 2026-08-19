from datetime import UTC, datetime

from app.audit.constants import AuditAction
from app.audit.service import AuditService
from app.core.exceptions import BusinessRuleException, DuplicateResourceException
from app.core.pagination import PaginationParams, SortParams
from app.customers.constants import CUSTOMER_NUMBER_COUNTER, CUSTOMER_NUMBER_PREFIX, KYCStatus
from app.customers.models import Customer
from app.customers.repository import CustomerRepository
from app.customers.schemas import CustomerCreate, CustomerUpdate
from app.services.base import BaseService
from app.utils.sequence import generate_sequential_id


class CustomerService(BaseService[Customer]):
    def __init__(self) -> None:
        self.customer_repository = CustomerRepository()
        self.audit_service = AuditService()
        super().__init__(self.customer_repository)

    async def create_customer(self, payload: CustomerCreate, created_by: str | None = None) -> Customer:
        if await self.customer_repository.get_by_email(payload.email):
            raise DuplicateResourceException("A customer with this email")
        if await self.customer_repository.get_by_identity(payload.id_type, payload.id_number):
            raise DuplicateResourceException("A customer with this identity document")

        customer_number = await generate_sequential_id(CUSTOMER_NUMBER_PREFIX, CUSTOMER_NUMBER_COUNTER)

        customer = Customer(
            customer_number=customer_number,
            full_name=payload.full_name,
            date_of_birth=payload.date_of_birth,
            gender=payload.gender,
            nationality=payload.nationality,
            email=payload.email.lower(),
            phone=payload.phone,
            alternate_phone=payload.alternate_phone,
            address=payload.address.model_dump(),
            id_type=payload.id_type,
            id_number=payload.id_number,
            branch=payload.branch,
            user_id=payload.user_id,
            created_by=created_by,
        )
        return await self.customer_repository.create(customer)

    async def update_customer(
        self, customer_id: str, payload: CustomerUpdate, updated_by: str | None = None
    ) -> Customer:
        customer = await self.customer_repository.get_by_id_or_raise(customer_id)

        if payload.email and payload.email.lower() != customer.email:
            existing = await self.customer_repository.get_by_email(payload.email)
            if existing:
                raise DuplicateResourceException("A customer with this email")

        updates = payload.model_dump(exclude_none=True)
        if "address" in updates:
            updates["address"] = payload.address.model_dump()  # type: ignore[union-attr]
        if "email" in updates:
            updates["email"] = updates["email"].lower()

        return await self.customer_repository.update(customer, updates, updated_by)

    async def search(
        self,
        pagination: PaginationParams,
        sort: SortParams,
        query: str | None = None,
        kyc_status: str | None = None,
    ) -> tuple[list[Customer], int]:
        filters = self.customer_repository.build_search_filter(query, kyc_status)
        return await self.list(pagination, sort, filters)

    async def verify_kyc(self, customer_id: str, verified_by: str) -> Customer:
        customer = await self.customer_repository.get_by_id_or_raise(customer_id)
        if customer.kyc_status == KYCStatus.VERIFIED:
            raise BusinessRuleException("Customer KYC is already verified.")

        customer.kyc_status = KYCStatus.VERIFIED
        customer.kyc_verified_at = datetime.now(UTC)
        customer.kyc_verified_by = verified_by
        customer.kyc_rejection_reason = None
        customer.mark_updated(verified_by)
        await customer.save()
        await self.audit_service.log(
            action=AuditAction.KYC_VERIFIED.value,
            module="customers",
            user_id=verified_by,
            resource_id=str(customer.id),
        )
        return customer

    async def reject_kyc(self, customer_id: str, reason: str, rejected_by: str) -> Customer:
        customer = await self.customer_repository.get_by_id_or_raise(customer_id)
        customer.kyc_status = KYCStatus.REJECTED
        customer.kyc_verified_at = None
        customer.kyc_verified_by = None
        customer.kyc_rejection_reason = reason
        customer.mark_updated(rejected_by)
        await customer.save()
        await self.audit_service.log(
            action=AuditAction.KYC_REJECTED.value,
            module="customers",
            user_id=rejected_by,
            resource_id=str(customer.id),
            metadata={"reason": reason},
        )
        return customer
