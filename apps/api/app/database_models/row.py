from uuid import UUID, uuid4
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import (
    String,
    ForeignKey,
    Integer,
    Index,
    DateTime,
    ARRAY,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, SoftDeleteMixin
from app.db.base import Base
from sqlalchemy.dialects.postgresql import ENUM

if TYPE_CHECKING:
    from app.database_models.table import Table
    from app.database_models.note import Note
    from app.database_models.notification import Notification


class Row(TimestampMixin, SoftDeleteMixin, Base):
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    table_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tables.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(500))
    owners: Mapped[List[UUID]] = mapped_column(ARRAY(PGUUID(as_uuid=True)), default=list)
    status: Mapped[str] = mapped_column(
        ENUM('not_started', 'stuck', 'working_on_it', 'done', name='statusenum', create_type=False), default='stuck'
    )
    priority: Mapped[str] = mapped_column(
        ENUM('low', 'medium', 'high', 'critical', name='priorityenum', create_type=False), default='medium'
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    # relationships
    table: Mapped["Table"] = relationship("Table", back_populates="rows")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="row")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="row", cascade="all, delete-orphan"
    )
    __table_args__ = (Index("ix_rows_table_position", "table_id", "position"),)
