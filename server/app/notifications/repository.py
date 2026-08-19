from datetime import datetime

from app.notifications.models import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self) -> None:
        super().__init__(Notification)

    async def list_for_user(self, user_id: str, unread_only: bool = False) -> list[Notification]:
        filters: dict = {"user_id": user_id}
        if unread_only:
            filters["read_at"] = None
        return await self.model.find({**filters, "is_deleted": False}).sort("-created_at").to_list()

    async def mark_all_read_for_user(self, user_id: str, read_at: datetime) -> int:
        collection = Notification.get_pymongo_collection()
        result = await collection.update_many(
            {"user_id": user_id, "read_at": None, "is_deleted": False},
            {"$set": {"read_at": read_at, "updated_at": read_at}},
        )
        return int(result.modified_count)
