"""
Transaction service.

Every money-moving operation (deposit, withdrawal, transfer) runs inside a
single MongoDB client-session transaction: the account balance mutation(s)
AND the ledger `Transaction` record are committed together, or neither is
committed at all. There is no window where a balance changes but no ledger
entry exists, or vice versa — MongoDB's transaction commit is the atomicity
boundary, not application-level compensating logic.

Requires MongoDB running as a replica set (even a single-node one) — see
docker-compose.yml. A standalone `mongod` does not support transactions.
"""

from datetime import UTC, datetime
from decimal import Decimal

from motor.motor_asyncio import AsyncIOMotorClientSession

from app.accounts.repository import AccountRepository
from app.accounts.service import AccountService
from app.core.exceptions import BusinessRuleException
from app.core.logger import logger
from app.core.pagination import PaginationParams, SortParams
from app.database.mongodb import get_client
from app.services.base import BaseService
from app.transactions.constants import (
    TRANSACTION_REFERENCE_COUNTER,
    TRANSACTION_REFERENCE_PREFIX,
    TransactionStatus,
    TransactionType,
)
from app.transactions.models import Transaction
from app.transactions.repository import TransactionRepository
from app.utils.sequence import generate_sequential_id


class TransactionService(BaseService[Transaction]):
    def __init__(self) -> None:
        self.transaction_repository = TransactionRepository()
        self.account_repository = AccountRepository()
        self.account_service = AccountService()
        super().__init__(self.transaction_repository)

    async def deposit(
        self, account_id: str, amount: Decimal, description: str | None, initiated_by: str
    ) -> Transaction:
        account = await self.account_service.get_by_id(account_id)
        reference = await generate_sequential_id(TRANSACTION_REFERENCE_PREFIX, TRANSACTION_REFERENCE_COUNTER)

        client = get_client()
        async with await client.start_session() as session, session.start_transaction():
            updated = await self.account_repository.credit(account_id, amount, session=session)
            transaction = Transaction(
                reference_number=reference,
                transaction_type=TransactionType.DEPOSIT,
                destination_account_id=account_id,
                destination_balance_after=updated.balance,
                amount=amount,
                currency=account.currency,
                transaction_status=TransactionStatus.COMPLETED,
                description=description,
                initiated_by=initiated_by,
            )
            await self._mark_completed_and_insert(transaction, session)

        logger.info("Deposit {} completed on account {}", reference, account_id)
        return transaction

    async def withdraw(
        self, account_id: str, amount: Decimal, description: str | None, initiated_by: str
    ) -> Transaction:
        account = await self.account_service.get_by_id(account_id)
        reference = await generate_sequential_id(TRANSACTION_REFERENCE_PREFIX, TRANSACTION_REFERENCE_COUNTER)

        client = get_client()
        async with await client.start_session() as session, session.start_transaction():
            updated = await self.account_repository.debit(account_id, amount, session=session)
            transaction = Transaction(
                reference_number=reference,
                transaction_type=TransactionType.WITHDRAWAL,
                source_account_id=account_id,
                source_balance_after=updated.balance,
                amount=amount,
                currency=account.currency,
                transaction_status=TransactionStatus.COMPLETED,
                description=description,
                initiated_by=initiated_by,
            )
            await self._mark_completed_and_insert(transaction, session)

        logger.info("Withdrawal {} completed on account {}", reference, account_id)
        return transaction

    async def transfer(
        self,
        source_account_id: str,
        destination_account_id: str,
        amount: Decimal,
        description: str | None,
        initiated_by: str,
    ) -> Transaction:
        source = await self.account_service.get_by_id(source_account_id)
        destination = await self.account_service.get_by_id(destination_account_id)

        if source.currency != destination.currency:
            raise BusinessRuleException(
                "Cross-currency transfers are not supported yet. "
                f"Source is {source.currency}, destination is {destination.currency}."
            )

        reference = await generate_sequential_id(TRANSACTION_REFERENCE_PREFIX, TRANSACTION_REFERENCE_COUNTER)

        client = get_client()
        async with await client.start_session() as session, session.start_transaction():
            # Debit first: if funds are insufficient this raises and the
            # transaction context manager aborts automatically — nothing
            # is written, including no partial credit to the destination.
            updated_source = await self.account_repository.debit(source_account_id, amount, session=session)
            updated_destination = await self.account_repository.credit(
                destination_account_id, amount, session=session
            )

            transaction = Transaction(
                reference_number=reference,
                transaction_type=TransactionType.TRANSFER,
                source_account_id=source_account_id,
                destination_account_id=destination_account_id,
                source_balance_after=updated_source.balance,
                destination_balance_after=updated_destination.balance,
                amount=amount,
                currency=source.currency,
                transaction_status=TransactionStatus.COMPLETED,
                description=description,
                initiated_by=initiated_by,
            )
            await self._mark_completed_and_insert(transaction, session)

        logger.info("Transfer {} completed: {} -> {}", reference, source_account_id, destination_account_id)
        return transaction

    async def _mark_completed_and_insert(
        self, transaction: Transaction, session: AsyncIOMotorClientSession
    ) -> None:
        transaction.completed_at = datetime.now(UTC)
        await self.transaction_repository.create_in_session(transaction, session)

    async def list_for_account(self, account_id: str) -> list[Transaction]:
        return await self.transaction_repository.list_for_account(account_id)

    async def list_for_account_in_range(
        self, account_id: str, start: datetime, end: datetime
    ) -> list[Transaction]:
        return await self.transaction_repository.list_for_account_in_range(account_id, start, end)

    async def last_transaction_before(self, account_id: str, before: datetime) -> Transaction | None:
        return await self.transaction_repository.last_for_account_before(account_id, before)

    async def search(
        self,
        pagination: PaginationParams,
        sort: SortParams,
        transaction_type: str | None = None,
        transaction_status: str | None = None,
        account_id: str | None = None,
    ) -> tuple[list[Transaction], int]:
        filters: dict = {}
        if transaction_type:
            filters["transaction_type"] = transaction_type
        if transaction_status:
            filters["transaction_status"] = transaction_status
        if account_id:
            filters["$or"] = [{"source_account_id": account_id}, {"destination_account_id": account_id}]
        return await self.list(pagination, sort, filters)
