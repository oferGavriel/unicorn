from datetime import datetime, timedelta, timezone
from typing import Any, TypedDict, cast
import secrets
import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenPayload(TypedDict):
    sub: str
    exp: int
    iat: int
    type: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(tz=timezone.utc) + expires_delta
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(sub: str) -> str:
    return _create_token(
        {"sub": sub, "type": "access"},
        timedelta(minutes=settings.access_token_exp_minutes),
    )


def create_refresh_token(sub: str) -> str:
    return _create_token(
        {"sub": sub, "type": "refresh", "jti": secrets.token_urlsafe(16)},
        timedelta(days=settings.refresh_token_exp_days),
    )


def decode_token(token: str) -> TokenPayload:
    decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    return cast(TokenPayload, decoded)
