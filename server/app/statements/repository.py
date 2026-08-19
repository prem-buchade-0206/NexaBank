from app.repositories.base import BaseRepository
from app.statements.models import Statement


class StatementRepository(BaseRepository[Statement]):
    def __init__(self) -> None:
        super().__init__(Statement)

    async def list_for_account(self, account_id: str) -> list[Statement]:
        return await self.find_many({"account_id": account_id}).to_list()
