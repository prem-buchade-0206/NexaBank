"""
Seed default permissions and system roles.

Idempotent — safe to run on every deploy. Run with:
    python -m scripts.seed_rbac
"""

import asyncio

from app.core.constants import DefaultRole
from app.core.logger import configure_logging, logger
from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.permissions.constants import default_permission_catalog
from app.permissions.models import Permission
from app.roles.models import Role

# code -> permission prefixes granted. "*" means every action on every module.
SYSTEM_ROLE_PERMISSIONS: dict[str, list[str] | str] = {
    DefaultRole.SUPER_ADMIN.value: "*",
    DefaultRole.BANK_ADMIN.value: "*",
    DefaultRole.BRANCH_MANAGER.value: [
        "customers:*",
        "accounts:*",
        "transactions:*",
        "loans:*",
        "beneficiaries:*",
        "statements:*",
        "reports:read",
        "analytics:read",
        "users:read",
        "audit:read",
    ],
    DefaultRole.EMPLOYEE.value: [
        "customers:read",
        "customers:update",
        "accounts:read",
        "accounts:update",
        "transactions:read",
        "beneficiaries:read",
        "statements:read",
    ],
    DefaultRole.CASHIER.value: [
        "customers:read",
        "accounts:read",
        "transactions:create",
        "transactions:read",
    ],
    DefaultRole.LOAN_OFFICER.value: [
        "customers:read",
        "loans:*",
        "reports:read",
    ],
    DefaultRole.AUDITOR.value: [
        "audit:read",
        "reports:read",
        "analytics:read",
        "transactions:read",
        "loans:read",
    ],
    DefaultRole.CUSTOMER.value: [
        "accounts:read",
        "transactions:read",
        "transactions:create",
        "beneficiaries:*",
        "statements:read",
        "loans:create",
        "loans:read",
    ],
}


def _expand(codes: list[str] | str, all_codes: list[str]) -> list[str]:
    if codes == "*":
        return all_codes
    expanded: set[str] = set()
    for code in codes:
        if code.endswith(":*"):
            module = code.split(":")[0]
            expanded.update(c for c in all_codes if c.startswith(f"{module}:"))
        else:
            expanded.add(code)
    return sorted(expanded)


async def seed_permissions() -> list[str]:
    catalog = default_permission_catalog()
    all_codes = []
    for entry in catalog:
        existing = await Permission.find_one({"code": entry["code"]})
        if existing is None:
            await Permission(**entry, is_system=True).insert()
            logger.info("Created permission: {}", entry["code"])
        all_codes.append(entry["code"])
    return all_codes


async def seed_roles(all_permission_codes: list[str]) -> None:
    role_display_names = {
        DefaultRole.SUPER_ADMIN.value: "Super Admin",
        DefaultRole.BANK_ADMIN.value: "Bank Admin",
        DefaultRole.BRANCH_MANAGER.value: "Branch Manager",
        DefaultRole.EMPLOYEE.value: "Employee",
        DefaultRole.CASHIER.value: "Cashier",
        DefaultRole.LOAN_OFFICER.value: "Loan Officer",
        DefaultRole.AUDITOR.value: "Auditor",
        DefaultRole.CUSTOMER.value: "Customer",
    }

    for code, granted in SYSTEM_ROLE_PERMISSIONS.items():
        permissions = _expand(granted, all_permission_codes)
        existing = await Role.find_one({"code": code})
        if existing is None:
            await Role(
                name=role_display_names[code],
                code=code,
                description=f"System-seeded role: {role_display_names[code]}",
                permissions=permissions,
                is_system=True,
            ).insert()
            logger.info("Created role: {} ({} permissions)", code, len(permissions))
        else:
            existing.permissions = permissions
            await existing.save()
            logger.info("Refreshed permissions for existing role: {}", code)


async def main() -> None:
    configure_logging()
    await connect_to_mongo()
    try:
        all_codes = await seed_permissions()
        await seed_roles(all_codes)
        logger.info("RBAC seed complete.")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
