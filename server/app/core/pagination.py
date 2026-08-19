"""Shared pagination primitives used across every list endpoint."""

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit


class SortParams(BaseModel):
    sort_by: str = "created_at"
    sort_order: int = Field(default=-1, description="-1 for descending, 1 for ascending")
