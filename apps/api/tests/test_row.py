import pytest
from uuid import UUID, uuid4
from http import HTTPStatus
from tests.conftest import (
    get_authenticated_client,
    create_table_with_authenticated_user,
    RowService,
)
from app.common.errors.exceptions import NotFoundError


@pytest.mark.anyio
async def test_create_row() -> None:
    client, _, board_id, table_id = await create_table_with_authenticated_user()

    response = await client.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Task 1", "description": "Test task"},
    )
    assert response.status_code == HTTPStatus.CREATED
    data = response.json()
    print("response", data)
    assert data["name"] == "Task 1"
    assert data["description"] == "Test task"
    assert data["tableId"] == table_id
    assert data["id"] is not None


@pytest.mark.anyio
async def test_update_row() -> None:
    client, _, board_id, table_id = await create_table_with_authenticated_user()

    create_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Task 1", "description": "Test task"},
    )
    row = create_resp.json()
    row_id = row["id"]

    update_resp = await client.put(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
        json={
            "name": "Updated Task",
            "description": "Updated description",
        },
    )

    assert update_resp.status_code == HTTPStatus.OK
    updated_row = update_resp.json()
    assert updated_row["name"] == "Updated Task"
    assert updated_row["description"] == "Updated description"


@pytest.mark.anyio
async def test_delete_row(row_service: RowService) -> None:
    client, user_id, board_id, table_id = await create_table_with_authenticated_user()

    create_resp = await client.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Task 1", "description": "Test task"},
    )

    row = create_resp.json()
    row_id = row["id"]

    delete_resp = await client.delete(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
    )
    assert delete_resp.status_code == HTTPStatus.NO_CONTENT

    with pytest.raises(NotFoundError):
        await row_service.get_row(UUID(row_id), UUID(table_id), UUID(user_id))


@pytest.mark.anyio
async def test_row_not_found() -> None:
    client, _, board_id, table_id = await create_table_with_authenticated_user()

    row_id = uuid4()
    # update a row that doesn't exist
    resp = await client.put(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
        json={"name": "Updated Task", "description": "Updated description"},
    )
    assert resp.status_code == HTTPStatus.NOT_FOUND

    # delete a row that doesn't exist
    resp = await client.delete(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
    )
    assert resp.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.anyio
async def test_user_cannot_create_row_in_other_user_table() -> None:
    # User A created a board and table
    _, _, board_id, table_id = await create_table_with_authenticated_user()

    # User B logs in
    client_b, _ = await get_authenticated_client(email="userb@example.com")

    # User B try to create a row in User A's table
    resp = await client_b.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Should fail", "description": "Unauthorized"},
    )
    assert resp.status_code in (HTTPStatus.FORBIDDEN, HTTPStatus.NOT_FOUND)


@pytest.mark.anyio
async def test_user_cannot_update_row_in_other_user_table() -> None:
    # User A created a board and table and adds a row
    client_a, _, board_id, table_id = await create_table_with_authenticated_user()
    row_resp = await client_a.post(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/",
        json={"name": "Task 1", "description": "Row A"},
    )

    assert row_resp.status_code == HTTPStatus.CREATED
    row = row_resp.json()
    row_id = row["id"]

    # User B logs in
    client_b, _ = await get_authenticated_client(email="userb@example.com")
    # User B tries to update User A's row
    update_resp = await client_b.put(
        f"/api/v1/boards/{board_id}/tables/{table_id}/rows/{row_id}",
        json={"name": "Should fail", "description": "Unauthorized"},
    )
    assert update_resp.status_code in (HTTPStatus.FORBIDDEN, HTTPStatus.NOT_FOUND)
