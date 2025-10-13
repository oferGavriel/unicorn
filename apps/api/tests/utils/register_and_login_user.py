import uuid
from httpx import AsyncClient
from http import HTTPStatus


async def register_and_login_user(
    async_client: AsyncClient,
    first_name: str = "Alice",
    last_name: str = "Smith",
    email: str | None = None,
    password: str = "secret123",  # noqa: S107
) -> tuple[dict[str, str], str]:
    if email is None:
        email = f"user+{uuid.uuid4().hex[:8]}@example.com"

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    if login_resp.status_code == HTTPStatus.OK:
        user_data = login_resp.json()
        assert user_data["firstName"] == first_name
        assert user_data["lastName"] == last_name
        assert user_data["email"] == email
        assert user_data["id"] is not None

        user_id = user_data["id"]
        return dict(login_resp.cookies), str(user_id)

    register_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "password": password,
        },
    )
    assert register_resp.status_code == HTTPStatus.CREATED
    user_data = register_resp.json()

    assert user_data["firstName"] == first_name
    assert user_data["lastName"] == last_name
    assert user_data["email"] == email
    assert user_data["id"] is not None

    user_id = user_data["id"]
    return dict(register_resp.cookies), str(user_id)
