from datetime import datetime
from typing import Any

from app.notifications.constants import NotificationChannel, NotificationStatus
from app.schemas.base import AuditedSchema, BaseSchema


class NotificationSendRequest(BaseSchema):
    user_id: str
    channel: NotificationChannel
    subject: str
    body: str
    related_module: str | None = None
    resource_id: str | None = None


class NotificationRead(AuditedSchema):
    id: str
    user_id: str
    channel: NotificationChannel
    subject: str
    body: str
    notification_status: NotificationStatus
    failure_reason: str | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None
    related_module: str | None = None
    resource_id: str | None = None
    metadata: dict[str, Any] = {}
