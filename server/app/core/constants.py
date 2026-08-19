"""Global constants shared across modules.

Module-specific constants (e.g. loan status values, transaction types)
belong in that module's own `constants.py`, not here.
"""

from enum import StrEnum


class RecordStatus(StrEnum):
    """Generic lifecycle status applied to most collections."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class DefaultRole(StrEnum):
    """Seeded system roles. Custom roles can be created via the roles module."""

    SUPER_ADMIN = "super_admin"
    BANK_ADMIN = "bank_admin"
    BRANCH_MANAGER = "branch_manager"
    EMPLOYEE = "employee"
    CASHIER = "cashier"
    LOAN_OFFICER = "loan_officer"
    AUDITOR = "auditor"
    CUSTOMER = "customer"


# Every seeded role except the customer-facing one — used to distinguish bank
# staff (who may act on any customer's resources) from a customer (who may
# only act on their own).
STAFF_ROLES: set[str] = {
    DefaultRole.SUPER_ADMIN.value,
    DefaultRole.BANK_ADMIN.value,
    DefaultRole.BRANCH_MANAGER.value,
    DefaultRole.EMPLOYEE.value,
    DefaultRole.CASHIER.value,
    DefaultRole.LOAN_OFFICER.value,
    DefaultRole.AUDITOR.value,
}


# Password policy
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=]).+$"

# Pagination
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
