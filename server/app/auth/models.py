"""Auth-support persistence models: refresh-token sessions and reset tokens."""

from datetime import datetime

from pymongo import IndexModel

from app.models.base import BaseDocument


class Session(BaseDocument):
    """One row per issued refresh token, enabling rotation, revocation, and
    'logout all devices'. The access token itself is stateless and not
    tracked here."""

    user_id: str
    refresh_token_jti: str
    device: str | None = None
    user_agent: str | None = None
    ip_address: str | None = None
    expires_at: datetime
    revoked_at: datetime | None = None

    class Settings(BaseDocument.Settings):
        name = "sessions"
        indexes = [
            IndexModel("refresh_token_jti", unique=True),
            IndexModel("user_id"),
            IndexModel("expires_at", expireAfterSeconds=0),
        ]

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None


class PasswordResetToken(BaseDocument):
    user_id: str
    token_hash: str
    expires_at: datetime
    used_at: datetime | None = None

    class Settings(BaseDocument.Settings):
        name = "password_reset_tokens"
        indexes = [
            IndexModel("token_hash", unique=True),
            IndexModel("user_id"),
            IndexModel("expires_at", expireAfterSeconds=0),
        ]

    @property
    def is_used(self) -> bool:
        return self.used_at is not None
