"""User persistence model.

Holds authentication material, profile, role assignments, and login-security
state (failed attempts, lockout). Never exposed directly via API — always
through `app.users.schemas.UserRead`, which excludes `hashed_password`.
"""

from datetime import UTC, datetime

from pydantic import EmailStr
from pymongo import IndexModel

from app.models.base import BaseDocument


def _now() -> datetime:
    return datetime.now(UTC)


class User(BaseDocument):
    # ---- Identity ----
    email: EmailStr
    username: str
    hashed_password: str
    full_name: str
    phone: str | None = None

    # ---- Roles (RBAC) ----
    role_codes: list[str] = []  # references Role.code

    # ---- Account state ----
    is_active: bool = True
    is_verified: bool = False
    must_change_password: bool = False

    # ---- Login security ----
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    last_login_at: datetime | None = None
    last_login_ip: str | None = None
    password_changed_at: datetime | None = None

    class Settings(BaseDocument.Settings):
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
            IndexModel("username", unique=True),
            IndexModel("role_codes"),
        ]

    @property
    def is_locked(self) -> bool:
        return self.locked_until is not None and self.locked_until > _now()
