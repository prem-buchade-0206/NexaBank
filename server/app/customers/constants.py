from enum import StrEnum


class KYCStatus(StrEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class IdentityDocumentType(StrEnum):
    NATIONAL_ID = "national_id"
    PASSPORT = "passport"
    DRIVING_LICENSE = "driving_license"
    TAX_ID = "tax_id"


CUSTOMER_NUMBER_PREFIX = "CUS"
CUSTOMER_NUMBER_COUNTER = "customer_number"
