from app.core.exceptions import DuplicateResourceException
from app.permissions.models import Permission
from app.permissions.repository import PermissionRepository
from app.permissions.schemas import PermissionCreate
from app.services.base import BaseService


class PermissionService(BaseService[Permission]):
    def __init__(self) -> None:
        self.perm_repository = PermissionRepository()
        super().__init__(self.perm_repository)

    async def create_permission(self, payload: PermissionCreate, created_by: str | None = None) -> Permission:
        if await self.perm_repository.exists({"code": payload.code}):
            raise DuplicateResourceException("Permission")
        permission = Permission(**payload.model_dump(), created_by=created_by)
        return await self.perm_repository.create(permission)

    async def validate_codes_exist(self, codes: list[str]) -> list[str]:
        """Returns the subset of `codes` that do NOT exist — empty list means all valid."""
        found = await self.perm_repository.get_many_by_codes(codes)
        found_codes = {p.code for p in found}
        return [code for code in codes if code not in found_codes]
