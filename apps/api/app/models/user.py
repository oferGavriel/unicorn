import uuid
from sqlalchemy import text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from uuid import UUID as UUIDType

from db.base import Base

def now_naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "user"

    id: Mapped[UUIDType] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
