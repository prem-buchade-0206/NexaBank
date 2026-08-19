"""
Analytics service.

The dashboard endpoint is the one place in the app that uses the Redis
cache from `app.core.cache` — it's an aggregation over several collections
and is the kind of endpoint dashboards poll frequently, so caching it for
a short TTL (see DASHBOARD_CACHE_TTL_SECONDS) avoids re-running five
aggregation pipelines on every page refresh. If Redis isn't configured,
`cache_get_json`/`cache_set_json` no-op and the dashboard is simply
computed fresh every time — correct either way, just not as fast.
"""

from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import Any

from dateutil.relativedelta import relativedelta

from app.accounts.constants import AccountStatus
from app.accounts.models import Account
from app.analytics.schemas import DashboardSummary, GrowthPoint, GrowthReport
from app.core.cache import cache_get_json, cache_set_json
from app.customers.models import Customer
from app.loans.constants import LoanStatus
from app.loans.models import Loan
from app.transactions.models import Transaction

DASHBOARD_CACHE_TTL_SECONDS = 60
DASHBOARD_CACHE_KEY = "analytics:dashboard"


def _to_decimal(value: Any) -> Decimal:
    return Decimal(str(value)) if value is not None else Decimal("0")


class AnalyticsService:
    async def dashboard(self) -> DashboardSummary:
        cached = await cache_get_json(DASHBOARD_CACHE_KEY)
        if cached is not None:
            return DashboardSummary.model_validate(cached)

        now = datetime.now(UTC)
        today_start = datetime.combine(now.date(), time.min, tzinfo=UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = month_start - relativedelta(months=1)

        total_customers = await Customer.get_pymongo_collection().count_documents({"is_deleted": False})
        total_accounts = await Account.get_pymongo_collection().count_documents({"is_deleted": False})
        active_accounts = await Account.get_pymongo_collection().count_documents(
            {"is_deleted": False, "account_status": AccountStatus.ACTIVE.value}
        )
        active_loans = await Loan.get_pymongo_collection().count_documents(
            {"is_deleted": False, "loan_status": LoanStatus.ACTIVE.value}
        )
        transactions_today = await Transaction.get_pymongo_collection().count_documents(
            {"is_deleted": False, "created_at": {"$gte": today_start}}
        )
        new_customers_this_month = await Customer.get_pymongo_collection().count_documents(
            {"is_deleted": False, "created_at": {"$gte": month_start}}
        )
        new_customers_last_month = await Customer.get_pymongo_collection().count_documents(
            {"is_deleted": False, "created_at": {"$gte": last_month_start, "$lt": month_start}}
        )

        daily_revenue = await self._revenue_since(today_start)
        monthly_revenue = await self._revenue_since(month_start)

        growth_pct = None
        if new_customers_last_month > 0:
            growth_pct = round(
                (new_customers_this_month - new_customers_last_month) / new_customers_last_month * 100, 2
            )

        summary = DashboardSummary(
            total_customers=total_customers,
            active_accounts=active_accounts,
            total_accounts=total_accounts,
            transactions_today=transactions_today,
            active_loans=active_loans,
            daily_revenue=daily_revenue,
            monthly_revenue=monthly_revenue,
            new_customers_this_month=new_customers_this_month,
            new_customers_last_month=new_customers_last_month,
            customer_growth_pct=growth_pct,
        )

        await cache_set_json(DASHBOARD_CACHE_KEY, summary.model_dump(), DASHBOARD_CACHE_TTL_SECONDS)
        return summary

    async def _revenue_since(self, since: datetime) -> Decimal:
        pipeline: list[dict[str, Any]] = [
            {
                "$match": {
                    "is_deleted": False,
                    "transaction_status": "completed",
                    "created_at": {"$gte": since},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$charges"}}},
        ]
        result = [doc async for doc in await Transaction.get_pymongo_collection().aggregate(pipeline)]
        return _to_decimal(result[0]["total"]) if result else Decimal("0")

    async def growth(self, months: int = 6) -> GrowthReport:
        today = date.today()
        points: list[GrowthPoint] = []
        for i in range(months - 1, -1, -1):
            period_date = today.replace(day=1) - relativedelta(months=i)
            next_period = period_date + relativedelta(months=1)
            start = datetime.combine(period_date, time.min, tzinfo=UTC)
            end = datetime.combine(next_period, time.min, tzinfo=UTC)
            count = await Customer.get_pymongo_collection().count_documents(
                {"is_deleted": False, "created_at": {"$gte": start, "$lt": end}}
            )
            points.append(GrowthPoint(period=period_date.strftime("%Y-%m"), new_customers=count))
        return GrowthReport(months=points)

    async def revenue_for_range(self, date_from: date, date_to: date) -> Decimal:
        start = datetime.combine(date_from, time.min, tzinfo=UTC)
        end = datetime.combine(date_to, time.max, tzinfo=UTC)
        pipeline: list[dict[str, Any]] = [
            {
                "$match": {
                    "is_deleted": False,
                    "transaction_status": "completed",
                    "created_at": {"$gte": start, "$lte": end},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$charges"}}},
        ]
        result = [doc async for doc in await Transaction.get_pymongo_collection().aggregate(pipeline)]
        return _to_decimal(result[0]["total"]) if result else Decimal("0")
