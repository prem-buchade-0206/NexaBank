"""
MongoDB connection lifecycle.

Beanie document models across all modules are registered here at startup.
As each module (Phase 2+) is built, its Document models are appended to
`DOCUMENT_MODELS` so `init_beanie` picks them up automatically.
"""

from typing import cast

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pymongo.asynchronous.client_session import AsyncClientSession

from app.accounts.models import Account
from app.audit.models import AuditLog
from app.auth.models import PasswordResetToken, Session
from app.beneficiaries.models import Beneficiary
from app.core.config import settings
from app.core.logger import logger
from app.customers.models import Customer
from app.loans.models import Loan, LoanPayment
from app.notifications.models import Notification
from app.permissions.models import Permission
from app.roles.models import Role
from app.statements.models import Statement
from app.transactions.models import Transaction
from app.users.models import User

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None

# All modules in the spec are represented here — this is the complete set.
DOCUMENT_MODELS: list[type] = [
    User,
    Role,
    Permission,
    Session,
    PasswordResetToken,
    Customer,
    Account,
    Transaction,
    Beneficiary,
    Loan,
    LoanPayment,
    Notification,
    Statement,
    AuditLog,
]


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("MongoDB client accessed before initialization.")
    return _client


def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("MongoDB database accessed before initialization.")
    return _database


async def connect_to_mongo() -> None:
    global _client, _database
    logger.info("Connecting to MongoDB at {}", settings.MONGODB_DB_NAME)
    _client = AsyncIOMotorClient(settings.MONGODB_URI, uuidRepresentation="standard")
    _database = _client[settings.MONGODB_DB_NAME]

    # Fail fast if the database is unreachable.
    await _client.admin.command("ping")

    if DOCUMENT_MODELS:
        await init_beanie(database=_database, document_models=DOCUMENT_MODELS)  # type: ignore[arg-type]

    logger.info("MongoDB connection established.")


async def close_mongo_connection() -> None:
    if _client is not None:
        _client.close()
        logger.info("MongoDB connection closed.")


async def check_database_health() -> bool:
    try:
        await get_client().admin.command("ping")
        return True
    except Exception as exc:  # noqa: BLE001 - health check must never raise
        logger.error("Database health check failed: {}", exc)
        return False


def unwrap_session(
    session: AsyncIOMotorClientSession | None,
) -> AsyncClientSession | None:
    """Beanie's `get_pymongo_collection()` (and `Document.insert(session=...)`)
    expect the raw pymongo async session, not Motor's `AsyncIOMotorClientSession`
    wrapper. Motor wrapper objects expose the underlying object via `.delegate`.
    Pass a Motor session through this before handing it to either."""
    if session is None:
        return None
    return cast(AsyncClientSession, session.delegate)
