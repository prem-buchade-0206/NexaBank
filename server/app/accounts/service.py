from datetime import UTC, datetime
from decimal import Decimal

from motor.motor_asyncio import AsyncIOMotorClientSession

from app.accounts.constants import ACCOUNT_NUMBER_PREFIXES, AccountStatus
from app.accounts.models import Account
from app.accounts.repository import AccountRepository
from app.accounts.schemas import AccountCreate, AccountUpdate
from app.audit.constants import AuditAction
from app.audit.service import AuditService
from app.core.exceptions import BusinessRuleException
from app.customers.constants import KYCStatus
from app.customers.service import CustomerService
from app.services.base import BaseService
from app.utils.sequence import generate_sequential_id


class AccountService(BaseService[Account]):
    def __init__(self) -> None:
        self.account_repository = AccountRepository()
        self.customer_service = CustomerService()
        self.audit_service = AuditService()
        super().__init__(self.account_repository)

    async def open_account(self, payload: AccountCreate, created_by: str | None = None) -> Account:
        customer = await self.customer_service.get_by_id(payload.customer_id)
        if customer.kyc_status != KYCStatus.VERIFIED:
            raise BusinessRuleException("Customer's KYC must be verified before an account can be opened.")

        prefix = ACCOUNT_NUMBER_PREFIXES[payload.account_type]
        account_number = await generate_sequential_id(prefix, f"account_number_{prefix.lower()}")

        account = Account(
            account_number=account_number,
            account_type=payload.account_type,
            customer_id=payload.customer_id,
            balance=payload.initial_deposit,
            minimum_balance=payload.minimum_balance,
            currency=payload.currency,
            branch=payload.branch,
            interest_rate=payload.interest_rate,
            maturity_date=payload.maturity_date,
            created_by=created_by,
        )
        return await self.account_repository.create(account)

    async def update_account(
        self, account_id: str, payload: AccountUpdate, updated_by: str | None = None
    ) -> Account:
        account = await self.account_repository.get_by_id_or_raise(account_id)
        updates = payload.model_dump(exclude_none=True)
        return await self.account_repository.update(account, updates, updated_by)

    async def list_for_customer(self, customer_id: str) -> list[Account]:
        return await self.account_repository.list_for_customer(customer_id)

    # ---- Lifecycle ----

    async def freeze_account(self, account_id: str, reason: str, frozen_by: str) -> Account:
        account = await self.account_repository.get_by_id_or_raise(account_id)
        if account.account_status == AccountStatus.CLOSED:
            raise BusinessRuleException("A closed account cannot be frozen.")
        if account.account_status == AccountStatus.FROZEN:
            raise BusinessRuleException("Account is already frozen.")

        account.account_status = AccountStatus.FROZEN
        account.frozen_at = datetime.now(UTC)
        account.frozen_reason = reason
        account.mark_updated(frozen_by)
        await account.save()
        await self.audit_service.log(
            action=AuditAction.ACCOUNT_FROZEN.value,
            module="accounts",
            user_id=frozen_by,
            resource_id=str(account.id),
            metadata={"reason": reason},
        )
        return account

    async def unfreeze_account(self, account_id: str, unfrozen_by: str) -> Account:
        account = await self.account_repository.get_by_id_or_raise(account_id)
        if account.account_status != AccountStatus.FROZEN:
            raise BusinessRuleException("Only a frozen account can be unfrozen.")

        account.account_status = AccountStatus.ACTIVE
        account.frozen_at = None
        account.frozen_reason = None
        account.mark_updated(unfrozen_by)
        await account.save()
        await self.audit_service.log(
            action=AuditAction.ACCOUNT_UNFROZEN.value,
            module="accounts",
            user_id=unfrozen_by,
            resource_id=str(account.id),
        )
        return account

    async def close_account(self, account_id: str, reason: str | None, closed_by: str) -> Account:
        account = await self.account_repository.get_by_id_or_raise(account_id)
        if account.account_status == AccountStatus.CLOSED:
            raise BusinessRuleException("Account is already closed.")
        if account.balance != Decimal("0"):
            raise BusinessRuleException(
                "Account balance must be zero before it can be closed. "
                "Withdraw or transfer the remaining balance first."
            )

        account.account_status = AccountStatus.CLOSED
        account.closed_at = datetime.now(UTC)
        account.closed_reason = reason
        account.mark_updated(closed_by)
        await account.save()
        await self.audit_service.log(
            action=AuditAction.ACCOUNT_CLOSED.value,
            module="accounts",
            user_id=closed_by,
            resource_id=str(account.id),
            metadata={"reason": reason} if reason else None,
        )
        return account

    # ---- Balance mutation passthrough (used by the Transactions module) ----

    async def credit(
        self, account_id: str, amount: Decimal, session: AsyncIOMotorClientSession | None = None
    ) -> Account:
        return await self.account_repository.credit(account_id, amount, session=session)

    async def debit(
        self, account_id: str, amount: Decimal, session: AsyncIOMotorClientSession | None = None
    ) -> Account:
        return await self.account_repository.debit(account_id, amount, session=session)
