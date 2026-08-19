from app.schemas.base import AuditedSchema, BaseSchema


class PermissionCreate(BaseSchema):
    code: str
    module: str
    action: str
    description: str | None = None


class PermissionRead(AuditedSchema):
    id: str
    code: str
    module: str
    action: str
    description: str | None = None
    is_system: bool
