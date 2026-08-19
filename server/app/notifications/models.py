"""Notification persistence model.

Every notification is persisted regardless of channel — including
email/SMS/push, so there's always an in-app record of what was
communicated, even if the external channel delivery fails or the provider
isn't configured. See `app.notifications.providers` for how actual
delivery is (or isn't yet) wired up per channel.
"""

from datetime import datetime
from typing import Any

from pymongo import IndexModel

from app.models.base import BaseDocument
from app.notifications.constants import NotificationChannel, NotificationStatus


class Notification(BaseDocument):
    user_id: str
    channel: NotificationChannel
    subject: str
    body: str

    notification_status: NotificationStatus = NotificationStatus.PENDING
    failure_reason: str | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None

    related_module: str | None = None
    resource_id: str | None = None
    metadata: dict[str, Any] = {}

    class Settings(BaseDocument.Settings):
        name = "notifications"
        indexes = [
            IndexModel("user_id"),
            IndexModel("channel"),
            IndexModel("notification_status"),
            IndexModel("created_at"),
        ]

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
