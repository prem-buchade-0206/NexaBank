from datetime import datetime
from decimal import Decimal
from typing import Any

from bson.decimal128 import Decimal128
from motor.motor_asyncio import AsyncIOMotorClientSession

from app.database.mongodb import unwrap_session
from app.loans.constants import PaymentStatus
from app.loans.models import Loan, LoanPayment
from app.repositories.base import BaseRepository


def _bsonify(value: Any) -> Any:  # noqa: ANN401 - passthrough converter
    """Raw pymongo calls (unlike Beanie's own insert/save) don't run Beanie's
    encoders, so `Decimal` must be converted to BSON `Decimal128` by hand or
    pymongo will fail to encode it."""
    return Decimal128(str(value)) if isinstance(value, Decimal) else value


class LoanRepository(BaseRepository[Loan]):
    def __init__(self) -> None:
        super().__init__(Loan)

    async def get_by_loan_number(self, loan_number: str) -> Loan | None:
        return await self.find_one({"loan_number": loan_number})

    async def list_for_customer(self, customer_id: str) -> list[Loan]:
        return await self.find_many({"customer_id": customer_id}).to_list()

    async def update_in_session(
        self, loan: Loan, updates: dict[str, Any], session: AsyncIOMotorClientSession
    ) -> None:
        collection = Loan.get_pymongo_collection()
        safe_updates = {key: _bsonify(value) for key, value in updates.items()}
        await collection.update_one({"_id": loan.id}, {"$set": safe_updates}, session=unwrap_session(session))


class LoanPaymentRepository(BaseRepository[LoanPayment]):
    def __init__(self) -> None:
        super().__init__(LoanPayment)

    async def list_for_loan(self, loan_id: str) -> list[LoanPayment]:
        return (
            await self.model.find({"loan_id": loan_id, "is_deleted": False})
            .sort("+installment_number")
            .to_list()
        )

    async def get_next_unpaid(self, loan_id: str) -> LoanPayment | None:
        return await self.find_one({"loan_id": loan_id, "payment_status": {"$ne": PaymentStatus.PAID.value}})

    async def get_installment(self, loan_id: str, installment_number: int) -> LoanPayment | None:
        return await self.find_one({"loan_id": loan_id, "installment_number": installment_number})

    async def bulk_insert_in_session(
        self, payments: list[LoanPayment], session: AsyncIOMotorClientSession
    ) -> None:
        # Beanie's own insert_many applies its Decimal->Decimal128 encoding
        # correctly, unlike a raw collection.insert_many with plain dicts.
        if payments:
            await LoanPayment.insert_many(payments, session=unwrap_session(session))

    async def mark_paid_in_session(
        self,
        payment: LoanPayment,
        amount_paid: Decimal,
        paid_at: datetime,
        transaction_id: str,
        session: AsyncIOMotorClientSession,
    ) -> None:
        collection = LoanPayment.get_pymongo_collection()
        await collection.update_one(
            {"_id": payment.id},
            {
                "$set": {
                    "amount_paid": _bsonify(amount_paid),
                    "paid_at": paid_at,
                    "payment_status": PaymentStatus.PAID.value,
                    "transaction_id": transaction_id,
                    "updated_at": paid_at,
                }
            },
            session=unwrap_session(session),
        )
