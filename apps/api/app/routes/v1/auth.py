from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserRead, UserData, UserLogin
from app.utils.auth_cookies import set_auth_cookies

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    svc = AuthService(db)
    try:
        user = await svc.register(data)
        set_auth_cookies(response, str(user.id))
        return {
            "user": UserData.model_validate(user),
            "message": "successfully registered",
            "status": "success",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=UserRead, status_code=status.HTTP_200_OK)
async def login(
    data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
  ):
    svc = AuthService(db)
    try:
        user = await svc.authenticate(data.email, data.password)
        set_auth_cookies(response, str(user.id))
        return {
          "user": UserData.model_validate(user),
          "message": "Login successful",
          "status": "success",
        }
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
