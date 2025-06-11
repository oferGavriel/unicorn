from uuid import UUID
from fastapi import Request, Depends
from app.db.database import DBSessionDep
from app.database_models.user import User
from sqlalchemy import select
from app.core.security import decode_token
from app.common.errors.exceptions import TokenInvalidError, AccessTokenExpiredError


async def current_user(request: Request, session: DBSessionDep) -> User:
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    print(f"Access Token: {access_token}, Refresh Token: {refresh_token}")
    if not access_token and not refresh_token:
        raise TokenInvalidError(message="Not authenticated, please login first")

    if not access_token:
        raise AccessTokenExpiredError(message="Expired token")

    try:
        payload = decode_token(access_token)
        user_id = UUID(payload["sub"])
    except Exception as err:
        raise TokenInvalidError("Invalid token") from err

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise TokenInvalidError("User not found")

    return user


CurrentUserDep = Depends(current_user)
