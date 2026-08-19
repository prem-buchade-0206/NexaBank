from datetime import date, datetime

from pydantic import EmailStr

from app.customers.constants import IdentityDocumentType, KYCStatus
from app.schemas.base import AuditedSchema, BaseSchema


class AddressSchema(BaseSchema):
    line1: str
    line2: str | None = None
    city: str
    state: str | None = None
    country: str
    postal_code: str


class CustomerCreate(BaseSchema):
    full_name: str
    date_of_birth: date
    gender: str | None = None
    nationality: str | None = None
    email: EmailStr
    phone: str
    alternate_phone: str | None = None
    address: AddressSchema
    id_type: IdentityDocumentType
    id_number: str
    branch: str | None = None
    user_id: str | None = None


class CustomerUpdate(BaseSchema):
    full_name: str | None = None
    gender: str | None = None
    nationality: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    alternate_phone: str | None = None
    address: AddressSchema | None = None
    branch: str | None = None


class KYCRejectRequest(BaseSchema):
    reason: str


class CustomerRead(AuditedSchema):
    id: str
    customer_number: str
    user_id: str | None = None
    full_name: str
    date_of_birth: date
    gender: str | None = None
    nationality: str | None = None
    email: EmailStr
    phone: str
    alternate_phone: str | None = None
    address: AddressSchema
    id_type: IdentityDocumentType
    id_number: str
    kyc_status: KYCStatus
    kyc_verified_at: datetime | None = None
    kyc_rejection_reason: str | None = None
    branch: str | None = None


class CustomerSummary(BaseSchema):
    """Minimal projection embedded inside accounts/transactions/loans responses."""

    id: str
    customer_number: str
    full_name: str
    email: EmailStr
