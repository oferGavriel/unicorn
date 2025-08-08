from uuid import UUID
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import ForeignKey, Integer, Index, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database_models.common import TimestampMixin, UuidPk, StrLen255
from app.db.base import Base
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.core.enums import StatusEnum, PriorityEnum

if TYPE_CHECKING:
    from app.database_models.table import Table
    from app.database_models.note import Note
    from app.database_models.notification import Notification
    from app.database_models.user import User


class Row(TimestampMixin, Base):
    id: Mapped[UuidPk]
    table_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("tables.id"), nullable=False
    )

    name: Mapped[StrLen255] = mapped_column(nullable=False)
    status: Mapped[StatusEnum] = mapped_column(
        Enum(
            StatusEnum, name="statusenum", create_constraint=True, validate_strings=True
        ),
        default=StatusEnum.NOT_STARTED,
    )
    priority: Mapped[PriorityEnum] = mapped_column(
        Enum(
            PriorityEnum,
            name="priorityenum",
            create_constraint=True,
            validate_strings=True,
        ),
        default=PriorityEnum.MEDIUM,
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    position: Mapped[int] = mapped_column(Integer, default=0)

    # relationships
    owner_users: Mapped[List["User"]] = relationship(
        "User", secondary="row_owners", back_populates="owned_rows", lazy="select"
    )
    table: Mapped["Table"] = relationship("Table", back_populates="rows")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="row")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="row", cascade="all, delete-orphan"
    )
    __table_args__ = (Index("ix_rows_table_position", "table_id", "position"),)
