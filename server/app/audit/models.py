"""AuditLog persistence model.

Per the spec, audit logs must never be editable. This is enforced in code,
not just by omission from the router: `AuditRepository` overrides the
mutating methods inherited from `BaseRepository` to raise, so even a future
developer working inside this module can't accidentally wire up an update
or delete path. The only write path is `AuditService.log()`, called from
other modules' services when something audit-worthy happens.
"""

from typing import Any

from pymongo import IndexModel

from app.models.base import BaseDocument


class AuditLog(BaseDocument):
    user_id: str | None = None  # None for events where no user is identified (e.g. bad login identifier)
    action: str
    module: str
    resource_id: str | None = None
    ip_address: str | None = None
    device: str | None = None
    metadata: dict[str, Any] = {}

    class Settings(BaseDocument.Settings):
        name = "audit_logs"
        indexes = [
            IndexModel("user_id"),
            IndexModel("module"),
            IndexModel("action"),
            IndexModel("resource_id"),
            IndexModel("created_at"),
        ]
