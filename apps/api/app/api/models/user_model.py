from uuid import UUID
from datetime import datetime
from pydantic import EmailStr, ConfigDict
from app.db.base import BaseSchema


class UserCreate(BaseSchema):
    name: str
    email: EmailStr
    password: str


class UserRead(BaseSchema):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseSchema):
    email: EmailStr
    password: str
