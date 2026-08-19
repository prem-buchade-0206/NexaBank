"""Statement persistence model.

This collection is NOT where statement content lives — statements are
generated on demand from the Transaction ledger (see
`app.statements.service`) and streamed straight back in the response, never
stored as binary blobs in MongoDB. This model is the audit trail of *that
a statement was generated*: who requested it, for which account and period,
in what format — satisfying the spec's "Download Records" requirement
without duplicating transaction data into a second collection.
"""

from datetime import date
from decimal import Decimal

from pymongo import IndexModel

from app.models.base import BaseDocument
from app.statements.constants import StatementFormat


class Statement(BaseDocument):
    account_id: str
    customer_id: str
    period_start: date
    period_end: date
    export_format: StatementFormat
    opening_balance: Decimal
    closing_balance: Decimal
    transaction_count: int
    generated_by: str  # user id

    class Settings(BaseDocument.Settings):
        name = "statements"
        indexes = [
            IndexModel("account_id"),
            IndexModel("customer_id"),
            IndexModel("created_at"),
        ]
