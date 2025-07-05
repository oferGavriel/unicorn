from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import EmailStr, Field, field_validator
from app.db.base import BaseSchema


class UserCreate(BaseSchema):
    first_name: str = Field(alias="firstName", max_length=50, min_length=1)
    last_name: str = Field(alias="lastName", max_length=50, min_length=1)
    email: EmailStr = Field(max_length=255, min_length=1)
    password: str = Field(max_length=128, min_length=6)

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.isalpha():
            raise ValueError("Name must contain only alphabetic characters.")
        return value.strip().title()


class UserRead(BaseSchema):
    id: UUID
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: EmailStr
    avatar_url: Optional[str] = Field(default=None, alias="avatarUrl")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class UserLogin(BaseSchema):
    email: EmailStr
    password: str
