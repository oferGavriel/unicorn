from uuid import UUID
from datetime import datetime
from pydantic import Field, ConfigDict
from app.database_models.row import StatusEnum, PriorityEnum
from app.db.base import BaseSchema


class RowCreate(BaseSchema):
    name: str
    description: str | None = None
    status: StatusEnum = Field(default=StatusEnum.todo)
    priority: PriorityEnum = Field(default=PriorityEnum.medium)
    assignee_id: UUID | None = None
    due_date: datetime | None = None
    position: int | None = None


class RowUpdate(BaseSchema):
    name: str | None = None
    description: str | None = None
    status: StatusEnum | None = None
    priority: PriorityEnum | None = None
    assignee_id: UUID | None = None
    due_date: datetime | None = None
    position: int | None = None


class RowRead(BaseSchema):
    id: UUID
    table_id: UUID
    name: str
    description: str | None
    status: StatusEnum
    priority: PriorityEnum
    assignee_id: UUID | None
    due_date: datetime | None
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
