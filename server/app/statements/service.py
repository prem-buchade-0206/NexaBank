"""
Statement service.

Balances are reconstructed from the Transaction ledger's `balance_after`
snapshots (see `app.transactions.models.Transaction`) rather than trusting
the account's *current* balance, so a statement for a past period reflects
the account as it stood then, not as it stands today.

Opening balance = the balance_after of the most recent transaction strictly
before `period_start`. If there is none (account's very first statement,
or a period before any activity), it's derived by working backward from
the closing balance through the period's own transactions — this also
correctly accounts for an account's initial deposit, which is applied
directly to the balance at account-opening time rather than logged as a
Transaction (see the Accounts module).
"""

import csv
import io
from datetime import UTC, date, datetime, time
from decimal import Decimal

from fpdf import FPDF

from app.accounts.models import Account
from app.accounts.service import AccountService
from app.statements.constants import StatementFormat
from app.statements.models import Statement
from app.statements.repository import StatementRepository
from app.statements.schemas import StatementLineItem, StatementSummary
from app.transactions.models import Transaction
from app.transactions.service import TransactionService


def _balance_after_for_account(transaction: Transaction, account_id: str) -> Decimal | None:
    if transaction.source_account_id == account_id:
        return transaction.source_balance_after
    if transaction.destination_account_id == account_id:
        return transaction.destination_balance_after
    return None


