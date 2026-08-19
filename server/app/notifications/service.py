from datetime import UTC, datetime
from typing import Any

from app.core.exceptions import AuthorizationException
from app.notifications.constants import NotificationChannel, NotificationStatus
from app.notifications.models import Notification
from app.notifications.providers import get_provider
from app.notifications.repository import NotificationRepository


class NotificationService:
    def __init__(self) -> None:
        self.notification_repository = NotificationRepository()

    async def send(
        self,
        user_id: str,
        channel: NotificationChannel,
        subject: str,
        body: str,
        recipient: str | None = None,
        related_module: str | None = None,
        resource_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Notification:
        """Persists the notification, then attempts delivery through the
        channel's provider. Delivery failure does not raise — it's recorded
        on the notification itself (notification_status=FAILED,
        failure_reason set), since a failed email shouldn't break whatever
        business operation triggered it (e.g. a loan approval succeeding
        should not roll back because a notification email bounced)."""
        notification = Notification(
            user_id=user_id,
            channel=channel,
            subject=subject,
            body=body,
            related_module=related_module,
            resource_id=resource_id,
            metadata=metadata or {},
        )
        await self.notification_repository.create(notification)

        if channel == NotificationChannel.IN_APP:
            # The persisted record IS the delivery for in-app notifications.
            notification.notification_status = NotificationStatus.SENT
            notification.sent_at = datetime.now(UTC)
            await notification.save()
            return notification

        try:
            provider = get_provider(channel)
            await provider.send(recipient or user_id, subject, body)
            notification.notification_status = NotificationStatus.SENT
            notification.sent_at = datetime.now(UTC)
        except Exception as exc:  # noqa: BLE001 - provider failures are expected and recorded, not raised
            notification.notification_status = NotificationStatus.FAILED
            notification.failure_reason = str(exc)

        await notification.save()
        return notification

    async def list_for_user(self, user_id: str, unread_only: bool = False) -> list[Notification]:
        return await self.notification_repository.list_for_user(user_id, unread_only)

    async def mark_read(self, notification_id: str, user_id: str) -> Notification:
        notification = await self.notification_repository.get_by_id_or_raise(notification_id)
        if notification.user_id != user_id:
            raise AuthorizationException("You do not have access to this notification.")

        if notification.read_at is None:
            notification.read_at = datetime.now(UTC)
            notification.mark_updated(user_id)
            await notification.save()
        return notification

    async def mark_all_read(self, user_id: str) -> int:
        return await self.notification_repository.mark_all_read_for_user(user_id, datetime.now(UTC))
