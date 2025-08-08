from typing import TYPE_CHECKING
from uuid import UUID
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin, UuidPk
from app.db.base import Base

if TYPE_CHECKING:
    from app.database_models.user import User


class RefreshToken(TimestampMixin, Base):
    id: Mapped[UuidPk]
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    token: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False, doc="Refresh token string"
    )
    revoked: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, doc="Revoked flag"
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, doc="Expiration timestamp"
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        Index("ix_refresh_tokens_token", "token"),
        Index("ix_refresh_tokens_user_expires", "user_id", "expires_at"),
    )
