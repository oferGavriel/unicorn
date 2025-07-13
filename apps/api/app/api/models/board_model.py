from uuid import UUID
from typing import List, Optional
from pydantic import Field
from datetime import datetime
from app.db.base import BaseSchema
from app.api.models.table_model import TableRead


class BoardCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    member_ids: Optional[List[UUID]] = []


class BoardUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    position: Optional[int] = Field(None, ge=0, le=100)


class BoardRead(BaseSchema):
    id: UUID
    name: str
    description: Optional[str]
    owner_id: UUID
    member_ids: Optional[List[UUID]] = []
    position: int
    created_at: datetime
    updated_at: datetime


class BoardDetailRead(BoardRead):
    tables: List[TableRead] = []


class AddBoardMemberRequest(BaseSchema):
    user_id: UUID = Field(..., description="ID of the user to add as a member")
