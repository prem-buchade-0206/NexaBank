from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.accounts.service import AccountService
from app.auth.dependencies import get_current_user, require_permissions
from app.auth.ownership import ensure_customer_access
from app.core.responses import success_response
from app.statements.constants import StatementFormat
from app.statements.models import Statement
from app.statements.schemas import StatementRead
from app.statements.service import StatementService
from app.users.models import User

router = APIRouter(prefix="/statements", tags=["Statements"])
service = StatementService()
account_service = AccountService()


def _to_read(statement: Statement) -> StatementRead:
    return StatementRead.model_validate({**statement.model_dump(), "id": str(statement.id)})


@router.get(
    "/{account_id}",
    dependencies=[Depends(require_permissions("statements:read"))],
    summary="Generate a statement for a custom date range (json, csv, or pdf)",
    response_model=None,
)
async def get_statement(
    account_id: str,
    period_start: date = Query(...),
    period_end: date = Query(...),
    export_format: StatementFormat = Query(default=StatementFormat.JSON),
    current_user: User = Depends(get_current_user),
) -> Response | dict:
    account = await account_service.get_by_id(account_id)
    await ensure_customer_access(current_user, account.customer_id)

    summary, content, media_type = await service.generate(
        account_id, period_start, period_end, export_format, requested_by=str(current_user.id)
    )

    if content is not None and media_type is not None:
        extension = "csv" if export_format == StatementFormat.CSV else "pdf"
        filename = f"statement_{account.account_number}_{period_start}_{period_end}.{extension}"
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return success_response(data=summary)


@router.post(
    "/{account_id}/monthly",
    dependencies=[Depends(require_permissions("statements:read"))],
    summary="Generate a statement for a full calendar month",
    response_model=None,
)
async def get_monthly_statement(
    account_id: str,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    export_format: StatementFormat = Query(default=StatementFormat.JSON),
    current_user: User = Depends(get_current_user),
) -> Response | dict:
    account = await account_service.get_by_id(account_id)
    await ensure_customer_access(current_user, account.customer_id)

    period_start = date(year, month, 1)
    period_end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    period_end = period_end - timedelta(days=1)

    summary, content, media_type = await service.generate(
        account_id, period_start, period_end, export_format, requested_by=str(current_user.id)
    )

    if content is not None and media_type is not None:
        extension = "csv" if export_format == StatementFormat.CSV else "pdf"
        filename = f"statement_{account.account_number}_{year}-{month:02d}.{extension}"
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return success_response(data=summary)


@router.get(
    "/{account_id}/history",
    dependencies=[Depends(require_permissions("statements:read"))],
    summary="List past statement generation/download records for an account",
)
async def list_statement_history(account_id: str, current_user: User = Depends(get_current_user)) -> dict:
    account = await account_service.get_by_id(account_id)
    await ensure_customer_access(current_user, account.customer_id)
    records = await service.list_for_account(account_id)
    return success_response(data=[_to_read(r) for r in records])
