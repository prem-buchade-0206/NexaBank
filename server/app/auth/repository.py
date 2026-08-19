from datetime import UTC, datetime

from app.auth.models import PasswordResetToken, Session
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    def __init__(self) -> None:
        super().__init__(Session)

    async def get_by_jti(self, jti: str) -> Session | None:
        return await self.find_one({"refresh_token_jti": jti})

    async def list_active_for_user(self, user_id: str) -> list[Session]:
        return await self.model.find({"user_id": user_id, "is_deleted": False, "revoked_at": None}).to_list()

    async def revoke(self, session: Session) -> Session:
        session.revoked_at = datetime.now(UTC)
        await session.save()
        return session

    async def revoke_all_for_user(self, user_id: str) -> int:
        sessions = await self.list_active_for_user(user_id)
        for session in sessions:
            await self.revoke(session)
        return len(sessions)


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    def __init__(self) -> None:
        super().__init__(PasswordResetToken)

    async def get_by_token_hash(self, token_hash: str) -> PasswordResetToken | None:
        return await self.find_one({"token_hash": token_hash})
