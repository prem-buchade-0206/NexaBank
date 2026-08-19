"""Transaction persistence model.

A Transaction row is the ledger record of a completed (or failed) money
movement. It is created inside the SAME MongoDB session/transaction as the
account balance mutation(s) it describes — see `app.transactions.service` —
so a Transaction never exists without its balance change actually having
happened, and vice versa.
"""

from datetime import datetime
from decimal import Decimal

from pymongo import IndexModel

from app.models.base import BaseDocument
from app.transactions.constants import TransactionStatus, TransactionType


class Transaction(BaseDocument):
    reference_number: str
    transaction_type: TransactionType

    source_account_id: str | None = None  # None for a pure deposit (external funds in)
    destination_account_id: str | None = None  # None for a pure withdrawal (funds out)

    amount: Decimal
    charges: Decimal = Decimal("0")
    currency: str

    transaction_status: TransactionStatus = TransactionStatus.PENDING
    description: str | None = None
    failure_reason: str | None = None

    # Balance immediately after this transaction was applied, captured at
    # write time from the same atomic credit/debit call. This is what lets
    # the Statements module reconstruct an account's balance as of any past
    # date without a separate balance-snapshot mechanism.
    source_balance_after: Decimal | None = None
    destination_balance_after: Decimal | None = None

    initiated_by: str  # user id
    completed_at: datetime | None = None

    class Settings(BaseDocument.Settings):
        name = "transactions"
        indexes = [
            IndexModel("reference_number", unique=True),
            IndexModel("source_account_id"),
            IndexModel("destination_account_id"),
            IndexModel("transaction_type"),
            IndexModel("transaction_status"),
            IndexModel("created_at"),
        ]
