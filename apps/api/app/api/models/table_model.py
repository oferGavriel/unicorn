from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from app.api.models.row_model import RowRead
from app.db.base import BaseSchema

DEFAULT_TABLE_COLOR = "#579bfc"


class TableCreate(BaseSchema):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    color: Optional[str] = Field(default=DEFAULT_TABLE_COLOR)


class TableUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    position: Optional[int] = Field(None, ge=1, le=10)
    color: Optional[str] = Field(None)


class TableRead(BaseSchema):
    id: UUID = Field(description="Primary key for table")
    board_id: UUID = Field(description="Foreign key for board")
    name: str = Field(description="Table name")
    description: Optional[str] = Field(description="Table description")
    position: int = Field(description="Table order")
    color: str = Field(description="Table color")
    created_at: datetime = Field(description="Table creation date")
    updated_at: datetime = Field(description="Table update date")
    rows: List[RowRead] = Field(description="List of rows in the table")


class UpdateTablePositionRequest(BaseSchema):
    new_position: int = Field(
        ..., ge=1, le=10, description="New position for the table in the board"
    )
