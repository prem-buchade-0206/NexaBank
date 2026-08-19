from app.repositories.base import BaseRepository
from app.roles.models import Role


class RoleRepository(BaseRepository[Role]):
    def __init__(self) -> None:
        super().__init__(Role)

    async def get_by_code(self, code: str) -> Role | None:
        return await self.find_one({"code": code})

    async def get_many_by_codes(self, codes: list[str]) -> list[Role]:
        return await self.model.find({"code": {"$in": codes}, "is_deleted": False}).to_list()
