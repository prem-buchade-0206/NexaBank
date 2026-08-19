from datetime import datetime
from typing import Any

from app.audit.models import AuditLog
from app.audit.repository import AuditRepository
from app.core.pagination import PaginationParams, SortParams


class AuditService:
    def __init__(self) -> None:
        self.audit_repository = AuditRepository()

    async def log(
        self,
        action: str,
        module: str,
        user_id: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
        device: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            resource_id=resource_id,
            ip_address=ip_address,
            device=device,
            metadata=metadata or {},
        )
        return await self.audit_repository.create(entry)

    async def search(
        self,
        pagination: PaginationParams,
        sort: SortParams,
        user_id: str | None = None,
        module: str | None = None,
        action: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AuditLog], int]:
        filters: dict[str, Any] = {}
        if user_id:
            filters["user_id"] = user_id
        if module:
            filters["module"] = module
        if action:
            filters["action"] = action
        if date_from or date_to:
            date_filter: dict[str, Any] = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            filters["created_at"] = date_filter

        return await self.audit_repository.list_paginated(
            filters=filters,
            skip=pagination.skip,
            limit=pagination.limit,
            sort_by=sort.sort_by,
            sort_order=sort.sort_order,
        )

    async def get_by_id(self, audit_id: str) -> AuditLog:
        return await self.audit_repository.get_by_id_or_raise(audit_id)
