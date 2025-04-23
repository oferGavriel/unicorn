from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

settings = get_settings()
ALGORITHM = "HS256"

def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    """Generic token builder."""
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(tz=timezone.utc) + expires_delta
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def create_access_token(sub: str) -> str:
    """Return a short-lived access JWT."""
    return _create_token(
        {"sub": sub, "type": "access"},
        timedelta(minutes=settings.access_token_exp_minutes),
    )

def create_refresh_token(sub: str) -> str:
    """Return a long-lived refresh JWT."""
    return _create_token(
        {"sub": sub, "type": "refresh"},
        timedelta(days=settings.refresh_token_exp_days),
    )

def decode_token(token: str) -> dict[str, Any]:
    """Decode token or raise `jwt.PyJWTError`."""
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
