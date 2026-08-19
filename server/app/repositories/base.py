"""
Generic base repository.

Encapsulates the only layer allowed to talk to MongoDB directly. Module
repositories should extend `BaseRepository[MyDocument]` and add
module-specific queries on top of these common operations rather than
duplicating find/insert/update/delete logic.
"""

from typing import Any, Generic, TypeVar

from beanie import PydanticObjectId
from beanie.odm.queries.find import FindMany

from app.core.exceptions import NotFoundException
from app.models.base import BaseDocument

ModelT = TypeVar("ModelT", bound=BaseDocument)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT]) -> None:
        self.model = model

    def _not_deleted_filter(self) -> dict[str, Any]:
        return {"is_deleted": False}

    async def create(self, document: ModelT) -> ModelT:
        return await document.insert()

    async def get_by_id(self, id: str | PydanticObjectId, include_deleted: bool = False) -> ModelT | None:
        doc = await self.model.get(id)
        if doc is None:
            return None
        if not include_deleted and doc.is_deleted:
            return None
        return doc

    async def get_by_id_or_raise(self, id: str | PydanticObjectId) -> ModelT:
        doc = await self.get_by_id(id)
        if doc is None:
            raise NotFoundException(self.model.__name__)
        return doc

    async def find_one(self, filters: dict[str, Any]) -> ModelT | None:
        return await self.model.find_one({**filters, **self._not_deleted_filter()})

    def find_many(self, filters: dict[str, Any] | None = None) -> FindMany:
        query = {**(filters or {}), **self._not_deleted_filter()}
        return self.model.find(query)

    async def list_paginated(
        self,
        filters: dict[str, Any] | None = None,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: int = -1,
    ) -> tuple[list[ModelT], int]:
        query = self.find_many(filters)
        total = await query.count()
        sort_expr = f"{'-' if sort_order < 0 else '+'}{sort_by}"
        items = await query.sort(sort_expr).skip(skip).limit(limit).to_list()
        return items, total

    async def update(
        self, document: ModelT, updates: dict[str, Any], updated_by: str | None = None
    ) -> ModelT:
        for field, value in updates.items():
            setattr(document, field, value)
        document.mark_updated(updated_by)
        await document.save()
        return document

    async def soft_delete(self, document: ModelT, deleted_by: str | None = None) -> ModelT:
        document.soft_delete(deleted_by)
        await document.save()
        return document

    async def hard_delete(self, document: ModelT) -> None:
        await document.delete()

    async def exists(self, filters: dict[str, Any]) -> bool:
        return await self.find_one(filters) is not None
