"""
Default permission catalog.

This is the seed list applied by `scripts/seed_rbac.py`. As each business
module (Phase 3+) is implemented, add its module:action codes here — the
seed script is idempotent, so re-running it after an addition just inserts
the new codes.
"""

MODULE_ACTIONS = ("create", "read", "update", "delete")

# Modules with standard CRUD permissions. Extend as new modules are built.
STANDARD_MODULES = (
    "users",
    "roles",
    "permissions",
    "customers",
    "accounts",
    "beneficiaries",
    "transactions",
    "statements",
    "loans",
    "notifications",
    "reports",
    "analytics",
    "audit",
    "settings",
)


def default_permission_catalog() -> list[dict[str, str]]:
    catalog = []
    for module in STANDARD_MODULES:
        for action in MODULE_ACTIONS:
            catalog.append(
                {
                    "code": f"{module}:{action}",
                    "module": module,
                    "action": action,
                    "description": f"Allows {action} operations on {module}.",
                }
            )
    return catalog
