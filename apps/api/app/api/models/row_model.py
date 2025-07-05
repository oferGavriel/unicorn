from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import Field
from app.core.enums import StatusEnum, PriorityEnum
from app.db.base import BaseSchema


class RowOwnerRead(BaseSchema):
    id: UUID
    first_name: str
    last_name: str
    email: str
    avatar_url: Optional[str] = None


class RowCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    position: int = Field(default=0, ge=0)


class RowUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    owners: Optional[List[UUID]] = Field(None, max_length=50)
    status: Optional[StatusEnum] = Field(None)
    priority: Optional[PriorityEnum] = Field(None)
    due_date: Optional[datetime] = Field(None)
    position: Optional[int] = Field(None)


class RowRead(BaseSchema):
    id: UUID
    table_id: UUID
    name: str
    owners: List[RowOwnerRead] = []
    status: StatusEnum
    priority: PriorityEnum
    due_date: Optional[datetime] = None
    position: int
    created_at: datetime
    updated_at: datetime
