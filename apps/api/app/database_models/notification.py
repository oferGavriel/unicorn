from uuid import UUID, uuid4
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin
from app.database_models.row import Row
from app.db.base import Base


class Notification(TimestampMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    row_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("rows.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON)

    row: Mapped["Row"] = relationship("Row", back_populates="notifications")
