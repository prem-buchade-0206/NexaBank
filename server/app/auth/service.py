import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from app.audit.constants import AuditAction
from app.audit.service import AuditService
from app.auth.models import PasswordResetToken, Session
from app.auth.repository import PasswordResetTokenRepository, SessionRepository
from app.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.core.config import settings
from app.core.constants import DefaultRole
from app.core.exceptions import AppException, TokenInvalidException
from app.core.logger import logger
from app.core.security import TokenType, create_access_token, create_refresh_token, decode_token
from app.users.models import User
from app.users.schemas import UserCreate
from app.users.service import UserService

RESET_TOKEN_TTL_MINUTES = 30


class AuthService:
    def __init__(self) -> None:
        self.user_service = UserService()
        self.session_repository = SessionRepository()
        self.reset_token_repository = PasswordResetTokenRepository()
        self.audit_service = AuditService()

    # ---- Registration ----

    async def register(self, payload: RegisterRequest) -> User:
        user_create = UserCreate(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
            role_codes=[DefaultRole.CUSTOMER.value],
        )
        return await self.user_service.create_user(user_create)

    # ---- Login / token issuance ----

    async def login(
        self,
        payload: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, TokenResponse]:
        try:
            user = await self.user_service.verify_credentials(payload.identifier, payload.password)
        except AppException:
            await self.audit_service.log(
                action=AuditAction.LOGIN_FAILED.value,
                module="auth",
                ip_address=ip_address,
                device=user_agent,
                metadata={"identifier": payload.identifier},
            )
            raise

        await self.user_service.record_successful_login(user, ip_address)
        tokens = await self._issue_tokens(user, ip_address, user_agent, remember_me=payload.remember_me)

        await self.audit_service.log(
            action=AuditAction.LOGIN.value,
            module="auth",
            user_id=str(user.id),
            ip_address=ip_address,
            device=user_agent,
        )
        logger.info("User {} logged in successfully.", user.id)
        return user, tokens

    async def _issue_tokens(
        self,
        user: User,
        ip_address: str | None,
        user_agent: str | None,
        remember_me: bool = False,
    ) -> TokenResponse:
        access_token = create_access_token(str(user.id), extra_claims={"role_codes": user.role_codes})
        refresh_token = create_refresh_token(str(user.id))

        payload = decode_token(refresh_token, TokenType.REFRESH)
        refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS * (2 if remember_me else 1)
        expires_at = datetime.now(UTC) + timedelta(days=refresh_days)

        session = Session(
            user_id=str(user.id),
            refresh_token_jti=payload["jti"],
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
        )
        await self.session_repository.create(session)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    # ---- Refresh / rotation ----

    async def refresh(
        self,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        payload = decode_token(refresh_token, TokenType.REFRESH)
        jti = payload["jti"]
        user_id = payload["sub"]

        session = await self.session_repository.get_by_jti(jti)
        if session is None or session.is_revoked or session.user_id != user_id:
            raise TokenInvalidException()

        # Rotation: revoke the presented refresh token, issue a brand new pair.
        await self.session_repository.revoke(session)

        user = await self.user_service.get_by_id(user_id)
        if not user.is_active:
            raise TokenInvalidException()

        return await self._issue_tokens(user, ip_address, user_agent)

    # ---- Logout ----

    async def logout(self, refresh_token: str) -> None:
        payload = decode_token(refresh_token, TokenType.REFRESH)
        session = await self.session_repository.get_by_jti(payload["jti"])
        if session and not session.is_revoked:
            await self.session_repository.revoke(session)
            await self.audit_service.log(
                action=AuditAction.LOGOUT.value, module="auth", user_id=session.user_id
            )

    async def logout_all(self, user_id: str) -> int:
        count = await self.session_repository.revoke_all_for_user(user_id)
        await self.audit_service.log(
            action=AuditAction.LOGOUT_ALL.value,
            module="auth",
            user_id=user_id,
            metadata={"sessions_revoked": count},
        )
        return count

    # ---- Password change (authenticated) ----

    async def change_password(self, user: User, old_password: str, new_password: str) -> None:
        await self.user_service.change_password(user, old_password, new_password)
        await self.audit_service.log(
            action=AuditAction.PASSWORD_CHANGED.value, module="auth", user_id=str(user.id)
        )
        # Force re-login everywhere after a password change.
        await self.logout_all(str(user.id))

    # ---- Forgot / reset password ----

    async def request_password_reset(self, email: str) -> str | None:
        """Returns the raw reset token in non-production environments only
        (so it can be surfaced without a wired-up email provider yet).
        In production, this should be dispatched via the notifications
        module instead of returned to the caller."""
        user = await self.user_service.user_repository.get_by_email(email)
        if user is None:
            # Do not reveal whether the email exists.
            return None

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(UTC) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

        await self.reset_token_repository.create(
            PasswordResetToken(user_id=str(user.id), token_hash=token_hash, expires_at=expires_at)
        )

        return None if settings.is_production else raw_token

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset_token = await self.reset_token_repository.get_by_token_hash(token_hash)

        if reset_token is None or reset_token.is_used or reset_token.expires_at < datetime.now(UTC):
            raise TokenInvalidException()

        user = await self.user_service.get_by_id(reset_token.user_id)
        await self.user_service.set_password(user, new_password)

        reset_token.used_at = datetime.now(UTC)
        await reset_token.save()

        await self.audit_service.log(
            action=AuditAction.PASSWORD_RESET.value, module="auth", user_id=str(user.id)
        )
        await self.logout_all(str(user.id))

    # ---- Session listing ----

    async def list_sessions(self, user_id: str) -> list[Session]:
        return await self.session_repository.list_active_for_user(user_id)
