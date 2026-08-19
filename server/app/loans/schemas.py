from datetime import date, datetime
from decimal import Decimal

from pydantic import model_validator

from app.loans.constants import MAX_TENURE_MONTHS, MIN_TENURE_MONTHS, LoanStatus, PaymentStatus
from app.schemas.base import AuditedSchema, BaseSchema


class LoanApplyRequest(BaseSchema):
    customer_id: str
    disbursement_account_id: str
    principal_amount: Decimal
    interest_rate: float
    tenure_months: int
    purpose: str | None = None

    @model_validator(mode="after")
    def _validate(self) -> "LoanApplyRequest":
        if self.principal_amount <= 0:
            raise ValueError("principal_amount must be positive.")
        if self.interest_rate < 0:
            raise ValueError("interest_rate cannot be negative.")
        if not (MIN_TENURE_MONTHS <= self.tenure_months <= MAX_TENURE_MONTHS):
            raise ValueError(f"tenure_months must be between {MIN_TENURE_MONTHS} and {MAX_TENURE_MONTHS}.")
        return self


class LoanRejectRequest(BaseSchema):
    reason: str


class LoanPaymentRequest(BaseSchema):
    source_account_id: str
    installment_number: int | None = None  # defaults to the next unpaid installment
    amount: Decimal | None = None  # defaults to that installment's amount_due


class LoanRead(AuditedSchema):
    id: str
    loan_number: str
    customer_id: str
    disbursement_account_id: str
    principal_amount: Decimal
    interest_rate: float
    tenure_months: int
    emi_amount: Decimal
    purpose: str | None = None
    loan_status: LoanStatus
    outstanding_principal: Decimal
    applied_at: datetime
    approved_at: datetime | None = None
    rejected_at: datetime | None = None
    rejection_reason: str | None = None
    disbursed_at: datetime | None = None
    closed_at: datetime | None = None


class LoanPaymentRead(AuditedSchema):
    id: str
    loan_id: str
    installment_number: int
    due_date: date
    amount_due: Decimal
    amount_paid: Decimal
    paid_at: datetime | None = None
    payment_status: PaymentStatus
    transaction_id: str | None = None
