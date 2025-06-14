from uuid import UUID
from typing import List, Optional
from pydantic import ConfigDict
from datetime import datetime
from app.db.base import BaseSchema
from app.api.models.table_model import TableRead
from app.api.models.user_model import UserRead


class BoardCreate(BaseSchema):
    name: str
    description: Optional[str] = None
    member_ids: Optional[List[UUID]] = []

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class BoardUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None


class BoardRead(BaseSchema):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    member_ids: Optional[List[UUID]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class BoardDetailRead(BoardRead):
    tables: List[TableRead] = []
    members: List[UserRead] = []
