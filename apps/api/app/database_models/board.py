from uuid import UUID, uuid4
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Integer, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin
from app.db.base import Base

# TODO: check if we need it
if TYPE_CHECKING:
    from app.database_models.user import User
    from app.database_models.table import Table
    from app.database_models.board_member import BoardMember


class Board(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    owner_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    owner: Mapped["User"] = relationship("User", back_populates="boards")
    tables: Mapped[List["Table"]] = relationship(
        "Table", back_populates="board", cascade="all, delete-orphan"
    )
    members: Mapped[List["BoardMember"]] = relationship(
        "BoardMember", back_populates="board", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_boards_user_order", "owner_id", "order"),)