class StatementService:
    def __init__(self) -> None:
        self.statement_repository = StatementRepository()
        self.transaction_service = TransactionService()
        self.account_service = AccountService()

    async def build_summary(self, account_id: str, period_start: date, period_end: date) -> StatementSummary:
        account = await self.account_service.get_by_id(account_id)

        start_dt = datetime.combine(period_start, time.min, tzinfo=UTC)
        end_dt = datetime.combine(period_end, time.max, tzinfo=UTC)

        period_txns = await self.transaction_service.list_for_account_in_range(account_id, start_dt, end_dt)
        closing_balance = self._closing_balance(account, account_id, period_txns)
        opening_balance = await self._opening_balance(account_id, start_dt, period_txns, closing_balance)

        line_items: list[StatementLineItem] = []
        total_credits = Decimal("0")
        total_debits = Decimal("0")

        for txn in period_txns:
            is_credit = txn.destination_account_id == account_id
            is_debit = txn.source_account_id == account_id
            debit = txn.amount if is_debit else None
            credit = txn.amount if is_credit else None
            if is_credit:
                total_credits += txn.amount
            if is_debit:
                total_debits += txn.amount

            line_items.append(
                StatementLineItem(
                    date=txn.created_at,
                    reference_number=txn.reference_number,
                    transaction_type=txn.transaction_type,
                    description=txn.description,
                    debit=debit,
                    credit=credit,
                    balance_after=_balance_after_for_account(txn, account_id),
                )
            )

        return StatementSummary(
            account_id=account_id,
            account_number=account.account_number,
            currency=account.currency,
            period_start=period_start,
            period_end=period_end,
            opening_balance=opening_balance,
            closing_balance=closing_balance,
            total_credits=total_credits,
            total_debits=total_debits,
            transaction_count=len(line_items),
            line_items=line_items,
        )

    def _closing_balance(self, account: Account, account_id: str, period_txns: list[Transaction]) -> Decimal:
        if period_txns:
            last = max(period_txns, key=lambda t: t.created_at)
            balance = _balance_after_for_account(last, account_id)
            if balance is not None:
                return balance
        # No activity in the period at all — the current balance is still
        # the best available answer (no later transaction moved it since).
        return account.balance

    async def _opening_balance(
        self,
        account_id: str,
        start_dt: datetime,
        period_txns: list[Transaction],
        closing_balance: Decimal,
    ) -> Decimal:
        prior = await self.transaction_service.last_transaction_before(account_id, start_dt)
        if prior is not None:
            balance = _balance_after_for_account(prior, account_id)
            if balance is not None:
                return balance

        # No transaction before the period start: derive opening balance by
        # subtracting this period's own net movement from the closing
        # balance. This is correct even for an account's very first
        # statement, since it implicitly recovers the untracked initial
        # deposit rather than assuming it was zero.
        net_movement = Decimal("0")
        for txn in period_txns:
            if txn.destination_account_id == account_id:
                net_movement += txn.amount
            if txn.source_account_id == account_id:
                net_movement -= txn.amount
        return closing_balance - net_movement

    async def generate(
        self,
        account_id: str,
        period_start: date,
        period_end: date,
        export_format: StatementFormat,
        requested_by: str,
    ) -> tuple[StatementSummary, bytes | None, str | None]:
        summary = await self.build_summary(account_id, period_start, period_end)
        account = await self.account_service.get_by_id(account_id)

        await self.statement_repository.create(
            Statement(
                account_id=account_id,
                customer_id=account.customer_id,
                period_start=period_start,
                period_end=period_end,
                export_format=export_format,
                opening_balance=summary.opening_balance,
                closing_balance=summary.closing_balance,
                transaction_count=summary.transaction_count,
                generated_by=requested_by,
            )
        )

        if export_format == StatementFormat.CSV:
            return summary, self._render_csv(summary), "text/csv"
        if export_format == StatementFormat.PDF:
            return summary, self._render_pdf(summary), "application/pdf"
        return summary, None, None

    def _render_csv(self, summary: StatementSummary) -> bytes:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Account", summary.account_number, "Currency", summary.currency])
        writer.writerow(["Period", str(summary.period_start), "to", str(summary.period_end)])
        writer.writerow(["Opening Balance", str(summary.opening_balance)])
        writer.writerow([])
        writer.writerow(["Date", "Reference", "Type", "Description", "Debit", "Credit", "Balance"])
        for item in summary.line_items:
            writer.writerow(
                [
                    item.date.isoformat(),
                    item.reference_number,
                    item.transaction_type.value,
                    item.description or "",
                    str(item.debit) if item.debit is not None else "",
                    str(item.credit) if item.credit is not None else "",
                    str(item.balance_after) if item.balance_after is not None else "",
                ]
            )
        writer.writerow([])
        writer.writerow(["Closing Balance", str(summary.closing_balance)])
        return buffer.getvalue().encode("utf-8")

    def _render_pdf(self, summary: StatementSummary) -> bytes:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Account Statement", new_x="LMARGIN", new_y="NEXT")

        pdf.set_font("Helvetica", "", 11)
        pdf.cell(
            0, 8, f"Account: {summary.account_number} ({summary.currency})", new_x="LMARGIN", new_y="NEXT"
        )
        pdf.cell(
            0, 8, f"Period: {summary.period_start} to {summary.period_end}", new_x="LMARGIN", new_y="NEXT"
        )
        pdf.cell(0, 8, f"Opening Balance: {summary.opening_balance}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

        pdf.set_font("Helvetica", "B", 10)
        col_widths = (28, 30, 22, 45, 22, 22, 25)
        headers = ["Date", "Reference", "Type", "Description", "Debit", "Credit", "Balance"]
        for width, header in zip(col_widths, headers, strict=True):
            pdf.cell(width, 8, header, border=1)
        pdf.ln()

        pdf.set_font("Helvetica", "", 9)
        for item in summary.line_items:
            row = [
                item.date.strftime("%Y-%m-%d"),
                item.reference_number,
                item.transaction_type.value,
                (item.description or "")[:28],
                str(item.debit) if item.debit is not None else "",
                str(item.credit) if item.credit is not None else "",
                str(item.balance_after) if item.balance_after is not None else "",
            ]
            for width, value in zip(col_widths, row, strict=True):
                pdf.cell(width, 7, value, border=1)
            pdf.ln()

        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 8, f"Closing Balance: {summary.closing_balance}", new_x="LMARGIN", new_y="NEXT")

        return bytes(pdf.output())

    async def list_for_account(self, account_id: str) -> list[Statement]:
        return await self.statement_repository.list_for_account(account_id)
