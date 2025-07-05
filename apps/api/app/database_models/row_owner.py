from uuid import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from sqlalchemy.dialects.postgresql import UUID as PGUUID


class RowOwner(Base):
    __tablename__ = "row_owners"
    row_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("rows.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
