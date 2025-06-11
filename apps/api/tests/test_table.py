import pytest
from uuid import uuid4
from http import HTTPStatus
from tests.conftest import (
    create_board_with_authenticated_user,
    get_authenticated_client,
)


@pytest.mark.anyio
async def test_create_and_list_tables() -> None:
    client, _, board_id = await create_board_with_authenticated_user()

    create_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "Test Table", "description": "This is a test table."},
    )
    print("result", create_resp.json())
    assert create_resp.status_code == HTTPStatus.CREATED
    data = create_resp.json()
    assert data["name"] == "Test Table"
    assert data["description"] == "This is a test table."
    assert data["boardId"] == board_id
    table_id = data["id"]

    list_resp = await client.get(f"/api/v1/boards/{board_id}/tables/")
    assert list_resp.status_code == HTTPStatus.OK
    tables = list_resp.json()
    assert any(table["id"] == table_id for table in tables)


@pytest.mark.anyio
async def test_create_table_invalid_board() -> None:
    client, _ = await get_authenticated_client()
    invalid_board_id = str(uuid4())
    resp = await client.post(
        f"/api/v1/boards/{invalid_board_id}/tables/",
        json={"name": "Invalid", "description": "Should not work"},
    )
    assert resp.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.anyio
async def test_list_tables_unauthenticated():
    client, board_id, _ = await create_board_with_authenticated_user()

    client.cookies.clear()
    resp = await client.get(f"/api/v1/boards/{board_id}/tables/")
    assert resp.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.anyio
async def test_update_table_success():
    client, _, board_id = await create_board_with_authenticated_user()
    create_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "Before", "description": "Old desc"},
    )
    table = create_resp.json()

    update_resp = await client.patch(
        f"/api/v1/boards/{board_id}/tables/{table['id']}",
        json={"name": "After", "description": "Updated"},
    )
    assert update_resp.status_code == HTTPStatus.OK
    updated = update_resp.json()
    assert updated["name"] == "After"


@pytest.mark.anyio
async def test_update_table_not_found():
    client, _, board_id = await create_board_with_authenticated_user()
    invalid_table_id = str(uuid4())
    resp = await client.patch(
        f"/api/v1/boards/{board_id}/tables/{invalid_table_id}",
        json={"name": "NotFound", "description": "Should not work"},
    )
    assert resp.status_code == HTTPStatus.NOT_FOUND
    json = resp.json()
    assert json["message"] == f"Table with ID {invalid_table_id} not found"


@pytest.mark.anyio
async def test_delete_table_success():
    client, _, board_id = await create_board_with_authenticated_user()
    create_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "ToDelete", "description": ""},
    )
    table_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/boards/{board_id}/tables/{table_id}")
    assert delete_resp.status_code == HTTPStatus.NO_CONTENT

    list_resp = await client.get(f"/api/v1/boards/{board_id}/tables/")
    assert all(t["id"] != table_id for t in list_resp.json())


@pytest.mark.anyio
async def test_table_access_from_other_user():
    client1, _, board_id = await create_board_with_authenticated_user()
    table_resp = await client1.post(
        f"/api/v1/boards/{board_id}/tables/",
        json={"name": "Secured", "description": ""},
    )
    table_id = table_resp.json()["id"]

    client2, _ = await get_authenticated_client(email="newuser@example.com")
    resp = await client2.patch(
        f"/api/v1/boards/{board_id}/tables/{table_id}",
        json={"name": "Hacked"},
    )
    # assert resp.status_code in (403, 404)
    assert resp.status_code in (HTTPStatus.FORBIDDEN, HTTPStatus.NOT_FOUND)
