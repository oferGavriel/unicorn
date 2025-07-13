from uuid import uuid4
import pytest
from httpx import AsyncClient
from http import HTTPStatus
from tests.conftest import create_board_with_authenticated_user, get_authenticated_client


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

    update_resp = await client.patch(
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


@pytest.mark.anyio
async def test_duplicate_board() -> None:
    client, user_id, board_id = await create_board_with_authenticated_user()

    get_board_resp = await client.get(f"/api/v1/boards/{board_id}")
    assert get_board_resp.status_code == HTTPStatus.OK
    original_board = get_board_resp.json()

    duplicate_resp = await client.post(f"/api/v1/boards/{board_id}/duplicate")
    assert duplicate_resp.status_code == HTTPStatus.CREATED
    duplicated_board = duplicate_resp.json()

    assert duplicated_board["id"] != board_id
    assert duplicated_board["name"] == f"{original_board["name"]} (1)"
    assert duplicated_board["description"] == original_board["description"]
    assert duplicated_board["ownerId"] == user_id

    # Test access to duplicated board
    get_duplicated_resp = await client.get(f"/api/v1/boards/{duplicated_board['id']}")
    assert get_duplicated_resp.status_code == HTTPStatus.OK

    # List both of the boards
    list_resp = await client.get("/api/v1/boards/")
    assert list_resp.status_code == HTTPStatus.OK
    boards = list_resp.json()
    board_ids = [board["id"] for board in boards]
    assert board_id in board_ids
    assert duplicated_board["id"] in board_ids


@pytest.mark.anyio
async def test_add_member_to_board() -> None:
    client_a, _, board_id = await create_board_with_authenticated_user()

    client_b, user_id_b = await get_authenticated_client(email="userB@example.com")
    await client_a.post(f"/api/v1/boards/{board_id}/members", json={"userId": user_id_b})
    get_boards_list = await client_b.get("/api/v1/boards/")

    assert get_boards_list.status_code == HTTPStatus.OK
    boards_data = get_boards_list.json()

    board = next((b for b in boards_data if b["id"] == board_id), None)
    assert board is not None
    assert user_id_b in board["memberIds"]


@pytest.mark.anyio
async def test_get_board_members() -> None:
    client_a, _, board_id = await create_board_with_authenticated_user()

    _, user_id_b = await get_authenticated_client(email="user_b@example.com")
    await client_a.post(f"/api/v1/boards/{board_id}/members", json={"userId": user_id_b})
    get_members_resp = await client_a.get(f"/api/v1/boards/{board_id}/members")
    assert get_members_resp.status_code == HTTPStatus.OK
    members_data = get_members_resp.json()
    assert isinstance(members_data, list)
    assert any(member["id"] == user_id_b for member in members_data)


@pytest.mark.anyio
async def test_full_board_flow() -> None:
    """
    Test user A creates a board, adds a table, and a row, add user B as a member,
    and then user B can access the board,
    and user A set user B as the owner of the created row.
    then both users can access the full board tree with all the data.
    """

    client_a, _, board_id = await create_board_with_authenticated_user()

    create_table_resp = await client_a.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "Test Table", "description": "This is a test table."},
    )
    assert create_table_resp.status_code == HTTPStatus.CREATED
    table_data = create_table_resp.json()
    table_id = table_data["id"]

    create_row_resp = await client_a.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Test Row", "description": "This is a test row."},
    )
    assert create_row_resp.status_code == HTTPStatus.CREATED
    row_data = create_row_resp.json()
    row_id = row_data["id"]

    client_b, user_id_b = await get_authenticated_client(email="user_b@example.com")
    add_member_resp = await client_a.post(
        f"/api/v1/boards/{board_id}/members",
        json={"userId": user_id_b},
    )
    assert add_member_resp.status_code == HTTPStatus.CREATED

    get_board_resp = await client_a.get(f"/api/v1/boards/{board_id}")
    assert get_board_resp.status_code == HTTPStatus.OK
    board = get_board_resp.json()
    assert user_id_b in board["memberIds"]

    set_owner_resp = await client_a.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}/owners/{user_id_b}",
    )
    assert set_owner_resp.status_code == HTTPStatus.OK

    # Verify User B can access the full board tree with all the data
    get_full_tree_resp = await client_b.get(f"/api/v1/boards/{board_id}")
    assert get_full_tree_resp.status_code == HTTPStatus.OK
    full_tree_data = get_full_tree_resp.json()
    assert full_tree_data["id"] == board_id
