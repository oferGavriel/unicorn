from uuid import UUID
from typing import List, Optional
from sqlalchemy import ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import (
    TimestampMixin,
    SoftDeleteMixin,
    UuidPk,
    StrLen10,
    StrLen50,
    StrLen1K,
)
from app.database_models.row import Row
from app.database_models.board import Board
from app.api.models.table_model import DEFAULT_TABLE_COLOR
from app.db.base import Base


class Table(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UuidPk]
    board_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("boards.id"), nullable=False
    )
    name: Mapped[StrLen50] = mapped_column()
    description: Mapped[Optional[StrLen1K]] = mapped_column(nullable=True)
    color: Mapped[StrLen10] = mapped_column(default=DEFAULT_TABLE_COLOR)
    position: Mapped[int] = mapped_column(Integer, default=0)

    # relationships
    board: Mapped["Board"] = relationship("Board", back_populates="tables")
    rows: Mapped[List["Row"]] = relationship(
        "Row", back_populates="table", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_tables_board_position", "board_id", "position"),)
