"""
API v1 aggregator router.

Every module contributes its own APIRouter (defined inside that module's
own folder, e.g. `app/auth/router.py`), which gets included here. This is
the complete module set from the spec.
"""

from fastapi import APIRouter

from app.accounts.router import router as accounts_router
from app.analytics.router import router as analytics_router
from app.api.v1 import health
from app.audit.router import router as audit_router
from app.auth.router import router as auth_router
from app.beneficiaries.router import router as beneficiaries_router
from app.customers.router import router as customers_router
from app.loans.router import router as loans_router
from app.notifications.router import router as notifications_router
from app.permissions.router import router as permissions_router
from app.reports.router import router as reports_router
from app.roles.router import router as roles_router
from app.statements.router import router as statements_router
from app.transactions.router import router as transactions_router
from app.users.router import router as users_router

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(roles_router)
api_router.include_router(permissions_router)
api_router.include_router(customers_router)
api_router.include_router(accounts_router)
api_router.include_router(transactions_router)
api_router.include_router(beneficiaries_router)
api_router.include_router(statements_router)
api_router.include_router(loans_router)
api_router.include_router(audit_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(analytics_router)
