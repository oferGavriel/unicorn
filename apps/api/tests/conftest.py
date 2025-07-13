import pytest
import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from http import HTTPStatus
from app.main import app
from app.db.base import Base
from app.db.database import get_db_session
from tests.utils.register_and_login_user import register_and_login_user
from app.api.services.row_service import RowService
from app.api.dal.row_repository import RowRepository
from app.api.dal.table_repository import TableRepository
from app.api.dal.row_owner_repository import RowOwnerRepository
from app.api.dal.auth_repository import AuthRepository

DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/unicorn_test"

engine = create_async_engine(
    DATABASE_URL, connect_args={"server_settings": {"timezone": "UTC"}}
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def db():
    async with async_session_maker() as session:
        yield session
        await session.rollback()
        await session.close()


@pytest.fixture(scope="function")
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function", autouse=True)
async def auto_rollback(db: AsyncSession):
    await db.rollback()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def override_app_db():
    async def override_get_db():
        async with async_session_maker() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True, scope="session")
def disable_logger_during_tests():
    logging.getLogger().handlers.clear()
    logging.getLogger().addHandler(logging.NullHandler())


@pytest.fixture
def row_service(
    row_repository: RowRepository,
    table_repository: TableRepository,
    row_owner_repository: RowOwnerRepository,
    auth_repository: AuthRepository,
) -> RowService:
    return RowService(
        row_repository=row_repository,
        table_repository=table_repository,
        row_owner_repository=row_owner_repository,
        auth_repository=auth_repository,
    )


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
def auth_repository(db: AsyncSession) -> AuthRepository:
    return AuthRepository(db)


async def get_authenticated_client(email=None) -> tuple[AsyncClient, str]:
    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://test")
    cookies, user_id = await register_and_login_user(client, email=email)
    client.cookies.set("access_token", cookies["access_token"])
    client.cookies.set("refresh_token", cookies["refresh_token"])
    return client, user_id


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
