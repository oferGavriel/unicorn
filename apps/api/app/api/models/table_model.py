from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from pydantic import ConfigDict
from app.api.models.row_model import RowRead
from app.db.base import BaseSchema


class TableCreate(BaseSchema):
    name: str
    description: Optional[str] = None


class TableUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    version: int


class TableRead(BaseSchema):
    id: UUID = Field(description="Primary key for table")
    board_id: UUID = Field(description="Foreign key for board")
    name: str = Field(description="Table name")
    description: Optional[str] = Field(description="Table description")
    order: int = Field(description="Table order")
    version: int = Field(description="Table version")
    created_at: datetime = Field(description="Table creation date")
    updated_at: datetime = Field(description="Table update date")
    rows: List[RowRead] = Field(description="List of rows in the table")

    model_config = ConfigDict(from_attributes=True)
