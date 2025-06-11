from uuid import UUID
from datetime import timedelta
from typing import Optional, Annotated, List
from fastapi import Depends
from datetime import datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from app.db.database import DBSessionDep
from app.database_models.user import User
from app.database_models.refresh_token import RefreshToken
from app.core.security import create_refresh_token as refresh_token_generator
from app.common.repository import BaseRepository
from app.common.errors.exceptions import NotFoundError


class AuthRepository(BaseRepository[User]):
    def __init__(self, session: DBSessionDep):
        super().__init__(User, User.id, session)
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        res = await self.session.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_valid_refresh_token(self, token: str) -> Optional[RefreshToken]:
        result = await self.session.execute(
            select(RefreshToken)
            .options(joinedload(RefreshToken.user))
            .where(
                RefreshToken.token == token,
                RefreshToken.revoked.is_(False),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token: str) -> None:
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token == token,
                RefreshToken.revoked.is_(False),
            )
        )
        rt = result.scalar_one_or_none()
        if not rt:
            raise NotFoundError(message="Refresh token not found or already revoked")

        rt.revoked = True
        await self.session.commit()

    async def cleanup_old_tokens(self, user_id: UUID) -> None:
        await self.session.execute(
            delete(RefreshToken).where(
                (RefreshToken.user_id == user_id) & (RefreshToken.expires_at < datetime.now(timezone.utc))
            )
        )
        await self.session.commit()

    async def get_valid_refresh_token_for_user(self, user_id: UUID) -> Optional[RefreshToken]:
        stmt = (
            select(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked.is_(False),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
            .order_by(RefreshToken.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_refresh_token(self, user_id: UUID) -> str:
        token = refresh_token_generator(str(user_id))
        new_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        self.session.add(new_token)
        await self.session.commit()
        return token

    async def get_all_users(self) -> list[User]:
        result = await self.session.execute(select(User))
        return result.scalars().all()

    async def get_users_by_ids(self, user_ids: List[UUID]) -> list[User]:
        if not user_ids:
            return []
        result = await self.session.execute(select(User).where(User.id.in_(user_ids)))
        return result.scalars().all()


AuthRepositoryDep = Annotated[AuthRepository, Depends(AuthRepository)]
