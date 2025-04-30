from fastapi import Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from app.models.user import User
from sqlalchemy import select
from app.core.security import decode_token


async def get_current_user(
        request: Request,
        db: AsyncSession = Depends(get_db)
) -> User:
    token = request.cookies.get("access_token")
    print(f"Token: {token}")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")


    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
