from typing import Any, NoReturn

from app.audit.models import AuditLog
from app.repositories.base import BaseRepository


class AuditLogImmutableError(Exception):
    """Raised on any attempt to modify or delete an audit log record."""

    def __init__(self) -> None:
        super().__init__("Audit logs are immutable and cannot be modified or deleted.")


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self) -> None:
        super().__init__(AuditLog)

    async def update(
        self, document: AuditLog, updates: dict[str, Any], updated_by: str | None = None
    ) -> NoReturn:
        raise AuditLogImmutableError()

    async def soft_delete(self, document: AuditLog, deleted_by: str | None = None) -> NoReturn:
        raise AuditLogImmutableError()

    async def hard_delete(self, document: AuditLog) -> NoReturn:
        raise AuditLogImmutableError()
