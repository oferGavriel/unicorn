from uuid import UUID, uuid4
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Integer, Text, Index, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from enum import Enum as PyEnum
from app.database_models.common import TimestampMixin, SoftDeleteMixin
from app.database_models.row import Row
from app.database_models.board import Board
from app.db.base import Base


class TableColorEnum(str, PyEnum):
    RED = "#ff5733"
    ORANGE = "#ff8c00"
    YELLOW = "#ffd700"
    GREEN = "#32cd32"
    BLUE = "#1e90ff"
    PURPLE = "#9370db"
    PINK = "#ff69b4"
    CYAN = "#00ced1"
    LIME = "#00ff00"
    MAGENTA = "#ff00ff"
    BROWN = "#8b4513"
    GRAY = "#808080"
    BLACK = "#000000"
    WHITE = "#ffffff"
    DEFAULT = "#6b7280"


class Table(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    board_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[TableColorEnum] = mapped_column(SQLEnum(TableColorEnum), default=TableColorEnum.DEFAULT)
    position: Mapped[int] = mapped_column(Integer, default=0)

    # relationships
    board: Mapped["Board"] = relationship("Board", back_populates="tables")
    rows: Mapped[List["Row"]] = relationship("Row", back_populates="table", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_tables_board_position", "board_id", "position"),)
