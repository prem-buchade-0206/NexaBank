"""
Auth dependencies: current-user resolution and RBAC permission guards.

Usage in any module's router:

    @router.get("/", dependencies=[Depends(require_permissions("customers:read"))])
    async def list_customers(current_user: User = Depends(get_current_user)): ...
"""

from collections.abc import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.exceptions import AuthorizationException, TokenInvalidException
from app.core.security import TokenType, decode_token
from app.users.models import User
from app.users.service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token, TokenType.ACCESS)
    user_id = payload.get("sub")
    if not user_id:
        raise TokenInvalidException()

    user_service = UserService()
    user = await user_service.repository.get_by_id(user_id)
    if user is None or not user.is_active:
        raise TokenInvalidException()

    return user


async def get_current_active_verified_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_verified:
        raise AuthorizationException("Account email/identity has not been verified yet.")
    return current_user


def require_permissions(*required_codes: str) -> Callable:
    """Dependency factory: grants access only if the user's effective
    permissions (union across their roles) cover ALL of `required_codes`."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        user_service = UserService()
        effective = await user_service.get_effective_permissions(current_user)
        missing = [code for code in required_codes if code not in effective]
        if missing:
            raise AuthorizationException(f"Missing required permission(s): {', '.join(missing)}.")
        return current_user

    return _check


def require_roles(*role_codes: str) -> Callable:
    """Dependency factory: grants access only if the user holds at least
    one of `role_codes`."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if not set(current_user.role_codes) & set(role_codes):
            raise AuthorizationException(f"Requires one of the following roles: {', '.join(role_codes)}.")
        return current_user

    return _check
