from uuid import UUID
from datetime import datetime
from pydantic import Field, ConfigDict
from app.core.enums import StatusEnum, PriorityEnum
from app.db.base import BaseSchema


class RowCreate(BaseSchema):
    name: str
    position: int = Field(default=0)


class RowUpdate(BaseSchema):
    name: str | None = None
    owners: list[UUID] | None = None
    status: StatusEnum | None = None
    priority: PriorityEnum | None = None
    due_date: datetime | None = None
    position: int | None = None


class RowRead(BaseSchema):
    id: UUID
    table_id: UUID
    name: str
    owners: list[UUID]
    status: StatusEnum
    priority: PriorityEnum
    due_date: datetime | None
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
