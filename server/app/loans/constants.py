from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum


class LoanStatus(StrEnum):
    PENDING = "pending"  # awaiting approval decision
    APPROVED = "approved"  # approved but not yet disbursed
    ACTIVE = "active"  # disbursed, repayment in progress
    REJECTED = "rejected"
    CLOSED = "closed"  # fully repaid
    DEFAULTED = "defaulted"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


LOAN_NUMBER_PREFIX = "LN"
LOAN_NUMBER_COUNTER = "loan_number"

MIN_TENURE_MONTHS = 1
MAX_TENURE_MONTHS = 360  # 30 years


def calculate_emi(principal: Decimal, annual_interest_rate: float, tenure_months: int) -> Decimal:
    """Standard reducing-balance EMI formula:

        EMI = P * r * (1+r)^n / ((1+r)^n - 1)

    where r is the *monthly* interest rate (annual_rate / 12 / 100) and n is
    the tenure in months. A zero interest rate degrades gracefully to a flat
    principal/tenure split. Rounded to 2 decimal places (currency-safe).
    """
    if tenure_months <= 0:
        raise ValueError("tenure_months must be positive.")

    if annual_interest_rate == 0:
        emi = principal / tenure_months
    else:
        monthly_rate = Decimal(str(annual_interest_rate)) / Decimal("12") / Decimal("100")
        factor = (1 + monthly_rate) ** tenure_months
        emi = principal * monthly_rate * factor / (factor - 1)

    return emi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
