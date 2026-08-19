from app.schemas.base import AuditedSchema, BaseSchema


class RoleCreate(BaseSchema):
    name: str
    code: str
    description: str | None = None
    permissions: list[str] = []


class RoleUpdate(BaseSchema):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


class RoleRead(AuditedSchema):
    id: str
    name: str
    code: str
    description: str | None = None
    permissions: list[str]
    is_system: bool
