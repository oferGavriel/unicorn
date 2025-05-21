from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin
from app.db.base import Base

if TYPE_CHECKING:
    from app.database_models.user import User
    from app.database_models.row import Row


class Note(TimestampMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    row_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("rows.id"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    row: Mapped["Row"] = relationship("Row", back_populates="notes")
    user: Mapped["User"] = relationship("User", back_populates="notes")

    __table_args__ = (Index("ix_notes_row_created", "row_id", "created_at"),)
