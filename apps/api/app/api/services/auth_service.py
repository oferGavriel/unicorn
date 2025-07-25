from typing import Annotated, Tuple
from fastapi import Depends
from uuid import uuid4
from app.api.models.user_model import UserCreate, UserRead
from app.api.dal.auth_repository import AuthRepositoryDep
from app.core.security import hash_password, verify_password
from app.database_models.user import User
from app.common.service import BaseService
from app.common.errors.exceptions import (
    ConflictError,
    RefreshTokenExpiredError,
    InvalidCredentialsError,
)

from app.api.services.token_service import TokenService
from app.utils.avatar import avatar_url


class AuthService(BaseService[User, UserRead]):
    def __init__(self, auth_repository: AuthRepositoryDep):
        super().__init__(UserRead, auth_repository)
        self.auth_repository = auth_repository

    async def register(self, data: UserCreate) -> Tuple[UserRead, str, str]:
        if await self.auth_repository.get_by_email(data.email):
            raise ConflictError(message="Email already registered")

        user_id = uuid4()
        user_avatar_url = avatar_url(data.first_name, data.last_name, user_id)

        new_user = User(
            id=user_id,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            password_hash=hash_password(data.password),
            avatar_url=user_avatar_url,
        )
        await self.auth_repository.create(new_user)

        access_token, refresh_token = await self._issue_tokens(new_user)

        user_read = self.convert_to_model(new_user)
        return user_read, access_token, refresh_token

    async def authenticate(self, email: str, password: str) -> Tuple[UserRead, str, str]:
        user = await self.auth_repository.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError(message="Invalid email or password")

        access_token, refresh_token = await self._issue_tokens(user)
        return self.convert_to_model(user), access_token, refresh_token

    async def refresh(self, token: str) -> Tuple[UserRead, str, str]:
        token_obj = await self.auth_repository.get_valid_refresh_token(token)
        if not token_obj:
            raise RefreshTokenExpiredError(message="Refresh token is invalid or expired")

        access_token, refresh_token = await self._issue_tokens(token_obj.user)
        return self.convert_to_model(token_obj.user), access_token, refresh_token

    async def logout(self, refresh_token: str) -> None:
        token_obj = await self.auth_repository.get_valid_refresh_token(refresh_token)
        if not token_obj:
            return
        await self.auth_repository.revoke_refresh_token(refresh_token)

    async def get_all_users(self) -> list[UserRead]:
        users = await self.auth_repository.get_all_users()
        return [self.convert_to_model(user) for user in users]

    async def _issue_tokens(self, user: User) -> Tuple[str, str]:
        user.access_token = TokenService.create_access_token(str(user.id))

        existing_token = await self.auth_repository.get_valid_refresh_token_for_user(
            user.id
        )
        if existing_token:
            user.refresh_token = existing_token.token
        else:
            user.refresh_token = await self.auth_repository.create_refresh_token(user.id)

        return user.access_token, user.refresh_token


AuthServiceDep = Annotated[AuthService, Depends(AuthService)]
