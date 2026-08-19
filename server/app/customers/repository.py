import re
from typing import Any

from app.customers.constants import IdentityDocumentType
from app.customers.models import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self) -> None:
        super().__init__(Customer)

    async def get_by_email(self, email: str) -> Customer | None:
        return await self.find_one({"email": email.lower()})

    async def get_by_identity(self, id_type: IdentityDocumentType, id_number: str) -> Customer | None:
        return await self.find_one({"id_type": id_type, "id_number": id_number})

    async def get_by_customer_number(self, customer_number: str) -> Customer | None:
        return await self.find_one({"customer_number": customer_number})

    def build_search_filter(self, query: str | None = None, kyc_status: str | None = None) -> dict[str, Any]:
        filters: dict[str, Any] = {}
        if kyc_status:
            filters["kyc_status"] = kyc_status
        if query:
            pattern = re.compile(re.escape(query), re.IGNORECASE)
            filters["$or"] = [
                {"full_name": pattern},
                {"email": pattern},
                {"phone": pattern},
                {"customer_number": pattern},
            ]
        return filters
