from uuid import UUID
from typing import List
from pydantic import ConfigDict
from datetime import datetime
from app.db.base import BaseSchema
from app.api.models.table_model import TableRead
from app.api.models.user_model import UserRead


class BoardCreate(BaseSchema):
    name: str
    description: str | None = None
    member_ids: List[UUID] = []


class BoardUpdate(BaseSchema):
    name: str | None = None
    description: str | None = None


class BoardRead(BaseSchema):
    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    members: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BoardDetailRead(BoardRead):
    tables: List[TableRead] = []
    members: List[UserRead] = []
