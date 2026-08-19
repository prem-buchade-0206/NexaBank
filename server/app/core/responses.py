"""
Standardized API response envelope.

Every endpoint should return `SuccessResponse` (directly or via the
`success_response` / `paginated_response` helpers) so API consumers get a
single, predictable shape regardless of which module they're calling.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Meta(BaseModel):
    page: int = 1
    limit: int = 20
    total: int = 0
    total_pages: int = 0


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully."
    data: T | None = None
    errors: None = None
    meta: Meta | None = None


class ErrorDetail(BaseModel):
    error_code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    data: None = None
    errors: ErrorDetail
    meta: None = None
    request_id: str | None = None


def success_response(
    data: Any = None,
    message: str = "Operation completed successfully.",
    meta: Meta | None = None,
) -> dict[str, Any]:
    return SuccessResponse(data=data, message=message, meta=meta).model_dump()


def paginated_response(
    items: list[Any],
    page: int,
    limit: int,
    total: int,
    message: str = "Operation completed successfully.",
) -> dict[str, Any]:
    total_pages = (total + limit - 1) // limit if limit else 0
    meta = Meta(page=page, limit=limit, total=total, total_pages=total_pages)
    return success_response(data=items, message=message, meta=meta)
