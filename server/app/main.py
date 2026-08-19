"""
Application entry point.

Run with: uvicorn app.main:app --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.cache import close_redis_client, get_redis_client
from app.core.config import settings
from app.core.logger import configure_logging, logger
from app.database.indexes import create_all_indexes
from app.database.migrations import run_pending_migrations
from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.middleware.exception_handler import register_exception_handlers
from app.middleware.request_context import RequestContextMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    logger.info("Starting {} ({})", settings.APP_NAME, settings.ENVIRONMENT)

    await connect_to_mongo()
    await create_all_indexes()
    await run_pending_migrations()
    await get_redis_client()  # best-effort; no-ops if REDIS_URI is unset or unreachable

    logger.info("Startup complete.")
    yield

    logger.info("Shutting down...")
    await close_mongo_connection()
    await close_redis_client()
    logger.info("Shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production-grade Banking Management System API.",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ---- Rate limiting ----
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # ---- Middleware (order matters: outermost added last) ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestContextMiddleware)

    # ---- Centralized error handling ----
    register_exception_handlers(app)

    # ---- Routes ----
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
