from fastapi import APIRouter, Depends, Request, status

from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.auth.service import AuthService
from app.core.config import settings
from app.core.responses import success_response
from app.users.models import User
from app.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new customer account")
async def register(payload: RegisterRequest) -> dict:
    user = await auth_service.register(payload)
    return success_response(
        data=UserRead.model_validate({**user.model_dump(), "id": str(user.id)}),
        message="Account created successfully.",
    )


@router.post("/login", summary="Authenticate and receive access + refresh tokens")
async def login(payload: LoginRequest, request: Request) -> dict:
    _, tokens = await auth_service.login(
        payload, ip_address=_client_ip(request), user_agent=request.headers.get("user-agent")
    )
    return success_response(data=tokens, message="Login successful.")


@router.post("/refresh", summary="Exchange a refresh token for a new token pair (rotates the refresh token)")
async def refresh(payload: RefreshRequest, request: Request) -> dict:
    tokens: TokenResponse = await auth_service.refresh(
        payload.refresh_token,
        ip_address=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return success_response(data=tokens, message="Token refreshed successfully.")


@router.post("/logout", summary="Revoke a single refresh token / session")
async def logout(payload: LogoutRequest) -> dict:
    await auth_service.logout(payload.refresh_token)
    return success_response(message="Logged out successfully.")


@router.post("/logout-all", summary="Revoke every active session for the current user")
async def logout_all(current_user: User = Depends(get_current_user)) -> dict:
    count = await auth_service.logout_all(str(current_user.id))
    return success_response(data={"sessions_revoked": count}, message="Logged out of all devices.")


@router.get("/me", summary="Get the current authenticated user's profile")
async def get_me(current_user: User = Depends(get_current_user)) -> dict:
    return success_response(
        data=UserRead.model_validate({**current_user.model_dump(), "id": str(current_user.id)})
    )


@router.post("/change-password", summary="Change password while authenticated")
async def change_password(
    payload: ChangePasswordRequest, current_user: User = Depends(get_current_user)
) -> dict:
    await auth_service.change_password(current_user, payload.old_password, payload.new_password)
    return success_response(message="Password changed successfully. Please log in again.")


@router.post("/forgot-password", summary="Request a password reset token")
async def forgot_password(payload: ForgotPasswordRequest) -> dict:
    raw_token = await auth_service.request_password_reset(payload.email)
    message = "If that email is registered, a password reset link has been sent."
    data = None
    if not settings.is_production and raw_token:
        # Dev/staging convenience only — production dispatches via the
        # notifications module and never returns the token in the response.
        data = {"reset_token": raw_token}
    return success_response(data=data, message=message)


@router.post("/reset-password", summary="Reset password using a valid reset token")
async def reset_password(payload: ResetPasswordRequest) -> dict:
    await auth_service.reset_password(payload.token, payload.new_password)
    return success_response(message="Password reset successfully. Please log in with your new password.")


@router.get("/sessions", summary="List active sessions/devices for the current user")
async def list_sessions(current_user: User = Depends(get_current_user)) -> dict:
    sessions = await auth_service.list_sessions(str(current_user.id))
    data = [
        {
            "id": str(s.id),
            "device": s.device,
            "user_agent": s.user_agent,
            "ip_address": s.ip_address,
            "created_at": s.created_at.isoformat(),
            "expires_at": s.expires_at.isoformat(),
        }
        for s in sessions
    ]
    return success_response(data=data)
