from uuid import UUID
from pydantic import ConfigDict
from datetime import datetime
from app.db.base import BaseSchema


class BoardCreate(BaseSchema):
    name: str
    description: str | None = None


class BoardUpdate(BaseSchema):
    name: str | None = None
    description: str | None = None
    order: int | None = None


class BoardRead(BaseSchema):
    id: UUID
    name: str
    description: str | None
    order: int
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
