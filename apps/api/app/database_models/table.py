from uuid import UUID, uuid4
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Integer, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin, VersionedMixin
from app.database_models.row import Row
from app.database_models.board import Board
from app.db.base import Base


class Table(VersionedMixin, TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    board_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("boards.id"), nullable=False
    )
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    board: Mapped["Board"] = relationship("Board", back_populates="tables")
    rows: Mapped[List["Row"]] = relationship(
        "Row", back_populates="table", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_tables_board_order", "board_id", "order"),)
