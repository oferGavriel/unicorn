from fastapi import APIRouter, status, Response, Cookie

from app.api.services.auth_service import AuthServiceDep
from app.api.models.user_model import UserCreate, UserRead, UserLogin
from app.utils.auth_cookies import set_auth_cookies, delete_auth_cookies


router = APIRouter()


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register(data: UserCreate, response: Response, auth_service: AuthServiceDep) -> UserRead:
    user, access_token, refresh_token = await auth_service.register(data)
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post(
    "/login",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
async def login(data: UserLogin, response: Response, auth_service: AuthServiceDep) -> UserRead:
    user, access_token, refresh_token = await auth_service.authenticate(data.email, data.password)
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post(
    "/refresh-token",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
async def refresh_token(response: Response, auth_service: AuthServiceDep, refresh_token: str = Cookie(None)) -> UserRead:
    if not refresh_token:
        raise ValueError("Missing refresh token")
    user, access_token, refresh_token = await auth_service.refresh(refresh_token)
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    auth_service: AuthServiceDep,
    refresh_token: str = Cookie(None),
) -> Response:
    if refresh_token:
        await auth_service.logout(refresh_token)

    delete_auth_cookies(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
