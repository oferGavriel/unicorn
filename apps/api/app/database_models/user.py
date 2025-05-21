from uuid import UUID, uuid4
from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin
from app.database_models.board import Board
from app.database_models.note import Note
from app.database_models.refresh_token import RefreshToken
from app.database_models.board_member import BoardMember
from app.db.base import Base


class User(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    email: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False, doc="User email address"
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    # relationships
    boards: Mapped[List["Board"]] = relationship(
        "Board", back_populates="owner", cascade="all, delete-orphan"
    )
    notes: Mapped[List["Note"]] = relationship(
        "Note", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    board_memberships: Mapped[List["BoardMember"]] = relationship(
        "BoardMember", back_populates="user", cascade="all, delete-orphan"
    )
