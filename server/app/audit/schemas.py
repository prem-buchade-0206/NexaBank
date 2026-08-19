from datetime import datetime
from typing import Any

from app.schemas.base import BaseSchema


class AuditLogRead(BaseSchema):
    id: str
    user_id: str | None = None
    action: str
    module: str
    resource_id: str | None = None
    ip_address: str | None = None
    device: str | None = None
    metadata: dict[str, Any] = {}
    created_at: datetime
