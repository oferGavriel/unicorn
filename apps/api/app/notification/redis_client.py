from typing import AsyncGenerator, Annotated
from fastapi import Depends
import redis.asyncio as redis
from app.core.config import get_settings

settings = get_settings()

_redis_pool: redis.ConnectionPool | None = None


async def init_redis_pool() -> None:
    global _redis_pool  # noqa: PLW0603
    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
        )


async def close_redis_pool() -> None:
    global _redis_pool  # noqa: PLW0603
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    if _redis_pool is None:
        raise RuntimeError("Redis pool not initialized. Call init_redis_pool() first.")

    redis_client = redis.Redis(connection_pool=_redis_pool)
    try:
        yield redis_client
    finally:
        await redis_client.aclose()


RedisDep = Annotated[redis.Redis, Depends(get_redis)]
