"""
Resource-ownership guard.

RBAC permission checks (`require_permissions`) only establish that a user's
*role* grants a capability (e.g. "can create transactions") — they say
nothing about *whose* account a customer-role user is trying to touch. This
module closes that gap: staff roles may act on any customer's resources;
a plain customer may only act on their own.
"""

from app.core.constants import STAFF_ROLES
from app.core.exceptions import AuthorizationException
from app.customers.service import CustomerService
from app.users.models import User

_customer_service = CustomerService()


async def ensure_customer_access(current_user: User, customer_id: str) -> None:
    """Raises AuthorizationException unless `current_user` is staff or is the
    customer identified by `customer_id`."""
    if set(current_user.role_codes) & STAFF_ROLES:
        return

    customer = await _customer_service.get_by_id(customer_id)
    if customer.user_id != str(current_user.id):
        raise AuthorizationException("You do not have access to this customer's resources.")
