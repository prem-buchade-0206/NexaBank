"""
Loan service.

Approval/disbursement and repayment both run inside a single MongoDB
session transaction — the account balance mutation, the ledger Transaction
record, and the Loan/LoanPayment updates are committed together or not at
all, following the same atomicity pattern established in the Transactions
module (Phase 5).
"""

from calendar import monthrange
from datetime import UTC, date, datetime
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from app.accounts.repository import AccountRepository
from app.accounts.service import AccountService
from app.audit.constants import AuditAction
from app.audit.service import AuditService
from app.core.exceptions import BusinessRuleException
from app.core.logger import logger
from app.core.pagination import PaginationParams, SortParams
from app.customers.constants import KYCStatus
from app.customers.service import CustomerService
from app.database.mongodb import get_client
from app.loans.constants import (
    LOAN_NUMBER_COUNTER,
    LOAN_NUMBER_PREFIX,
    LoanStatus,
    PaymentStatus,
    calculate_emi,
)
from app.loans.models import Loan, LoanPayment
from app.loans.repository import LoanPaymentRepository, LoanRepository
from app.loans.schemas import LoanApplyRequest
from app.notifications.constants import NotificationChannel
from app.notifications.service import NotificationService
from app.services.base import BaseService
from app.transactions.constants import (
    TRANSACTION_REFERENCE_COUNTER,
    TRANSACTION_REFERENCE_PREFIX,
    TransactionStatus,
    TransactionType,
)
from app.transactions.models import Transaction
from app.transactions.repository import TransactionRepository
from app.utils.sequence import generate_sequential_id


