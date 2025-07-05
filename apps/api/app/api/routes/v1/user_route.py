from fastapi import APIRouter, status
from typing import List

from app.api.services.auth_service import AuthServiceDep
from app.api.models.user_model import UserRead
from app.DI.current_user import CurrentUserDep
from app.database_models.user import User

router = APIRouter()


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    description="Get the current authenticated user",
)
async def get_current_user(current_user: User = CurrentUserDep) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get(
    "/all",
    response_model=List[UserRead],
    status_code=status.HTTP_200_OK,
    description="Get all users",
)
async def get_all_users(auth_service: AuthServiceDep) -> List[UserRead]:
    return await auth_service.get_all_users()
