"""
Structured, correlation-aware logging.

Every log line carries a request_id (when available) so requests can be
traced end-to-end across routers, services, and repositories.
"""

import sys
from contextvars import ContextVar
from typing import TYPE_CHECKING

from loguru import logger

from app.core.config import settings

if TYPE_CHECKING:
    from loguru import Record

# Holds the current request's correlation ID; set by RequestContextMiddleware.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


def _patch_record(record: "Record") -> None:
    record["extra"]["request_id"] = request_id_ctx.get()


def configure_logging() -> None:
    """Configure Loguru sinks. Call once at application startup."""
    logger.remove()
    logger.configure(patcher=_patch_record)

    if settings.LOG_JSON:
        logger.add(
            sys.stdout,
            level=settings.LOG_LEVEL,
            serialize=True,
            backtrace=False,
            diagnose=False,
        )
    else:
        fmt = (
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "req_id={extra[request_id]} | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        )
        logger.add(sys.stdout, level=settings.LOG_LEVEL, format=fmt, colorize=True)


__all__ = ["logger", "configure_logging", "request_id_ctx"]
