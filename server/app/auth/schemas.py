from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema


class RegisterRequest(BaseSchema):
    email: EmailStr
    username: str = Field(min_length=3, max_length=32)
    password: str
    full_name: str
    phone: str | None = None


class LoginRequest(BaseSchema):
    identifier: str = Field(description="Email or username")
    password: str
    remember_me: bool = False


class RefreshRequest(BaseSchema):
    refresh_token: str


class LogoutRequest(BaseSchema):
    refresh_token: str


class ChangePasswordRequest(BaseSchema):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseSchema):
    email: EmailStr


class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class SessionRead(BaseSchema):
    id: str
    device: str | None = None
    user_agent: str | None = None
    ip_address: str | None = None
    created_at: str
    expires_at: str
    is_current: bool = False
