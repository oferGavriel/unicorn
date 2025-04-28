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
        data = r.json()
        assert "user" in data
        assert data["user"]["email"] == "a@b.com"
        assert data["user"]["name"] == "testuser"
        assert data["message"] == "successfully registered"
        assert data["status"] == "success"

        # Login
        r = await ac.post("/api/v1/auth/login", json={
            "email": "a@b.com",
            "password": "password123"
        })
        assert r.status_code == 200
        data = r.json()
        assert "user" in data
        assert data["user"]["email"] == "a@b.com"
        assert data["user"]["name"] == "testuser"
        assert data["message"] == "Login successful"
        assert data["status"] == "success"

        assert "set-cookie" in r.headers
