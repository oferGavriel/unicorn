from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from app.core.config import get_settings

async_engine = create_async_engine(
    get_settings().db_url_async,
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncSession:  # type: ignore
    async with async_session_maker() as session:
        yield session
        await session.close()


DBSessionDep = Annotated[AsyncSession, Depends(get_db_session)]
