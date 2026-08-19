from datetime import date, datetime
from decimal import Decimal

from app.schemas.base import BaseSchema


class CustomerReportRow(BaseSchema):
    customer_number: str
    full_name: str
    email: str
    kyc_status: str
    created_at: datetime


class CustomerReportSummary(BaseSchema):
    total_customers: int
    by_kyc_status: dict[str, int]
    rows: list[CustomerReportRow]


class TransactionReportRow(BaseSchema):
    transaction_type: str
    transaction_status: str
    count: int
    total_amount: Decimal


class TransactionReportSummary(BaseSchema):
    period_start: date | None
    period_end: date | None
    breakdown: list[TransactionReportRow]
    total_transactions: int
    total_amount: Decimal


class LoanReportRow(BaseSchema):
    loan_status: str
    count: int
    total_principal: Decimal
    total_outstanding: Decimal


class LoanReportSummary(BaseSchema):
    breakdown: list[LoanReportRow]
    total_loans: int
    total_outstanding: Decimal


class RevenueReportSummary(BaseSchema):
    period_start: date
    period_end: date
    total_transaction_charges: Decimal
    transaction_count: int
    note: str = (
        "Revenue is currently derived only from Transaction.charges, which no module "
        "assesses a nonzero value for yet — fee/interest-income logic is a follow-up, "
        "not fabricated here."
    )
