"""Beneficiary persistence model.

A beneficiary is a saved payee belonging to one customer. Internal
beneficiaries reference another NexaBank `Account` directly (and are
auto-verified, since the account's existence is proof enough); external
beneficiaries reference an account at another bank and require manual
verification before they can be used for transfers.
"""

from datetime import datetime

from pymongo import IndexModel

from app.beneficiaries.constants import BeneficiaryType, BeneficiaryVerificationStatus
from app.models.base import BaseDocument


class Beneficiary(BaseDocument):
    owner_customer_id: str
    nickname: str
    beneficiary_type: BeneficiaryType

    # ---- Internal ----
    account_id: str | None = None  # required if beneficiary_type == internal

    # ---- External ----
    external_bank_name: str | None = None
    external_account_number: str | None = None
    external_account_holder_name: str | None = None

    verification_status: BeneficiaryVerificationStatus = BeneficiaryVerificationStatus.PENDING
    verified_at: datetime | None = None
    verified_by: str | None = None

    class Settings(BaseDocument.Settings):
        name = "beneficiaries"
        indexes = [
            IndexModel("owner_customer_id"),
            IndexModel("account_id"),
        ]
