from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.exceptions import (
    AccountLockedException,
    DuplicateResourceException,
    InvalidCredentialsException,
)
from app.core.security import hash_password, verify_password
from app.roles.service import RoleService
from app.services.base import BaseService
from app.users.constants import validate_password_policy
from app.users.models import User
from app.users.repository import UserRepository
from app.users.schemas import UserCreate, UserUpdate


class UserService(BaseService[User]):
    def __init__(self) -> None:
        self.user_repository = UserRepository()
        self.role_service = RoleService()
        super().__init__(self.user_repository)

    async def create_user(self, payload: UserCreate, created_by: str | None = None) -> User:
        if await self.user_repository.get_by_email(payload.email):
            raise DuplicateResourceException("A user with this email")
        if await self.user_repository.get_by_username(payload.username):
            raise DuplicateResourceException("A user with this username")

        validate_password_policy(payload.password)

        user = User(
            email=payload.email.lower(),
            username=payload.username,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            phone=payload.phone,
            role_codes=payload.role_codes,
            password_changed_at=datetime.now(UTC),
            created_by=created_by,
        )
        return await self.user_repository.create(user)

    async def update_user(self, user_id: str, payload: UserUpdate, updated_by: str | None = None) -> User:
        user = await self.user_repository.get_by_id_or_raise(user_id)
        updates = payload.model_dump(exclude_none=True)
        return await self.user_repository.update(user, updates, updated_by)

    async def verify_credentials(self, identifier: str, password: str) -> User:
        """Validates email/username + password, enforcing lockout policy.

        Raises InvalidCredentialsException or AccountLockedException on failure.
        Callers (auth service) are responsible for issuing tokens on success.
        """
        user = await self.user_repository.get_by_email_or_username(identifier)

        # Constant-shape failure: don't reveal whether the identifier exists.
        if user is None:
            raise InvalidCredentialsException()

        if user.is_locked and user.locked_until is not None:
            remaining = int((user.locked_until - datetime.now(UTC)).total_seconds() // 60) + 1
            raise AccountLockedException(retry_after_minutes=max(remaining, 1))

        if not user.is_active:
            raise InvalidCredentialsException()

        if not verify_password(password, user.hashed_password):
            await self._register_failed_attempt(user)
            raise InvalidCredentialsException()

        return user

    async def _register_failed_attempt(self, user: User) -> None:
        attempts = user.failed_login_attempts + 1
        locked_until = None
        if attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            locked_until = datetime.now(UTC) + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
        await self.user_repository.register_failed_login(user, locked_until)

    async def record_successful_login(self, user: User, ip: str | None) -> User:
        return await self.user_repository.register_successful_login(user, ip)

    async def change_password(self, user: User, old_password: str, new_password: str) -> User:
        if not verify_password(old_password, user.hashed_password):
            raise InvalidCredentialsException()
        validate_password_policy(new_password)
        user.hashed_password = hash_password(new_password)
        user.password_changed_at = datetime.now(UTC)
        user.must_change_password = False
        user.mark_updated(str(user.id))
        await user.save()
        return user

    async def set_password(self, user: User, new_password: str) -> User:
        """Used by the reset-password flow (no old password known)."""
        validate_password_policy(new_password)
        user.hashed_password = hash_password(new_password)
        user.password_changed_at = datetime.now(UTC)
        user.must_change_password = False
        user.failed_login_attempts = 0
        user.locked_until = None
        user.mark_updated()
        await user.save()
        return user

    async def get_effective_permissions(self, user: User) -> set[str]:
        return await self.role_service.get_effective_permissions(user.role_codes)
