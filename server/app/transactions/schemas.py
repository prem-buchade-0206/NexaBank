from datetime import datetime
from decimal import Decimal

from pydantic import model_validator

from app.schemas.base import AuditedSchema, BaseSchema
from app.transactions.constants import TransactionStatus, TransactionType


class DepositRequest(BaseSchema):
    account_id: str
    amount: Decimal
    description: str | None = None

    @model_validator(mode="after")
    def _validate_amount(self) -> "DepositRequest":
        if self.amount <= 0:
            raise ValueError("amount must be positive.")
        return self


class WithdrawalRequest(BaseSchema):
    account_id: str
    amount: Decimal
    description: str | None = None

    @model_validator(mode="after")
    def _validate_amount(self) -> "WithdrawalRequest":
        if self.amount <= 0:
            raise ValueError("amount must be positive.")
        return self


class TransferRequest(BaseSchema):
    source_account_id: str
    destination_account_id: str
    amount: Decimal
    description: str | None = None

    @model_validator(mode="after")
    def _validate(self) -> "TransferRequest":
        if self.amount <= 0:
            raise ValueError("amount must be positive.")
        if self.source_account_id == self.destination_account_id:
            raise ValueError("source_account_id and destination_account_id must differ.")
        return self


class TransactionRead(AuditedSchema):
    id: str
    reference_number: str
    transaction_type: TransactionType
    source_account_id: str | None = None
    destination_account_id: str | None = None
    amount: Decimal
    charges: Decimal
    currency: str
    transaction_status: TransactionStatus
    description: str | None = None
    failure_reason: str | None = None
    source_balance_after: Decimal | None = None
    destination_balance_after: Decimal | None = None
    initiated_by: str
    completed_at: datetime | None = None
