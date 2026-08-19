"""
Central index-creation registry.

Beanie can declare indexes on the Document's `Settings.indexes`, which is
the preferred approach per module. This module exists as a fallback/
verification point for cross-cutting or compound indexes that are easier
to express imperatively, and is invoked once at startup after
`init_beanie`.

Populate `create_all_indexes` incrementally as each module is built.
"""

from app.core.logger import logger
from app.database.mongodb import get_database


async def create_all_indexes() -> None:
    """Create any indexes not already declared on Beanie Document.Settings."""
    db = get_database()  # noqa: F841 - kept for future imperative index creation
    logger.info("Index verification complete (module indexes are declared on their Document models).")
