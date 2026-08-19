"""
Centralized exception handling.

Registered once on the FastAPI app in `main.py`. Ensures every error —
expected (AppException) or unexpected — comes back to the client in the
standard envelope, and that internal details never leak in production.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logger import logger, request_id_ctx
from app.core.responses import ErrorDetail, ErrorResponse


def _error_response(
    status_code: int, error_code: str, message: str, details: dict | None = None
) -> JSONResponse:
    body = ErrorResponse(
        message=message,
        errors=ErrorDetail(error_code=error_code, message=message, details=details),
        request_id=request_id_ctx.get(),
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
        logger.warning("AppException: {} - {}", exc.error_code, exc.message)
        return _error_response(exc.status_code, exc.error_code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = {"fields": exc.errors()}
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "VALIDATION_ERROR",
            "One or more fields failed validation.",
            details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(exc.status_code, "HTTP_ERROR", str(exc.detail))

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
        logger.opt(exception=exc).error("Unhandled exception")
        message = str(exc) if settings.DEBUG else "An unexpected error occurred."
        return _error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", message)
