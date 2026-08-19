"""Role persistence model.

Roles bundle permission codes under a name (e.g. "branch_manager" ->
["accounts:read", "loans:approve", ...]). Users hold one or more role
codes; effective permissions are the union of their roles' permissions.
"""

from pymongo import IndexModel

from app.models.base import BaseDocument


class Role(BaseDocument):
    name: str  # display name, e.g. "Branch Manager"
    code: str  # machine code, e.g. "branch_manager"
    description: str | None = None
    permissions: list[str] = []  # list of Permission.code values
    is_system: bool = False  # seeded system roles cannot be deleted via API

    class Settings(BaseDocument.Settings):
        name = "roles"
        indexes = [
            IndexModel("code", unique=True),
        ]
