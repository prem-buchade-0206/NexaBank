"""Account persistence model.

`balance` is a `Decimal` (stored as BSON Decimal128), never a float — banking
math must never be subject to binary floating-point rounding error. Balance
mutations must go through `AccountRepository.credit`/`debit`, which use
atomic `find_one_and_update` operations rather than read-modify-write, so
concurrent transactions on the same account can never race.
"""

from datetime import UTC, date, datetime
from decimal import Decimal

from pydantic import Field
from pymongo import IndexModel

from app.accounts.constants import DEFAULT_CURRENCY, AccountStatus, AccountType
from app.models.base import BaseDocument


def _utcnow() -> datetime:
    return datetime.now(UTC)


class Account(BaseDocument):
    account_number: str
    account_type: AccountType
    customer_id: str

    balance: Decimal = Decimal("0")
    minimum_balance: Decimal = Decimal("0")
    currency: str = DEFAULT_CURRENCY

    account_status: AccountStatus = AccountStatus.ACTIVE
    branch: str | None = None

    # ---- Interest / Fixed Deposit specific ----
    interest_rate: float | None = None  # annual percentage, e.g. 3.5
    maturity_date: date | None = None

    # ---- Lifecycle timestamps ----
    opened_at: datetime = Field(default_factory=_utcnow)
    frozen_at: datetime | None = None
    frozen_reason: str | None = None
    closed_at: datetime | None = None
    closed_reason: str | None = None

    class Settings(BaseDocument.Settings):
        name = "accounts"
        indexes = [
            IndexModel("account_number", unique=True),
            IndexModel("customer_id"),
            IndexModel("account_type"),
            IndexModel("account_status"),
        ]
