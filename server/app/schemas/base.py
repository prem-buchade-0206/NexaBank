"""Base API contract schemas shared across modules."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base for all request/response schemas — consistent ORM/alias behavior."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class TimestampedSchema(BaseSchema):
    created_at: datetime
    updated_at: datetime


class AuditedSchema(TimestampedSchema):
    created_by: str | None = None
    updated_by: str | None = None
    status: str
