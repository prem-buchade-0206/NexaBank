from datetime import UTC, datetime

from app.repositories.base import BaseRepository
from app.users.models import User


class UserRepository(BaseRepository[User]):
    def __init__(self) -> None:
        super().__init__(User)

    async def get_by_email(self, email: str) -> User | None:
        return await self.find_one({"email": email.lower()})

    async def get_by_username(self, username: str) -> User | None:
        return await self.find_one({"username": username})

    async def get_by_email_or_username(self, identifier: str) -> User | None:
        return await self.model.find_one(
            {
                "is_deleted": False,
                "$or": [{"email": identifier.lower()}, {"username": identifier}],
            }
        )

    async def register_failed_login(self, user: User, locked_until: datetime | None) -> User:
        user.failed_login_attempts += 1
        user.locked_until = locked_until
        await user.save()
        return user

    async def register_successful_login(self, user: User, ip: str | None) -> User:
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(UTC)
        user.last_login_ip = ip
        await user.save()
        return user
