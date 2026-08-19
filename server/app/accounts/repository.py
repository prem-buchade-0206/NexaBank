"""Account repository.

`credit`/`debit` are the ONLY sanctioned way to mutate `balance`. Both use a
single atomic `find_one_and_update` so two concurrent transactions on the
same account can never race each other (no read-balance-then-write gap).
Both accept an optional Motor `session` so the Transactions module (Phase 5)
can run a balance mutation and its ledger `Transaction` record inside the
SAME MongoDB multi-document transaction — either both are committed or
neither is, with no manual compensating-rollback logic needed.
"""

from decimal import Decimal
from typing import cast

from beanie import PydanticObjectId
from bson.decimal128 import Decimal128
from motor.motor_asyncio import AsyncIOMotorClientSession
from pymongo import ReturnDocument

from app.accounts.constants import AccountStatus
from app.accounts.models import Account
from app.core.exceptions import BusinessRuleException, NotFoundException
from app.database.mongodb import unwrap_session
from app.repositories.base import BaseRepository


class InsufficientFundsError(BusinessRuleException):
    """Raised when a debit would take the balance below the account's minimum."""

    error_code = "INSUFFICIENT_FUNDS"

    def __init__(self) -> None:
        super().__init__("Insufficient funds for this debit.")


class AccountNotActiveError(BusinessRuleException):
    """Raised when a balance mutation is attempted on a non-active, non-existent,
    or deleted account."""

    error_code = "ACCOUNT_NOT_ACTIVE"

    def __init__(self) -> None:
        super().__init__("Account is not active or does not exist.")


class AccountRepository(BaseRepository[Account]):
    def __init__(self) -> None:
        super().__init__(Account)

    async def get_by_account_number(self, account_number: str) -> Account | None:
        return await self.find_one({"account_number": account_number})

    async def list_for_customer(self, customer_id: str) -> list[Account]:
        return await self.find_many({"customer_id": customer_id}).to_list()

    async def credit(
        self,
        account_id: str,
        amount: Decimal,
        session: AsyncIOMotorClientSession | None = None,
    ) -> Account:
        """Atomically increases balance by `amount`. Fails if the account is
        not active (frozen/closed/missing)."""
        if amount <= 0:
            raise ValueError("Credit amount must be positive.")

        collection = Account.get_pymongo_collection()
        raw_session = unwrap_session(session)
        doc = await collection.find_one_and_update(
            {
                "_id": PydanticObjectId(account_id),
                "account_status": AccountStatus.ACTIVE.value,
                "is_deleted": False,
            },
            {"$inc": {"balance": Decimal128(str(amount))}},
            return_document=ReturnDocument.AFTER,
            session=raw_session,
        )
        if doc is None:
            raise AccountNotActiveError()
        return cast(Account, Account.model_validate(doc))

    async def debit(
        self,
        account_id: str,
        amount: Decimal,
        session: AsyncIOMotorClientSession | None = None,
    ) -> Account:
        """Atomically decreases balance by `amount`, enforcing the minimum
        balance floor in the same DB operation (no read-then-write race)."""
        if amount <= 0:
            raise ValueError("Debit amount must be positive.")

        collection = Account.get_pymongo_collection()
        raw_session = unwrap_session(session)

        current = await collection.find_one({"_id": PydanticObjectId(account_id)}, session=raw_session)
        if current is None:
            raise NotFoundException("Account")
        minimum_balance = Decimal(str(current["minimum_balance"]))
        min_required_before_debit = minimum_balance + amount

        doc = await collection.find_one_and_update(
            {
                "_id": PydanticObjectId(account_id),
                "account_status": AccountStatus.ACTIVE.value,
                "is_deleted": False,
                "balance": {"$gte": Decimal128(str(min_required_before_debit))},
            },
            {"$inc": {"balance": Decimal128(str(-amount))}},
            return_document=ReturnDocument.AFTER,
            session=raw_session,
        )
        if doc is None:
            # The guarded update matched nothing — figure out why for a clear error.
            fresh = await collection.find_one({"_id": PydanticObjectId(account_id)}, session=raw_session)
            if fresh is None or fresh.get("account_status") != AccountStatus.ACTIVE.value:
                raise AccountNotActiveError()
            raise InsufficientFundsError()
        return cast(Account, Account.model_validate(doc))
