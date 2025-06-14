from uuid import UUID
from typing import List, Optional
from datetime import datetime
from pydantic import Field
from pydantic import ConfigDict
from app.api.models.row_model import RowRead
from app.db.base import BaseSchema

DEFAULT_TABLE_COLOR = "#579bfc"


class TableCreate(BaseSchema):
    name: str
    description: Optional[str] = None
    color: Optional[str] = Field(default=DEFAULT_TABLE_COLOR)
    position: Optional[int] = 0


class TableUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    color: Optional[str] = None


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

    model_config = ConfigDict(from_attributes=True)
