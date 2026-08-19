from enum import StrEnum


class BeneficiaryVerificationStatus(StrEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class BeneficiaryType(StrEnum):
    INTERNAL = "internal"  # another account within NexaBank
    EXTERNAL = "external"  # an account at another bank
