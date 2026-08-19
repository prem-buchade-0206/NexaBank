from enum import StrEnum


class AccountType(StrEnum):
    SAVINGS = "savings"
    CURRENT = "current"
    FIXED_DEPOSIT = "fixed_deposit"


class AccountStatus(StrEnum):
    ACTIVE = "active"
    FROZEN = "frozen"
    DORMANT = "dormant"
    CLOSED = "closed"


ACCOUNT_NUMBER_PREFIXES: dict[AccountType, str] = {
    AccountType.SAVINGS: "SAV",
    AccountType.CURRENT: "CUR",
    AccountType.FIXED_DEPOSIT: "FD",
}

ACCOUNT_NUMBER_COUNTER_PREFIX = "account_number"  # one counter per account type
DEFAULT_CURRENCY = "USD"
