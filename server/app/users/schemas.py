from datetime import datetime

from pydantic import EmailStr

from app.schemas.base import AuditedSchema, BaseSchema


class UserCreate(BaseSchema):
    email: EmailStr
    username: str
    password: str
    full_name: str
    phone: str | None = None
    role_codes: list[str] = []


class UserUpdate(BaseSchema):
    full_name: str | None = None
    phone: str | None = None
    role_codes: list[str] | None = None


class UserRead(AuditedSchema):
    id: str
    email: EmailStr
    username: str
    full_name: str
    phone: str | None = None
    role_codes: list[str]
    is_active: bool
    is_verified: bool
    last_login_at: datetime | None = None


class UserSummary(BaseSchema):
    """Minimal user projection embedded inside other modules' responses."""

    id: str
    full_name: str
    email: EmailStr
