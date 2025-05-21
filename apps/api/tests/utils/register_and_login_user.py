import uuid
from httpx import AsyncClient
from http import HTTPStatus


async def register_and_login_user(
    async_client: AsyncClient,
    name: str = "Alice",
    email: str = None,
    password: str = "secret123",  # noqa: S107
) -> tuple[dict[str, str], int]:
    if email is None:
        email = f"user+{uuid.uuid4().hex[:8]}@example.com"

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"name": name, "email": email, "password": password},
    )

    if login_resp.status_code == HTTPStatus.OK:
        user_data = login_resp.json()
        assert user_data["name"] == name
        assert user_data["email"] == email
        assert user_data["id"] is not None

        return login_resp.cookies, user_data["id"]

    register_resp = await async_client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert register_resp.status_code == HTTPStatus.CREATED
    user_data = register_resp.json()

    assert user_data["name"] == name
    assert user_data["email"] == email
    assert user_data["id"] is not None

    return register_resp.cookies, user_data["id"]
