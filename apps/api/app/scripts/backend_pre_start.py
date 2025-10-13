import asyncio
import logging

from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed
from sqlalchemy import text

from app.core.database import async_engine
from app.core.config import get_settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

MAX_TRIES = settings.max_tries
WAIT_SECONDS = settings.wait_seconds


@retry(
    stop=stop_after_attempt(MAX_TRIES),
    wait=wait_fixed(WAIT_SECONDS),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
async def init() -> None:
    """Initialize the database, retrying if it's not ready yet."""
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database is ready!")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise


def main() -> None:
    """Initialize the service."""
    logger.info("Initializing service")
    asyncio.run(init())
    logger.info("Service finished initializing")


if __name__ == "__main__":
    main()
