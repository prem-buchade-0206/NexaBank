"""
Base persistence model.

Every collection's Document model should inherit from `BaseDocument` to get
consistent audit fields (`created_at`, `updated_at`, `created_by`,
`updated_by`, `is_deleted`, `status`) without repeating them per module.
"""

from datetime import UTC, datetime

from beanie import Document
from pydantic import Field

from app.core.constants import RecordStatus


def _utcnow() -> datetime:
    return datetime.now(UTC)


class BaseDocument(Document):
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    created_by: str | None = None
    updated_by: str | None = None
    is_deleted: bool = False
    status: RecordStatus = RecordStatus.ACTIVE

    class Settings:
        use_state_management = True

    def mark_updated(self, by: str | None = None) -> None:
        self.updated_at = _utcnow()
        if by:
            self.updated_by = by

    def soft_delete(self, by: str | None = None) -> None:
        self.is_deleted = True
        self.mark_updated(by)
