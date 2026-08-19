from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.auth.dependencies import require_permissions
from app.core.responses import success_response
from app.reports.constants import ReportFormat
from app.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])
service = ReportService()


def _csv_response(content: bytes, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/customers",
    dependencies=[Depends(require_permissions("reports:read"))],
    summary="Customer report",
    response_model=None,
)
async def customer_report(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    export_format: ReportFormat = Query(default=ReportFormat.JSON),
) -> Response | dict:
    summary = await service.customer_report(date_from, date_to)
    if export_format == ReportFormat.CSV:
        rows = [[r.customer_number, r.full_name, r.email, r.kyc_status, r.created_at] for r in summary.rows]
        csv_bytes = service.render_csv(
            ["Customer Number", "Full Name", "Email", "KYC Status", "Created At"], rows
        )
        return _csv_response(csv_bytes, "customer_report.csv")
    return success_response(data=summary)


@router.get(
    "/transactions",
    dependencies=[Depends(require_permissions("reports:read"))],
    summary="Transaction report",
    response_model=None,
)
async def transaction_report(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    export_format: ReportFormat = Query(default=ReportFormat.JSON),
) -> Response | dict:
    summary = await service.transaction_report(date_from, date_to)
    if export_format == ReportFormat.CSV:
        rows = [
            [r.transaction_type, r.transaction_status, r.count, r.total_amount] for r in summary.breakdown
        ]
        csv_bytes = service.render_csv(["Type", "Status", "Count", "Total Amount"], rows)
        return _csv_response(csv_bytes, "transaction_report.csv")
    return success_response(data=summary)


@router.get(
    "/loans",
    dependencies=[Depends(require_permissions("reports:read"))],
    summary="Loan report",
    response_model=None,
)
async def loan_report(export_format: ReportFormat = Query(default=ReportFormat.JSON)) -> Response | dict:
    summary = await service.loan_report()
    if export_format == ReportFormat.CSV:
        rows = [[r.loan_status, r.count, r.total_principal, r.total_outstanding] for r in summary.breakdown]
        csv_bytes = service.render_csv(["Status", "Count", "Total Principal", "Total Outstanding"], rows)
        return _csv_response(csv_bytes, "loan_report.csv")
    return success_response(data=summary)


@router.get(
    "/revenue",
    dependencies=[Depends(require_permissions("reports:read"))],
    summary="Revenue report",
    response_model=None,
)
async def revenue_report(
    date_from: date = Query(...),
    date_to: date = Query(...),
    export_format: ReportFormat = Query(default=ReportFormat.JSON),
) -> Response | dict:
    summary = await service.revenue_report(date_from, date_to)
    if export_format == ReportFormat.CSV:
        rows = [
            [
                summary.period_start,
                summary.period_end,
                summary.total_transaction_charges,
                summary.transaction_count,
            ]
        ]
        csv_bytes = service.render_csv(
            ["Period Start", "Period End", "Total Charges", "Transaction Count"], rows
        )
        return _csv_response(csv_bytes, "revenue_report.csv")
    return success_response(data=summary)


@router.get(
    "/audit",
    dependencies=[Depends(require_permissions("reports:read"))],
    summary="Audit report",
    response_model=None,
)
async def audit_report(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    module: str | None = Query(default=None),
    export_format: ReportFormat = Query(default=ReportFormat.JSON),
) -> Response | dict:
    rows = await service.audit_report_rows(date_from, date_to, module)
    if export_format == ReportFormat.CSV:
        csv_rows = [[r.created_at, r.user_id, r.action, r.module, r.resource_id, r.ip_address] for r in rows]
        csv_bytes = service.render_csv(
            ["Timestamp", "User ID", "Action", "Module", "Resource ID", "IP Address"], csv_rows
        )
        return _csv_response(csv_bytes, "audit_report.csv")
    return success_response(
        data=[
            {
                "id": str(r.id),
                "created_at": r.created_at,
                "user_id": r.user_id,
                "action": r.action,
                "module": r.module,
                "resource_id": r.resource_id,
                "ip_address": r.ip_address,
            }
            for r in rows
        ]
    )
