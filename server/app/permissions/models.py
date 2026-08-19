"""Permission persistence model.

A permission is an atomic `module:action` capability (e.g. `customers:create`).
Roles are just named collections of permission codes — see `app.roles.models`.
"""

from pymongo import IndexModel

from app.models.base import BaseDocument


class Permission(BaseDocument):
    code: str  # e.g. "customers:create"
    module: str  # e.g. "customers"
    action: str  # e.g. "create"
    description: str | None = None
    is_system: bool = False  # system permissions cannot be deleted via API

    class Settings(BaseDocument.Settings):
        name = "permissions"
        indexes = [
            IndexModel("code", unique=True),
            IndexModel("module"),
        ]
