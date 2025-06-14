from uuid import UUID
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin, UuidPk, StrLen50, StrLen1K
from app.db.base import Base

# TODO: check if we need it
if TYPE_CHECKING:
    from app.database_models.user import User
    from app.database_models.table import Table
    from app.database_models.board_member import BoardMember


class Board(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UuidPk]
    name: Mapped[StrLen50] = mapped_column(nullable=False)
    description: Mapped[Optional[StrLen1K]] = mapped_column(nullable=True)
    owner_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    owner: Mapped["User"] = relationship("User", back_populates="boards")
    tables: Mapped[List["Table"]] = relationship("Table", back_populates="board", cascade="all, delete-orphan")
    members: Mapped[List["BoardMember"]] = relationship("BoardMember", back_populates="board", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_boards_user_order", "owner_id", "order"),)
