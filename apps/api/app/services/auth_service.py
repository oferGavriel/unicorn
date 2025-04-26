from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserCreate
from app.repositories.user_repo import UserRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.user import User

class AuthService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)

    async def register(self, data: UserCreate) -> User:
        if await self.repo.get_by_email(data.email):
            raise ValueError("Email already registered")
        
        new_user = User(
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
        )
        return await self.repo.create(new_user)
    
    async def authenticate(self, email: str, password: str) -> tuple[str, str]:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")
        return (
            create_access_token(str(user.id)),
            create_refresh_token(str(user.id)),
        )
    