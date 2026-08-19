from datetime import date, datetime
from decimal import Decimal

from pydantic import model_validator

from app.schemas.base import AuditedSchema, BaseSchema
from app.statements.constants import StatementFormat
from app.transactions.constants import TransactionType


class StatementRequest(BaseSchema):
    period_start: date
    period_end: date
    export_format: StatementFormat = StatementFormat.JSON

    @model_validator(mode="after")
    def _validate_range(self) -> "StatementRequest":
        if self.period_start > self.period_end:
            raise ValueError("period_start must not be after period_end.")
        return self


class StatementLineItem(BaseSchema):
    date: datetime
    reference_number: str
    transaction_type: TransactionType
    description: str | None = None
    debit: Decimal | None = None
    credit: Decimal | None = None
    balance_after: Decimal | None = None


class StatementSummary(BaseSchema):
    account_id: str
    account_number: str
    currency: str
    period_start: date
    period_end: date
    opening_balance: Decimal
    closing_balance: Decimal
    total_credits: Decimal
    total_debits: Decimal
    transaction_count: int
    line_items: list[StatementLineItem]


class StatementRead(AuditedSchema):
    id: str
    account_id: str
    customer_id: str
    period_start: date
    period_end: date
    export_format: StatementFormat
    opening_balance: Decimal
    closing_balance: Decimal
    transaction_count: int
    generated_by: str
