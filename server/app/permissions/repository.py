from app.permissions.models import Permission
from app.repositories.base import BaseRepository


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self) -> None:
        super().__init__(Permission)

    async def get_by_code(self, code: str) -> Permission | None:
        return await self.find_one({"code": code})

    async def get_many_by_codes(self, codes: list[str]) -> list[Permission]:
        return await self.model.find({"code": {"$in": codes}, "is_deleted": False}).to_list()

    async def list_all_active(self) -> list[Permission]:
        return await self.find_many().to_list()
