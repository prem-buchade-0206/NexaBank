"""
Atomic sequence generator.

MongoDB has no native auto-increment, so this implements the standard
"counters collection" pattern via findOneAndUpdate($inc, upsert=True),
which is atomic even under concurrent writers. Used for human-readable,
sequential identifiers — customer numbers, account numbers, transaction
references, loan numbers — that must never collide.
"""

from pymongo import ReturnDocument

from app.database.mongodb import get_database


async def get_next_sequence(name: str) -> int:
    """Atomically increment and return the next value for a named counter."""
    db = get_database()
    result = await db["counters"].find_one_and_update(
        {"_id": name},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(result["value"])


async def generate_sequential_id(prefix: str, counter_name: str, padding: int = 6) -> str:
    """e.g. generate_sequential_id('CUS', 'customer_number') -> 'CUS-000001'."""
    next_value = await get_next_sequence(counter_name)
    return f"{prefix}-{str(next_value).zfill(padding)}"
