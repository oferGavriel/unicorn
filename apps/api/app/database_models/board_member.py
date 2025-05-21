from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database_models.common import TimestampMixin
from app.db.base import Base
from app.core.enums import RoleEnum

if TYPE_CHECKING:
    from app.database_models.user import User
    from app.database_models.board import Board


class BoardMember(TimestampMixin, Base):
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    board_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("boards.id"), nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    role: Mapped[RoleEnum] = mapped_column(
        SQLEnum(RoleEnum), default=RoleEnum.member, nullable=False
    )

    board: Mapped["Board"] = relationship("Board", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="board_memberships")
