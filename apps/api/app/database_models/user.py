from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database_models.common import TimestampMixin, SoftDeleteMixin, UuidPk, StrLen50
from app.db.base import Base

if TYPE_CHECKING:
    from app.database_models.board import Board
    from app.database_models.note import Note
    from app.database_models.refresh_token import RefreshToken
    from app.database_models.board_member import BoardMember
    from app.database_models.row import Row


class User(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UuidPk]
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    first_name: Mapped[StrLen50] = mapped_column(nullable=False)
    last_name: Mapped[StrLen50] = mapped_column(nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True, default=None)

    # relationships
    boards: Mapped[List["Board"]] = relationship("Board", back_populates="owner", cascade="all, delete-orphan")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    board_memberships: Mapped[List["BoardMember"]] = relationship(
        "BoardMember", back_populates="user", cascade="all, delete-orphan"
    )
    owned_rows: Mapped[List["Row"]] = relationship(
        "Row", secondary="row_owners", back_populates="owner_users", lazy="select"
    )
