from uuid import UUID
from fastapi import Request, HTTPException, Depends
from app.db.database import DBSessionDep
from app.database_models.user import User
from sqlalchemy import select
from app.core.security import decode_token
from app.common.errors.exceptions import TokenInvalidError


async def current_user(request: Request, session: DBSessionDep) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=401, detail="Not authenticated, please login first"
        )

    try:
        payload = decode_token(token)
        user_id = UUID(payload["sub"])
    except Exception as err:
        raise TokenInvalidError("Invalid token") from err

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise TokenInvalidError("User not found")

    return user


CurrentUserDep = Depends(current_user)