class LoanService(BaseService[Loan]):
    def __init__(self) -> None:
        self.loan_repository = LoanRepository()
        self.payment_repository = LoanPaymentRepository()
        self.account_repository = AccountRepository()
        self.account_service = AccountService()
        self.customer_service = CustomerService()
        self.audit_service = AuditService()
        self.notification_service = NotificationService()
        self.transaction_repository = TransactionRepository()
        super().__init__(self.loan_repository)

    async def apply(self, payload: LoanApplyRequest, applied_by: str | None = None) -> Loan:
        customer = await self.customer_service.get_by_id(payload.customer_id)
        if customer.kyc_status != KYCStatus.VERIFIED:
            raise BusinessRuleException("Customer's KYC must be verified before applying for a loan.")

        # Disbursement account must exist and belong to the applicant.
        account = await self.account_service.get_by_id(payload.disbursement_account_id)
        if account.customer_id != payload.customer_id:
            raise BusinessRuleException("The disbursement account must belong to the applying customer.")

        emi = calculate_emi(payload.principal_amount, payload.interest_rate, payload.tenure_months)
        loan_number = await generate_sequential_id(LOAN_NUMBER_PREFIX, LOAN_NUMBER_COUNTER)

        loan = Loan(
            loan_number=loan_number,
            customer_id=payload.customer_id,
            disbursement_account_id=payload.disbursement_account_id,
            principal_amount=payload.principal_amount,
            interest_rate=payload.interest_rate,
            tenure_months=payload.tenure_months,
            emi_amount=emi,
            purpose=payload.purpose,
            applied_at=datetime.now(UTC),
            created_by=applied_by,
        )
        return await self.loan_repository.create(loan)

    async def reject(self, loan_id: str, reason: str, rejected_by: str) -> Loan:
        loan = await self.loan_repository.get_by_id_or_raise(loan_id)
        if loan.loan_status != LoanStatus.PENDING:
            raise BusinessRuleException("Only a pending loan application can be rejected.")

        loan.loan_status = LoanStatus.REJECTED
        loan.rejected_at = datetime.now(UTC)
        loan.rejected_by = rejected_by
        loan.rejection_reason = reason
        loan.mark_updated(rejected_by)
        await loan.save()
        await self.audit_service.log(
            action=AuditAction.LOAN_REJECTED.value,
            module="loans",
            user_id=rejected_by,
            resource_id=str(loan.id),
            metadata={"reason": reason},
        )
        await self._notify_customer(
            loan,
            "Loan application rejected",
            f"Your loan application {loan.loan_number} was not approved: {reason}",
        )
        return loan

    async def approve_and_disburse(self, loan_id: str, approved_by: str) -> Loan:
        loan = await self.loan_repository.get_by_id_or_raise(loan_id)
        if loan.loan_status != LoanStatus.PENDING:
            raise BusinessRuleException("Only a pending loan application can be approved.")

        account = await self.account_service.get_by_id(loan.disbursement_account_id)
        reference = await generate_sequential_id(TRANSACTION_REFERENCE_PREFIX, TRANSACTION_REFERENCE_COUNTER)
        now = datetime.now(UTC)

        schedule = self._build_schedule(loan)

        client = get_client()
        async with await client.start_session() as session, session.start_transaction():
            updated_account = await self.account_repository.credit(
                loan.disbursement_account_id, loan.principal_amount, session=session
            )

            disbursement_txn = Transaction(
                reference_number=reference,
                transaction_type=TransactionType.DEPOSIT,
                destination_account_id=loan.disbursement_account_id,
                destination_balance_after=updated_account.balance,
                amount=loan.principal_amount,
                currency=account.currency,
                transaction_status=TransactionStatus.COMPLETED,
                description=f"Loan disbursement {loan.loan_number}",
                initiated_by=approved_by,
                completed_at=now,
            )
            await self.transaction_repository.create_in_session(disbursement_txn, session)
            await self.payment_repository.bulk_insert_in_session(schedule, session)
            await self.loan_repository.update_in_session(
                loan,
                {
                    "loan_status": LoanStatus.ACTIVE.value,
                    "approved_at": now,
                    "approved_by": approved_by,
                    "disbursed_at": now,
                    "outstanding_principal": loan.principal_amount,
                    "updated_at": now,
                    "updated_by": approved_by,
                },
                session=session,
            )

        logger.info("Loan {} approved and disbursed ({} installments)", loan.loan_number, len(schedule))
        await self.audit_service.log(
            action=AuditAction.LOAN_APPROVED.value,
            module="loans",
            user_id=approved_by,
            resource_id=loan_id,
            metadata={"principal_amount": str(loan.principal_amount)},
        )
        await self._notify_customer(
            loan,
            "Loan approved and disbursed",
            f"Your loan {loan.loan_number} for {loan.principal_amount} has been approved and disbursed.",
        )
        return await self.loan_repository.get_by_id_or_raise(loan_id)

    async def _notify_customer(self, loan: Loan, subject: str, body: str) -> None:
        """Best-effort in-app notification — a missing/portal-less customer
        record should never break the loan operation that triggered this."""
        try:
            customer = await self.customer_service.get_by_id(loan.customer_id)
        except Exception:  # noqa: BLE001 - notification is best-effort, never blocks the loan action
            return
        if customer.user_id:
            await self.notification_service.send(
                user_id=customer.user_id,
                channel=NotificationChannel.IN_APP,
                subject=subject,
                body=body,
                related_module="loans",
                resource_id=str(loan.id),
            )

    def _build_schedule(self, loan: Loan) -> list[LoanPayment]:
        first_due = date.today() + relativedelta(months=1)
        schedule = []
        for i in range(1, loan.tenure_months + 1):
            due = first_due + relativedelta(months=i - 1)
            # Clamp to the last valid day of the month (handles e.g. Jan 31 + 1mo).
            last_day = monthrange(due.year, due.month)[1]
            due = due.replace(day=min(due.day, last_day))
            schedule.append(
                LoanPayment(
                    loan_id=str(loan.id),
                    installment_number=i,
                    due_date=due,
                    amount_due=loan.emi_amount,
                )
            )
        return schedule

    async def make_payment(
        self,
        loan_id: str,
        source_account_id: str,
        installment_number: int | None,
        amount: Decimal | None,
        paid_by: str,
    ) -> LoanPayment:
        loan = await self.loan_repository.get_by_id_or_raise(loan_id)
        if loan.loan_status != LoanStatus.ACTIVE:
            raise BusinessRuleException("Payments can only be made on an active loan.")

        installment = (
            await self.payment_repository.get_installment(loan_id, installment_number)
            if installment_number is not None
            else await self.payment_repository.get_next_unpaid(loan_id)
        )
        if installment is None:
            raise BusinessRuleException("No matching unpaid installment was found for this loan.")
        if installment.payment_status == PaymentStatus.PAID:
            raise BusinessRuleException("This installment has already been paid.")

        pay_amount = amount if amount is not None else installment.amount_due
        if pay_amount <= 0:
            raise BusinessRuleException("Payment amount must be positive.")

        account = await self.account_service.get_by_id(source_account_id)
        reference = await generate_sequential_id(TRANSACTION_REFERENCE_PREFIX, TRANSACTION_REFERENCE_COUNTER)
        now = datetime.now(UTC)

        new_outstanding = max(loan.outstanding_principal - pay_amount, Decimal("0"))
        loan_updates: dict[str, object] = {
            "outstanding_principal": new_outstanding,
            "updated_at": now,
            "updated_by": paid_by,
        }
        if new_outstanding == Decimal("0"):
            loan_updates["loan_status"] = LoanStatus.CLOSED.value
            loan_updates["closed_at"] = now

        client = get_client()
        async with await client.start_session() as session, session.start_transaction():
            updated_account = await self.account_repository.debit(
                source_account_id, pay_amount, session=session
            )

            payment_txn = Transaction(
                reference_number=reference,
                transaction_type=TransactionType.WITHDRAWAL,
                source_account_id=source_account_id,
                source_balance_after=updated_account.balance,
                amount=pay_amount,
                currency=account.currency,
                transaction_status=TransactionStatus.COMPLETED,
                description=f"Loan repayment {loan.loan_number} #{installment.installment_number}",
                initiated_by=paid_by,
                completed_at=now,
            )
            await self.transaction_repository.create_in_session(payment_txn, session)
            await self.payment_repository.mark_paid_in_session(
                installment, pay_amount, now, str(payment_txn.id), session
            )
            await self.loan_repository.update_in_session(loan, loan_updates, session=session)

        logger.info(
            "Loan {} installment #{} paid ({})", loan.loan_number, installment.installment_number, pay_amount
        )
        return await self.payment_repository.get_by_id_or_raise(str(installment.id))

    async def get_schedule(self, loan_id: str) -> list[LoanPayment]:
        return await self.payment_repository.list_for_loan(loan_id)

    async def list_for_customer(self, customer_id: str) -> list[Loan]:
        return await self.loan_repository.list_for_customer(customer_id)

    async def search(
        self, pagination: PaginationParams, sort: SortParams, loan_status: str | None = None
    ) -> tuple[list[Loan], int]:
        filters = {"loan_status": loan_status} if loan_status else None
        return await self.list(pagination, sort, filters)
