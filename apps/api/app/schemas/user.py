from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserData(BaseModel):
    id: UUID
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
    user: UserData
    message: str
    status: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str

