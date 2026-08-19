"""Shared FastAPI dependencies usable by any module's router."""

from fastapi import Query

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.core.pagination import PaginationParams, SortParams


def get_pagination_params(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> PaginationParams:
    return PaginationParams(page=page, limit=limit)


def get_sort_params(
    sort_by: str = Query(default="created_at"),
    sort_order: int = Query(default=-1, ge=-1, le=1),
) -> SortParams:
    return SortParams(sort_by=sort_by, sort_order=sort_order or -1)
