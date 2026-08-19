from datetime import date, datetime
from decimal import Decimal

from pydantic import model_validator

from app.accounts.constants import DEFAULT_CURRENCY, AccountStatus, AccountType
from app.schemas.base import AuditedSchema, BaseSchema


class AccountCreate(BaseSchema):
    customer_id: str
    account_type: AccountType
    currency: str = DEFAULT_CURRENCY
    branch: str | None = None
    initial_deposit: Decimal = Decimal("0")
    minimum_balance: Decimal = Decimal("0")
    interest_rate: float | None = None
    maturity_date: date | None = None

    @model_validator(mode="after")
    def _validate_fixed_deposit_fields(self) -> "AccountCreate":
        if self.account_type == AccountType.FIXED_DEPOSIT and self.maturity_date is None:
            raise ValueError("maturity_date is required for fixed deposit accounts.")
        if self.initial_deposit < 0:
            raise ValueError("initial_deposit cannot be negative.")
        return self


class AccountUpdate(BaseSchema):
    branch: str | None = None
    interest_rate: float | None = None
    minimum_balance: Decimal | None = None


class FreezeAccountRequest(BaseSchema):
    reason: str


class CloseAccountRequest(BaseSchema):
    reason: str | None = None


class AccountRead(AuditedSchema):
    id: str
    account_number: str
    account_type: AccountType
    customer_id: str
    balance: Decimal
    minimum_balance: Decimal
    currency: str
    account_status: AccountStatus
    branch: str | None = None
    interest_rate: float | None = None
    maturity_date: date | None = None
    opened_at: datetime
    frozen_at: datetime | None = None
    frozen_reason: str | None = None
    closed_at: datetime | None = None
    closed_reason: str | None = None


class AccountSummary(BaseSchema):
    """Minimal projection embedded inside transactions/loans responses."""

    id: str
    account_number: str
    account_type: AccountType
    balance: Decimal
    currency: str
