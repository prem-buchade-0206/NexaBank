"""
Base service.

Services own business rules and orchestrate one or more repositories.
Routers must never talk to repositories directly — only through a service.
"""

from typing import Any, Generic, TypeVar

from app.core.pagination import PaginationParams, SortParams
from app.models.base import BaseDocument
from app.repositories.base import BaseRepository

ModelT = TypeVar("ModelT", bound=BaseDocument)


class BaseService(Generic[ModelT]):
    def __init__(self, repository: BaseRepository[ModelT]) -> None:
        self.repository = repository

    async def get_by_id(self, id: str) -> ModelT:
        return await self.repository.get_by_id_or_raise(id)

    async def list(
        self,
        pagination: PaginationParams,
        sort: SortParams,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[ModelT], int]:
        return await self.repository.list_paginated(
            filters=filters,
            skip=pagination.skip,
            limit=pagination.limit,
            sort_by=sort.sort_by,
            sort_order=sort.sort_order,
        )

    async def delete(self, id: str, deleted_by: str | None = None) -> None:
        document = await self.repository.get_by_id_or_raise(id)
        await self.repository.soft_delete(document, deleted_by)
