from uuid import UUID, uuid4
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import (
    String,
    ForeignKey,
    Integer,
    Text,
    Index,
    Enum as SAEnum,
    DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin
from app.core.enums import StatusEnum, PriorityEnum
from app.db.base import Base

if TYPE_CHECKING:
    from app.database_models.user import User
    from app.database_models.table import Table
    from app.database_models.notification import Notification
    from app.database_models.note import Note


class Row(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    table_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("tables.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[StatusEnum] = mapped_column(
        SAEnum(StatusEnum), default=StatusEnum.todo, nullable=False
    )
    priority: Mapped[PriorityEnum] = mapped_column(
        SAEnum(PriorityEnum), default=PriorityEnum.medium, nullable=False
    )
    assignee_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id")
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # relationships
    table: Mapped["Table"] = relationship("Table", back_populates="rows")
    assignee: Mapped["User"] = relationship("User")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="row", cascade="all, delete-orphan"
    )
    notes: Mapped[List["Note"]] = relationship(
        "Note", back_populates="row", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_rows_table_order", "table_id", "order"),)
