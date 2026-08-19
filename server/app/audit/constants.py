from enum import StrEnum


class AuditAction(StrEnum):
    """Common, well-known audit actions. `AuditLog.action` is stored as a
    plain string, not restricted to this enum — callers elsewhere can pass
    their own constants without needing to extend this list. This enum
    exists so the highest-traffic call sites share exact spelling."""

    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET = "password_reset"
    ACCOUNT_CREATED = "account_created"
    ACCOUNT_UPDATED = "account_updated"
    ACCOUNT_FROZEN = "account_frozen"
    ACCOUNT_UNFROZEN = "account_unfrozen"
    ACCOUNT_CLOSED = "account_closed"
    TRANSACTION_CREATED = "transaction_created"
    MONEY_TRANSFER = "money_transfer"
    LOAN_APPLIED = "loan_applied"
    LOAN_APPROVED = "loan_approved"
    LOAN_REJECTED = "loan_rejected"
    KYC_VERIFIED = "kyc_verified"
    KYC_REJECTED = "kyc_rejected"
    PERMISSION_CHANGED = "permission_changed"
    PROFILE_UPDATED = "profile_updated"
