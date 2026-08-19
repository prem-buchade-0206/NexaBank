from app.beneficiaries.models import Beneficiary
from app.repositories.base import BaseRepository


class BeneficiaryRepository(BaseRepository[Beneficiary]):
    def __init__(self) -> None:
        super().__init__(Beneficiary)

    async def list_for_customer(self, customer_id: str) -> list[Beneficiary]:
        return await self.find_many({"owner_customer_id": customer_id}).to_list()

    async def get_duplicate_internal(self, customer_id: str, account_id: str) -> Beneficiary | None:
        return await self.find_one({"owner_customer_id": customer_id, "account_id": account_id})
