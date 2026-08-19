"""
Migration runner.

MongoDB is schemaless, so "migrations" here mean data migrations (backfills,
renames, reshapes) rather than DDL. Each migration is a standalone async
function registered in `MIGRATIONS`, applied in order, and recorded in the
`_migrations` collection so it never runs twice.
"""

from collections.abc import Awaitable, Callable
from datetime import UTC, datetime

from app.core.logger import logger
from app.database.mongodb import get_database

Migration = Callable[[], Awaitable[None]]

# Register migrations here as they're written, e.g.:
# MIGRATIONS: dict[str, Migration] = {"2025_01_add_kyc_status": add_kyc_status_migration}
MIGRATIONS: dict[str, Migration] = {}


async def run_pending_migrations() -> None:
    db = get_database()
    applied_cursor = db["_migrations"].find({}, {"name": 1})
    applied = {doc["name"] async for doc in applied_cursor}

    for name, migration_fn in MIGRATIONS.items():
        if name in applied:
            continue
        logger.info("Applying migration: {}", name)
        await migration_fn()
        await db["_migrations"].insert_one({"name": name, "applied_at": datetime.now(UTC)})
        logger.info("Migration applied: {}", name)
