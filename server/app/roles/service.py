from app.core.exceptions import BusinessRuleException, DuplicateResourceException, NotFoundException
from app.permissions.service import PermissionService
from app.roles.models import Role
from app.roles.repository import RoleRepository
from app.roles.schemas import RoleCreate, RoleUpdate
from app.services.base import BaseService


class RoleService(BaseService[Role]):
    def __init__(self) -> None:
        self.role_repository = RoleRepository()
        self.permission_service = PermissionService()
        super().__init__(self.role_repository)

    async def create_role(self, payload: RoleCreate, created_by: str | None = None) -> Role:
        if await self.role_repository.exists({"code": payload.code}):
            raise DuplicateResourceException("Role")

        if payload.permissions:
            missing = await self.permission_service.validate_codes_exist(payload.permissions)
            if missing:
                raise BusinessRuleException(f"Unknown permission codes: {', '.join(missing)}")

        role = Role(**payload.model_dump(), created_by=created_by)
        return await self.role_repository.create(role)

    async def update_role(self, role_id: str, payload: RoleUpdate, updated_by: str | None = None) -> Role:
        role = await self.role_repository.get_by_id_or_raise(role_id)
        if role.is_system and payload.permissions is not None:
            raise BusinessRuleException("Permissions on system roles cannot be modified via API.")

        if payload.permissions:
            missing = await self.permission_service.validate_codes_exist(payload.permissions)
            if missing:
                raise BusinessRuleException(f"Unknown permission codes: {', '.join(missing)}")

        updates = payload.model_dump(exclude_none=True)
        return await self.role_repository.update(role, updates, updated_by)

    async def delete_role(self, role_id: str, deleted_by: str | None = None) -> None:
        role = await self.role_repository.get_by_id_or_raise(role_id)
        if role.is_system:
            raise BusinessRuleException("System roles cannot be deleted.")
        await self.role_repository.soft_delete(role, deleted_by)

    async def get_effective_permissions(self, role_codes: list[str]) -> set[str]:
        """Union of all permission codes granted by the given role codes."""
        roles = await self.role_repository.get_many_by_codes(role_codes)
        permissions: set[str] = set()
        for role in roles:
            permissions.update(role.permissions)
        return permissions

    async def get_by_code_or_raise(self, code: str) -> Role:
        role = await self.role_repository.get_by_code(code)
        if role is None:
            raise NotFoundException("Role")
        return role
