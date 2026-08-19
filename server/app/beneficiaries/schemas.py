from datetime import datetime

from pydantic import model_validator

from app.beneficiaries.constants import BeneficiaryType, BeneficiaryVerificationStatus
from app.schemas.base import AuditedSchema, BaseSchema


class BeneficiaryCreate(BaseSchema):
    owner_customer_id: str
    nickname: str
    beneficiary_type: BeneficiaryType
    account_id: str | None = None
    external_bank_name: str | None = None
    external_account_number: str | None = None
    external_account_holder_name: str | None = None

    @model_validator(mode="after")
    def _validate_by_type(self) -> "BeneficiaryCreate":
        if self.beneficiary_type == BeneficiaryType.INTERNAL and not self.account_id:
            raise ValueError("account_id is required for an internal beneficiary.")
        if self.beneficiary_type == BeneficiaryType.EXTERNAL and not (
            self.external_bank_name and self.external_account_number and self.external_account_holder_name
        ):
            raise ValueError(
                "external_bank_name, external_account_number, and external_account_holder_name "
                "are all required for an external beneficiary."
            )
        return self


class BeneficiaryUpdate(BaseSchema):
    nickname: str | None = None


class BeneficiaryRead(AuditedSchema):
    id: str
    owner_customer_id: str
    nickname: str
    beneficiary_type: BeneficiaryType
    account_id: str | None = None
    external_bank_name: str | None = None
    external_account_number: str | None = None
    external_account_holder_name: str | None = None
    verification_status: BeneficiaryVerificationStatus
    verified_at: datetime | None = None
