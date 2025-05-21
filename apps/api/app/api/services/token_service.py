import jwt
import secrets
from datetime import timedelta, datetime, timezone
from typing import Any
from app.core.config import get_settings

settings = get_settings()


class TokenService:
    @staticmethod
    def create_access_token(sub: str) -> str:
        return TokenService._create_token(
            {"sub": sub, "type": "access"},
            timedelta(minutes=settings.access_token_exp_minutes),
        )

    @staticmethod
    def create_refresh_token(sub: str) -> str:
        return TokenService._create_token(
            {"sub": sub, "type": "refresh", "jti": secrets.token_urlsafe(16)},
            timedelta(days=settings.refresh_token_exp_days),
        )

    @staticmethod
    def decode_token(token: str) -> dict[str, Any]:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

    @staticmethod
    def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
        data["exp"] = datetime.now(tz=timezone.utc) + expires_delta
        return jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)
