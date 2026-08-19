"""Customer persistence model.

A Customer is the bank's record of a person, distinct from `User` (which is
login/auth identity). A retail customer usually has both: a `User` with
role `customer` for portal login, and a `Customer` profile holding KYC and
banking-relevant details, linked via `user_id`. Staff can also create
Customer records for people without portal access yet.
"""

from datetime import date, datetime

from pydantic import BaseModel, EmailStr
from pymongo import IndexModel

from app.customers.constants import IdentityDocumentType, KYCStatus
from app.models.base import BaseDocument


class Address(BaseModel):
    line1: str
    line2: str | None = None
    city: str
    state: str | None = None
    country: str
    postal_code: str


class Customer(BaseDocument):
    # ---- Linkage ----
    user_id: str | None = None  # set once the customer has portal login access
    customer_number: str

    # ---- Personal details ----
    full_name: str
    date_of_birth: date
    gender: str | None = None
    nationality: str | None = None

    # ---- Contact ----
    email: EmailStr
    phone: str
    alternate_phone: str | None = None
    address: Address

    # ---- Identity / KYC ----
    id_type: IdentityDocumentType
    id_number: str
    kyc_status: KYCStatus = KYCStatus.PENDING
    kyc_verified_at: datetime | None = None
    kyc_verified_by: str | None = None
    kyc_rejection_reason: str | None = None

    # ---- Branch ----
    branch: str | None = None

    class Settings(BaseDocument.Settings):
        name = "customers"
        indexes = [
            IndexModel("customer_number", unique=True),
            IndexModel("email"),
            IndexModel("phone"),
            IndexModel([("id_type", 1), ("id_number", 1)], unique=True),
            IndexModel("user_id"),
            IndexModel("kyc_status"),
            IndexModel("full_name"),
        ]
