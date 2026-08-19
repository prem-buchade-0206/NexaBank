"""
Optional Redis cache.

Per the spec, Redis is an optional caching layer, not a hard dependency —
the app must keep working if REDIS_URI is unset or Redis is unreachable.
`cache_get_json`/`cache_set_json` degrade to a silent no-op (cache miss)
in either case rather than raising, so callers never need their own
try/except around every cache call.
"""

import json
from typing import Any

import redis.asyncio as redis

from app.core.config import settings
from app.core.logger import logger

_client: redis.Redis | None = None
_connection_attempted = False


async def get_redis_client() -> redis.Redis | None:
    global _client, _connection_attempted
    if _client is not None:
        return _client
    if _connection_attempted or not settings.REDIS_URI:
        return None

    _connection_attempted = True
    try:
        client = redis.from_url(settings.REDIS_URI, decode_responses=True)
        await client.ping()
        _client = client
        logger.info("Redis cache connected.")
        return _client
    except Exception as exc:  # noqa: BLE001 - cache is optional; never block startup on it
        logger.warning("Redis unavailable, caching disabled: {}", exc)
        return None


async def cache_get_json(key: str) -> Any | None:
    client = await get_redis_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        return json.loads(raw) if raw is not None else None
    except Exception as exc:  # noqa: BLE001 - a cache read failure should never break the caller
        logger.warning("Redis GET failed for {}: {}", key, exc)
        return None


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    client = await get_redis_client()
    if client is None:
        return
    try:
        await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception as exc:  # noqa: BLE001 - a cache write failure should never break the caller
        logger.warning("Redis SET failed for {}: {}", key, exc)


async def close_redis_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
