from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user, require_permissions
from app.core.responses import success_response
from app.notifications.models import Notification
from app.notifications.schemas import NotificationRead, NotificationSendRequest
from app.notifications.service import NotificationService
from app.users.models import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])
service = NotificationService()


def _to_read(notification: Notification) -> NotificationRead:
    return NotificationRead.model_validate({**notification.model_dump(), "id": str(notification.id)})


@router.get("/", summary="List my notifications")
async def list_my_notifications(
    unread_only: bool = Query(default=False), current_user: User = Depends(get_current_user)
) -> dict:
    items = await service.list_for_user(str(current_user.id), unread_only=unread_only)
    return success_response(data=[_to_read(n) for n in items])


@router.post("/{notification_id}/read", summary="Mark a notification as read")
async def mark_notification_read(
    notification_id: str, current_user: User = Depends(get_current_user)
) -> dict:
    notification = await service.mark_read(notification_id, str(current_user.id))
    return success_response(data=_to_read(notification))


@router.post("/read-all", summary="Mark all of my notifications as read")
async def mark_all_read(current_user: User = Depends(get_current_user)) -> dict:
    count = await service.mark_all_read(str(current_user.id))
    return success_response(data={"marked_read": count})


@router.post(
    "/",
    dependencies=[Depends(require_permissions("notifications:create"))],
    summary="Send a notification to a user (staff only)",
)
async def send_notification(payload: NotificationSendRequest) -> dict:
    notification = await service.send(
        user_id=payload.user_id,
        channel=payload.channel,
        subject=payload.subject,
        body=payload.body,
        related_module=payload.related_module,
        resource_id=payload.resource_id,
    )
    return success_response(data=_to_read(notification), message="Notification sent.")
