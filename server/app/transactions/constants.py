from enum import StrEnum


class TransactionType(StrEnum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"


class TransactionStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


TRANSACTION_REFERENCE_PREFIX = "TXN"
TRANSACTION_REFERENCE_COUNTER = "transaction_reference"
