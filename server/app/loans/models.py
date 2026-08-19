"""Loan and LoanPayment persistence models.

`Loan` holds the terms and current status. `LoanPayment` is the amortization
schedule — one row per installment, generated in full at approval/disbursement
time and updated (amount_paid, paid_at, payment_status) as repayments come in.
"""

from datetime import date, datetime
from decimal import Decimal

from pymongo import IndexModel

from app.loans.constants import LoanStatus, PaymentStatus
from app.models.base import BaseDocument


class Loan(BaseDocument):
    loan_number: str
    customer_id: str
    disbursement_account_id: str

    principal_amount: Decimal
    interest_rate: float  # annual percentage
    tenure_months: int
    emi_amount: Decimal
    purpose: str | None = None

    loan_status: LoanStatus = LoanStatus.PENDING
    outstanding_principal: Decimal = Decimal("0")  # set to principal_amount on disbursement

    applied_at: datetime
    approved_at: datetime | None = None
    approved_by: str | None = None
    rejected_at: datetime | None = None
    rejected_by: str | None = None
    rejection_reason: str | None = None
    disbursed_at: datetime | None = None
    closed_at: datetime | None = None

    class Settings(BaseDocument.Settings):
        name = "loans"
        indexes = [
            IndexModel("loan_number", unique=True),
            IndexModel("customer_id"),
            IndexModel("loan_status"),
        ]


class LoanPayment(BaseDocument):
    loan_id: str
    installment_number: int
    due_date: date
    amount_due: Decimal
    amount_paid: Decimal = Decimal("0")
    paid_at: datetime | None = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    transaction_id: str | None = None  # links to the ledger Transaction once paid

    class Settings(BaseDocument.Settings):
        name = "loan_payments"
        indexes = [
            IndexModel([("loan_id", 1), ("installment_number", 1)], unique=True),
            IndexModel("due_date"),
            IndexModel("payment_status"),
        ]
