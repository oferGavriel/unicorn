import pytest
from httpx import AsyncClient
from http import HTTPStatus
from uuid import uuid4


@pytest.mark.anyio
async def test_register_and_login(async_client: AsyncClient) -> None:
    email = f"user+{uuid4().hex}@example.com"
    payload = {"first_name": "Alice", "last_name": "Smith", "email": email, "password": "secret123"}

    # Register
    register_resp = await async_client.post("/api/v1/auth/register", json=payload)
    assert register_resp.status_code == HTTPStatus.CREATED
    assert "access_token" in register_resp.cookies
    assert "refresh_token" in register_resp.cookies

    # Login
    login_resp = await async_client.post("/api/v1/auth/login", json=payload)
    assert login_resp.status_code == HTTPStatus.OK
    assert "access_token" in login_resp.cookies
    assert "refresh_token" in login_resp.cookies
    assert login_resp.cookies["refresh_token"] == register_resp.cookies["refresh_token"]


@pytest.mark.anyio
async def test_register_duplicate_email(async_client: AsyncClient) -> None:
    email = f"user+{uuid4().hex}@example.com"
    payload = {"first_name": "Alice", "last_name": "Smith", "email": email, "password": "123456"}

    await async_client.post("/api/v1/auth/register", json=payload)
    second_register_resp = await async_client.post("/api/v1/auth/register", json=payload)
    second_register_resp_json = second_register_resp.json()
    print("Second register response:", second_register_resp_json)
    assert second_register_resp.status_code == HTTPStatus.CONFLICT
    assert second_register_resp_json["message"] == "Email already registered"


@pytest.mark.anyio
async def test_login_invalid_credentials(async_client: AsyncClient):
    payload = {"email": "nonexistent@example.com", "password": "wrongpass"}
    resp = await async_client.post("/api/v1/auth/login", json=payload)
    json_resp = resp.json()
    assert resp.status_code == HTTPStatus.UNAUTHORIZED
    assert json_resp["message"] == "Invalid email or password"


@pytest.mark.anyio
async def test_refresh_token_success_and_failure(async_client: AsyncClient):
    email = f"user+{uuid4().hex}@example.com"
    payload = {"first_name": "Alice", "last_name": "Smith", "email": email, "password": "test123"}

    register_resp = await async_client.post("/api/v1/auth/register", json=payload)
    refresh_token = register_resp.cookies.get("refresh_token")
    async_client.cookies.set("refresh_token", refresh_token)

    refresh_resp = await async_client.post("/api/v1/auth/refresh-token")
    assert refresh_resp.status_code == HTTPStatus.OK
    assert "access_token" in refresh_resp.cookies

    # simulate invalid token
    async_client.cookies.set("refresh_token", "invalid.token")
    invalid_resp = await async_client.post("/api/v1/auth/refresh-token")
    assert invalid_resp.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.anyio
async def test_logout(async_client: AsyncClient):
    email = f"user+{uuid4().hex}@example.com"
    payload = {"first_name": "Alice", "last_name": "Smith", "email": email, "password": "test123"}

    register_resp = await async_client.post("/api/v1/auth/register", json=payload)
    refresh_token = register_resp.cookies.get("refresh_token")
    async_client.cookies.set("refresh_token", refresh_token)

    logout_resp = await async_client.get("/api/v1/auth/logout")
    assert logout_resp.status_code == HTTPStatus.NO_CONTENT


@pytest.mark.anyio
async def test_register_with_invalid_chars_raise_error(async_client: AsyncClient) -> None:
    email = f"user+{uuid4().hex}@example.com"
    payload = {"first_name": "J0hn$", "last_name": "Sm1th@", "email": email, "password": "test123"}

    resp = await async_client.post("/api/v1/auth/register", json=payload)
    json_resp = resp.json()

    assert resp.status_code == HTTPStatus.UNPROCESSABLE_ENTITY

    errors = json_resp["detail"]

    first_name_error = next((err for err in errors if "first_name" in str(err.get("loc", []))), None)
    last_name_error = next((err for err in errors if "last_name" in str(err.get("loc", []))), None)

    assert first_name_error is not None
    assert last_name_error is not None
