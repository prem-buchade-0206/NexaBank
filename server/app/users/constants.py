import re

from app.core.config import settings
from app.core.constants import PASSWORD_REGEX
from app.core.exceptions import ValidationException


def validate_password_policy(password: str) -> None:
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        raise ValidationException(
            f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long."
        )
    if not re.match(PASSWORD_REGEX, password):
        raise ValidationException(
            "Password must include at least one uppercase letter, one lowercase letter, "
            "one digit, and one special character."
        )
