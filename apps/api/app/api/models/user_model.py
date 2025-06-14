from uuid import UUID
from datetime import datetime
from pydantic import EmailStr, ConfigDict, Field
from app.db.base import BaseSchema


class UserCreate(BaseSchema):
    first_name: str = Field(alias="firstName", max_length=50, min_length=1)
    last_name: str = Field(alias="lastName", max_length=50, min_length=1)
    email: EmailStr = Field(max_length=255, min_length=1)
    password: str = Field(max_length=128, min_length=6)

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class UserRead(BaseSchema):
    id: UUID
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: EmailStr
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class UserLogin(BaseSchema):
    email: EmailStr
    password: str
