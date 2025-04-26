import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as ac:
        # Register
        r = await ac.post("/api/v1/auth/register", json={
            "email": "a@b.com",
            "name": "testuser",
            "password": "password123"
        })
        assert r.status_code == 201
        assert "id" in r.json()
        assert r.json()["email"] == "a@b.com"
        assert r.json()["name"] == "testuser"

        # Login
        r = await ac.post("/api/v1/auth/login", json={
            "email": "a@b.com",
            "password": "password123"
        })
        assert r.status_code == 200
        assert "access_token" in r.json()
        assert "refresh_token" in r.json()
