"""
Centralized exception hierarchy.

Every raised exception here is caught by handlers in
`app.middleware.exception_handler` and converted into the standardized
API response envelope. Business/service code should raise these instead
of returning ad-hoc error responses.
"""

from http import HTTPStatus


class AppException(Exception):
    """Base class for all application-raised exceptions."""

    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        self.message = message or "An unexpected error occurred."
        self.details = details
        super().__init__(self.message)


# ---- 400 range ----
class ValidationException(AppException):
    status_code = HTTPStatus.BAD_REQUEST
    error_code = "VALIDATION_ERROR"


class AuthenticationException(AppException):
    status_code = HTTPStatus.UNAUTHORIZED
    error_code = "AUTHENTICATION_ERROR"


class InvalidCredentialsException(AuthenticationException):
    error_code = "INVALID_CREDENTIALS"

    def __init__(self) -> None:
        super().__init__("Invalid email or password.")


class TokenExpiredException(AuthenticationException):
    error_code = "TOKEN_EXPIRED"

    def __init__(self) -> None:
        super().__init__("Authentication token has expired.")


class TokenInvalidException(AuthenticationException):
    error_code = "TOKEN_INVALID"

    def __init__(self) -> None:
        super().__init__("Authentication token is invalid.")


class AccountLockedException(AuthenticationException):
    error_code = "ACCOUNT_LOCKED"

    def __init__(self, retry_after_minutes: int | None = None) -> None:
        super().__init__(
            "Account is temporarily locked due to too many failed login attempts.",
            details={"retry_after_minutes": retry_after_minutes} if retry_after_minutes else None,
        )


class AuthorizationException(AppException):
    status_code = HTTPStatus.FORBIDDEN
    error_code = "AUTHORIZATION_ERROR"

    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(message)


class NotFoundException(AppException):
    status_code = HTTPStatus.NOT_FOUND
    error_code = "NOT_FOUND"

    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(f"{resource} not found.")


class ConflictException(AppException):
    status_code = HTTPStatus.CONFLICT
    error_code = "CONFLICT"


class DuplicateResourceException(ConflictException):
    error_code = "DUPLICATE_RESOURCE"

    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(f"{resource} already exists.")


class BusinessRuleException(AppException):
    """Raised when a domain/business rule is violated (e.g. insufficient funds)."""

    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    error_code = "BUSINESS_RULE_VIOLATION"


class RateLimitException(AppException):
    status_code = HTTPStatus.TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"

    def __init__(self) -> None:
        super().__init__("Too many requests. Please try again later.")


# ---- 500 range ----
class DatabaseException(AppException):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code = "DATABASE_ERROR"

    def __init__(self) -> None:
        super().__init__("A database error occurred.")
