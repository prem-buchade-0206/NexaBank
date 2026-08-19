"""
Report service.

Every report is built with a MongoDB aggregation pipeline run directly
against the collection — never by loading full collections into Python and
summing in application code — per the performance principles in the spec
(avoid full collection scans, minimize data transferred).
"""

import csv
import io
from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import Any

from app.audit.models import AuditLog
from app.customers.models import Customer
from app.loans.models import Loan
from app.reports.schemas import (
    CustomerReportRow,
    CustomerReportSummary,
    LoanReportRow,
    LoanReportSummary,
    RevenueReportSummary,
    TransactionReportRow,
    TransactionReportSummary,
)
from app.transactions.models import Transaction


def _to_decimal(value: Any) -> Decimal:
    return Decimal(str(value)) if value is not None else Decimal("0")


class ReportService:
    async def customer_report(
        self, date_from: date | None = None, date_to: date | None = None
    ) -> CustomerReportSummary:
        collection = Customer.get_pymongo_collection()
        match: dict[str, Any] = {"is_deleted": False}
        if date_from or date_to:
            created_filter: dict[str, Any] = {}
            if date_from:
                created_filter["$gte"] = datetime.combine(date_from, time.min, tzinfo=UTC)
            if date_to:
                created_filter["$lte"] = datetime.combine(date_to, time.max, tzinfo=UTC)
            match["created_at"] = created_filter

        by_status_cursor = await collection.aggregate(
            [{"$match": match}, {"$group": {"_id": "$kyc_status", "count": {"$sum": 1}}}]
        )
        by_kyc_status = {doc["_id"]: doc["count"] async for doc in by_status_cursor}

        rows_cursor = collection.find(match).sort("created_at", -1).limit(500)
        rows = [
            CustomerReportRow(
                customer_number=doc["customer_number"],
                full_name=doc["full_name"],
                email=doc["email"],
                kyc_status=doc["kyc_status"],
                created_at=doc["created_at"],
            )
            async for doc in rows_cursor
        ]

        return CustomerReportSummary(
            total_customers=sum(by_kyc_status.values()), by_kyc_status=by_kyc_status, rows=rows
        )

    async def transaction_report(
        self, date_from: date | None = None, date_to: date | None = None
    ) -> TransactionReportSummary:
        collection = Transaction.get_pymongo_collection()
        match: dict[str, Any] = {"is_deleted": False}
        if date_from or date_to:
            created_filter: dict[str, Any] = {}
            if date_from:
                created_filter["$gte"] = datetime.combine(date_from, time.min, tzinfo=UTC)
            if date_to:
                created_filter["$lte"] = datetime.combine(date_to, time.max, tzinfo=UTC)
            match["created_at"] = created_filter

        pipeline: list[dict[str, Any]] = [
            {"$match": match},
            {
                "$group": {
                    "_id": {"type": "$transaction_type", "status": "$transaction_status"},
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$amount"},
                }
            },
        ]
        breakdown = [
            TransactionReportRow(
                transaction_type=doc["_id"]["type"],
                transaction_status=doc["_id"]["status"],
                count=doc["count"],
                total_amount=_to_decimal(doc["total_amount"]),
            )
            async for doc in await collection.aggregate(pipeline)
        ]

        return TransactionReportSummary(
            period_start=date_from,
            period_end=date_to,
            breakdown=breakdown,
            total_transactions=sum(row.count for row in breakdown),
            total_amount=sum((row.total_amount for row in breakdown), Decimal("0")),
        )

    async def loan_report(self) -> LoanReportSummary:
        collection = Loan.get_pymongo_collection()
        pipeline: list[dict[str, Any]] = [
            {"$match": {"is_deleted": False}},
            {
                "$group": {
                    "_id": "$loan_status",
                    "count": {"$sum": 1},
                    "total_principal": {"$sum": "$principal_amount"},
                    "total_outstanding": {"$sum": "$outstanding_principal"},
                }
            },
        ]
        breakdown = [
            LoanReportRow(
                loan_status=doc["_id"],
                count=doc["count"],
                total_principal=_to_decimal(doc["total_principal"]),
                total_outstanding=_to_decimal(doc["total_outstanding"]),
            )
            async for doc in await collection.aggregate(pipeline)
        ]

        return LoanReportSummary(
            breakdown=breakdown,
            total_loans=sum(row.count for row in breakdown),
            total_outstanding=sum((row.total_outstanding for row in breakdown), Decimal("0")),
        )

    async def revenue_report(self, date_from: date, date_to: date) -> RevenueReportSummary:
        collection = Transaction.get_pymongo_collection()
        match = {
            "is_deleted": False,
            "transaction_status": "completed",
            "created_at": {
                "$gte": datetime.combine(date_from, time.min, tzinfo=UTC),
                "$lte": datetime.combine(date_to, time.max, tzinfo=UTC),
            },
        }
        pipeline: list[dict[str, Any]] = [
            {"$match": match},
            {"$group": {"_id": None, "total_charges": {"$sum": "$charges"}, "count": {"$sum": 1}}},
        ]
        result = [doc async for doc in await collection.aggregate(pipeline)]
        total_charges = _to_decimal(result[0]["total_charges"]) if result else Decimal("0")
        count = result[0]["count"] if result else 0

        return RevenueReportSummary(
            period_start=date_from,
            period_end=date_to,
            total_transaction_charges=total_charges,
            transaction_count=count,
        )

    async def audit_report_rows(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
        module: str | None = None,
    ) -> list[AuditLog]:
        collection = AuditLog.get_pymongo_collection()
        match: dict[str, Any] = {"is_deleted": False}
        if module:
            match["module"] = module
        if date_from or date_to:
            created_filter: dict[str, Any] = {}
            if date_from:
                created_filter["$gte"] = datetime.combine(date_from, time.min, tzinfo=UTC)
            if date_to:
                created_filter["$lte"] = datetime.combine(date_to, time.max, tzinfo=UTC)
            match["created_at"] = created_filter

        docs = await collection.find(match).sort("created_at", -1).limit(1000).to_list(length=1000)
        return [AuditLog.model_validate(doc) for doc in docs]

    @staticmethod
    def render_csv(headers: list[str], rows: list[list[Any]]) -> bytes:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([str(value) if value is not None else "" for value in row])
        return buffer.getvalue().encode("utf-8")
