from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorClientSession

from app.database.mongodb import unwrap_session
from app.repositories.base import BaseRepository
from app.transactions.models import Transaction


class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self) -> None:
        super().__init__(Transaction)

    async def create_in_session(
        self, transaction: Transaction, session: AsyncIOMotorClientSession
    ) -> Transaction:
        await transaction.insert(session=unwrap_session(session))
        return transaction

    def _account_filter(self, account_id: str) -> dict:
        return {"$or": [{"source_account_id": account_id}, {"destination_account_id": account_id}]}

    async def list_for_account(self, account_id: str) -> list[Transaction]:
        return await self.model.find({"is_deleted": False, **self._account_filter(account_id)}).to_list()

    async def list_for_account_in_range(
        self, account_id: str, start: datetime, end: datetime
    ) -> list[Transaction]:
        return (
            await self.model.find(
                {
                    "is_deleted": False,
                    "created_at": {"$gte": start, "$lte": end},
                    **self._account_filter(account_id),
                }
            )
            .sort("+created_at")
            .to_list()
        )

    async def last_for_account_before(self, account_id: str, before: datetime) -> Transaction | None:
        results = (
            await self.model.find(
                {"is_deleted": False, "created_at": {"$lt": before}, **self._account_filter(account_id)}
            )
            .sort("-created_at")
            .limit(1)
            .to_list()
        )
        return results[0] if results else None
