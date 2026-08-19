"""
Notification delivery providers.

This module has no SMTP/SMS/push credentials configured, so the default
provider for every channel simply logs the delivery attempt rather than
silently pretending to send something it can't. This is a real, working
abstraction point, not a placeholder: to wire up actual delivery, implement
`NotificationProvider` against your chosen service (e.g. `boto3` SES for
email, Twilio for SMS, FCM/APNs for push) and register it in
`PROVIDERS` below — nothing else in the module needs to change.
"""

from typing import Protocol

from app.core.logger import logger
from app.notifications.constants import NotificationChannel


class NotificationProvider(Protocol):
    async def send(self, recipient: str, subject: str, body: str) -> None:
        """Deliver the notification. Raise on failure — the caller (
        NotificationService.send) catches this and records it as a failed
        delivery rather than a successful one."""
        ...


class LogNotificationProvider:
    """Default provider for every channel: logs instead of delivering.
    Safe to run with no external credentials configured; makes the
    notification's existence visible in application logs for local
    development and staging."""

    def __init__(self, channel: NotificationChannel) -> None:
        self.channel = channel

    async def send(self, recipient: str, subject: str, body: str) -> None:
        logger.info(
            "[{} notification] to={} subject={!r} body={!r}",
            self.channel.value.upper(),
            recipient,
            subject,
            body,
        )


# Swap any entry here for a real implementation once credentials exist —
# e.g. PROVIDERS[NotificationChannel.EMAIL] = SesEmailProvider(...).
PROVIDERS: dict[NotificationChannel, NotificationProvider] = {
    channel: LogNotificationProvider(channel) for channel in NotificationChannel
}


def get_provider(channel: NotificationChannel) -> NotificationProvider:
    return PROVIDERS[channel]
