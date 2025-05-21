from uuid import uuid4
import pytest
from httpx import AsyncClient
from http import HTTPStatus
from tests.conftest import get_authenticated_client


@pytest.mark.anyio
async def test_create_and_list_boards() -> None:
    client, _ = await get_authenticated_client()

    create_resp = await client.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )

    assert create_resp.status_code == HTTPStatus.CREATED
    data = create_resp.json()
    assert data["name"] == "Test Board"
    assert data["description"] == "This is a test board."
    board_id = data["id"]

    list_resp = await client.get("/api/v1/boards/")
    assert list_resp.status_code == HTTPStatus.OK
    boards = list_resp.json()
    assert isinstance(boards, list)
    assert any(board["id"] == board_id for board in boards)


@pytest.mark.anyio
async def test_get_board_by_id() -> None:
    client, _ = await get_authenticated_client()

    create_resp = await client.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )

    assert create_resp.status_code == HTTPStatus.CREATED
    data = create_resp.json()
    board_id = data["id"]

    get_resp = await client.get(f"/api/v1/boards/{board_id}")
    assert get_resp.status_code == HTTPStatus.OK
    board = get_resp.json()
    assert board["id"] == board_id
    assert board["name"] == "Test Board"
    assert board["description"] == "This is a test board."


@pytest.mark.anyio
async def test_update_board() -> None:
    client, _ = await get_authenticated_client()

    create_resp = await client.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )

    assert create_resp.status_code == HTTPStatus.CREATED
    data = create_resp.json()
    board_id = data["id"]

    update_resp = await client.put(
        f"/api/v1/boards/{board_id}",
        json={"name": "Updated Board", "description": "This is an updated test board."},
    )

    assert update_resp.status_code == HTTPStatus.OK
    updated_board = update_resp.json()
    assert updated_board["id"] == board_id
    assert updated_board["name"] == "Updated Board"
    assert updated_board["description"] == "This is an updated test board."


@pytest.mark.anyio
async def test_delete_board() -> None:
    client, _ = await get_authenticated_client()

    create_resp = await client.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )

    assert create_resp.status_code == HTTPStatus.CREATED
    data = create_resp.json()
    board_id = data["id"]

    delete_resp = await client.delete(f"/api/v1/boards/{board_id}")
    assert delete_resp.status_code == HTTPStatus.NO_CONTENT

    get_resp = await client.get(f"/api/v1/boards/{board_id}")
    assert get_resp.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.anyio
async def test_cannot_access_board_of_other_user() -> None:
    # User A
    client_a, _ = await get_authenticated_client()
    create_resp = await client_a.post(
        "/api/v1/boards/",
        json={"name": "Test Board", "description": "This is a test board."},
    )
    assert create_resp.status_code == HTTPStatus.CREATED
    board_id = create_resp.json()["id"]

    # User B
    client_b, _ = await get_authenticated_client(email="userb@example.com")
    get_resp = await client_b.get(f"/api/v1/boards/{board_id}")
    assert get_resp.status_code in (
        HTTPStatus.FORBIDDEN,
        HTTPStatus.NOT_FOUND,
    ), get_resp.text


@pytest.mark.anyio
async def test_raise_unauthorized(async_client: AsyncClient) -> None:
    async_client.cookies.clear()
    resp = await async_client.get("/api/v1/boards/")
    assert resp.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.anyio
async def test_raise_not_found_board() -> None:
    client, _ = await get_authenticated_client()
    board_id = uuid4()
    resp = await client.get(f"/api/v1/boards/{board_id}")
    json = resp.json()
    assert resp.status_code == HTTPStatus.NOT_FOUND
    assert json["message"] == f"Board with ID {board_id} not found"
