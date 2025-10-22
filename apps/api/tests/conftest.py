from typing import Any, AsyncGenerator, Dict, Generator
from app.api.dal.board_member_repository import BoardMemberRepository
import pytest
import pytest_asyncio
import logging
from unittest.mock import AsyncMock, MagicMock

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from http import HTTPStatus
from app.main import app
from app.db.base import Base
from app.core.database import get_db_session
from app.core.redis import get_redis
from tests.utils.register_and_login_user import register_and_login_user
from app.notification.notification_service import NotificationService
from app.api.services import AuthService, BoardService, RowService, TableService
from app.api.dal import (
    AuthRepository,
    BoardRepository,
    RowRepository,
    TableRepository,
    RowOwnerRepository,
)

DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/unicorn_test"


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_database() -> AsyncGenerator[None, None]:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        connect_args={"server_settings": {"timezone": "UTC"}},
    )
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Store in app state for other fixtures to access
    app.state.test_engine = engine
    app.state.test_async_session_maker = async_session_maker

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
def mock_redis() -> AsyncMock:
    r = AsyncMock()
    pipeline = MagicMock()
    pipeline.execute = AsyncMock(return_value=[])
    pipeline.rpush = MagicMock()
    pipeline.zadd = MagicMock()
    r.pipeline = MagicMock(return_value=pipeline)
    r.zrangebyscore = AsyncMock(return_value=[])
    r.lrange = AsyncMock(return_value=[])
    r.zrem = AsyncMock()
    r.delete = AsyncMock()
    r.aclose = AsyncMock()
    return r


@pytest.fixture(scope="function", autouse=True)
def mock_redis_dependency(mock_redis: AsyncMock) -> Generator[AsyncMock, None, None]:
    async def override_get_redis() -> AsyncGenerator[AsyncMock, None]:
        yield mock_redis

    app.dependency_overrides[get_redis] = override_get_redis

    yield mock_redis

    app.dependency_overrides.pop(get_redis, None)


@pytest_asyncio.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with app.state.test_async_session_maker() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function", autouse=True)
def override_app_db() -> Generator[None, None, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with app.state.test_async_session_maker() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True, scope="session")
def disable_logger_during_tests() -> None:
    logging.getLogger().handlers.clear()
    logging.getLogger().addHandler(logging.NullHandler())


@pytest.fixture
def auth_repository(db: AsyncSession) -> AuthRepository:
    return AuthRepository(db)


@pytest.fixture
def board_repository(db: AsyncSession) -> BoardRepository:
    return BoardRepository(db)


@pytest.fixture
def row_repository(db: AsyncSession) -> RowRepository:
    return RowRepository(db)


@pytest.fixture
def table_repository(db: AsyncSession) -> TableRepository:
    return TableRepository(db)


@pytest.fixture
def row_owner_repository(db: AsyncSession) -> RowOwnerRepository:
    return RowOwnerRepository(db)


@pytest.fixture
def auth_service(auth_repository: AuthRepository) -> AuthService:
    return AuthService(auth_repository)


@pytest.fixture
def board_service(
    board_repository: BoardRepository,
    member_repository: BoardMemberRepository,
    row_service: RowService,
) -> BoardService:
    return BoardService(
        board_repository=board_repository,
        member_repository=member_repository,
        row_service=row_service,
    )


@pytest.fixture
def table_service(
    table_repository: TableRepository,
    board_service: BoardService,
    auth_repository: AuthRepository,
) -> TableService:
    return TableService(
        table_repository=table_repository,
        board_service=board_service,
        auth_repository=auth_repository,
    )


@pytest.fixture
def row_service(  # noqa: PLR0913
    row_repository: RowRepository,
    table_repository: TableRepository,
    row_owner_repository: RowOwnerRepository,
    auth_repository: AuthRepository,
    notification_service: NotificationService,
    board_repository: BoardRepository,
) -> RowService:
    return RowService(
        row_repository=row_repository,
        table_repository=table_repository,
        row_owner_repository=row_owner_repository,
        auth_repository=auth_repository,
        notification_service=notification_service,
        board_repository=board_repository,
    )


@pytest.fixture
def notification_service(mock_redis: AsyncMock) -> NotificationService:
    return NotificationService(mock_redis)


async def get_authenticated_client(email: str | None = None) -> tuple[AsyncClient, str]:
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    cookies, user_id = await register_and_login_user(client, email=email)
    client.cookies.set("access_token", cookies["access_token"])
    client.cookies.set("refresh_token", cookies["refresh_token"])
    return client, str(user_id)


async def create_board_with_authenticated_user() -> tuple[AsyncClient, str, str]:
    client, user_id = await get_authenticated_client()
    create_board_resp = await client.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )
    assert create_board_resp.status_code == HTTPStatus.CREATED
    board_id = create_board_resp.json()["id"]
    return client, user_id, board_id


async def create_table_with_authenticated_user() -> tuple[AsyncClient, str, str, str]:
    client, user_id, board_id = await create_board_with_authenticated_user()
    create_table_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "Test Table", "description": "This is a test table."},
    )
    assert create_table_resp.status_code == HTTPStatus.CREATED
    table_id = create_table_resp.json()["id"]
    return client, user_id, board_id, table_id


@pytest_asyncio.fixture
async def table_with_two_members() -> AsyncGenerator[Dict[str, Any], None]:
    member_client, member_id = await get_authenticated_client()
    try:
        # create board and table with owner
        create_table_result = await create_table_with_authenticated_user()
        # create_table_with_authenticated_user returns (client, user_id, board_id, table_id)
        owner_client, owner_id, board_id, table_id = create_table_result

        # add member to board
        add_member_resp = await owner_client.post(
            f"/api/v1/boards/{board_id}/members",
            json={"user_id": member_id, "role": "MEMBER"},
        )
        assert add_member_resp.status_code == HTTPStatus.CREATED

        yield {
            "owner_client": owner_client,
            "owner_id": owner_id,
            "member_client": member_client,
            "member_id": member_id,
            "board_id": board_id,
            "table_id": table_id,
        }
    finally:
        await owner_client.aclose()
        await member_client.aclose()
