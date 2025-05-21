from fastapi import APIRouter, status, Response, Cookie
from typing import cast, Dict, Any

from app.api.services.auth_service import AuthServiceDep
from app.api.models.user_model import UserCreate, UserRead, UserLogin
from app.utils.auth_cookies import set_auth_cookies, delete_auth_cookies
from app.api.routes.openapi_responses import (
    common_errors,
    auth_errors,
    conflict_errors,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    responses=cast(
        Dict[int | str, dict[str, Any]],
        {
            **common_errors,
            **conflict_errors,
        },
    ),
)
async def register(data: UserCreate, response: Response, auth_service: AuthServiceDep):
    user, access_token, refresh_token = await auth_service.register(data)
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.post(
    "/login",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    responses=cast(
        Dict[int | str, dict[str, Any]],
        {
            **common_errors,
            **auth_errors,
        },
    ),
)
async def login(data: UserLogin, response: Response, auth_service: AuthServiceDep):
    user, access_token, refresh_token = await auth_service.authenticate(
        data.email, data.password
    )
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.get(
    "/refresh-token",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    responses=cast(
        Dict[int | str, dict[str, Any]],
        {
            **common_errors,
            **auth_errors,
        },
    ),
)
async def refresh_token(
    response: Response, auth_service: AuthServiceDep, refresh_token: str = Cookie(None)
):
    if not refresh_token:
        raise ValueError("Missing refresh token")
    user, access_token, refresh_token = await auth_service.refresh(refresh_token)
    set_auth_cookies(response, access_token, refresh_token)
    return user


@router.get("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    auth_service: AuthServiceDep,
    refresh_token: str = Cookie(None),
):
    if refresh_token:
        await auth_service.logout(refresh_token)

    delete_auth_cookies(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
