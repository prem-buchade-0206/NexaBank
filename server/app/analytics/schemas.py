from decimal import Decimal

from app.schemas.base import BaseSchema


class DashboardSummary(BaseSchema):
    total_customers: int
    active_accounts: int
    total_accounts: int
    transactions_today: int
    active_loans: int
    daily_revenue: Decimal
    monthly_revenue: Decimal
    new_customers_this_month: int
    new_customers_last_month: int
    customer_growth_pct: float | None


class GrowthPoint(BaseSchema):
    period: str  # "YYYY-MM"
    new_customers: int


class GrowthReport(BaseSchema):
    months: list[GrowthPoint]
