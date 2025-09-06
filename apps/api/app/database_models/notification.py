from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Index, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from app.database_models.common import TimestampMixin, UuidPk, StrLen255
from app.core.enums import (
    NotificationKindEnum,
    NotificationStatusEnum,
    NotificationChannelEnum,
    SuppressionReasonEnum,
)
from app.db.base import Base


class Notification(TimestampMixin, Base):
    id: Mapped[UuidPk]
    board_id: Mapped[PGUUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[PGUUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="cascade"), nullable=False
    )
    recipient_id: Mapped[PGUUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="cascade"), nullable=False
    )

    kind: Mapped[NotificationKindEnum] = mapped_column(
        SAEnum(NotificationKindEnum, name="notification_kind_enum", native_enum=True),
        nullable=False,
        default=NotificationKindEnum.BOARD_ACTIVITY_DIGEST,
        comment="Type of notification",
    )

    channel: Mapped[NotificationChannelEnum] = mapped_column(
        SAEnum(
            NotificationChannelEnum, name="notification_channel_enum", native_enum=True
        ),
        nullable=False,
        default=NotificationChannelEnum.EMAIL,
        comment="Channel through which the notification is sent",
    )

    status: Mapped[NotificationStatusEnum] = mapped_column(
        SAEnum(NotificationStatusEnum, name="notification_status_enum", native_enum=True),
        nullable=False,
        default=NotificationStatusEnum.QUEUED,
        comment="Status of the notification for the recipient",
    )

    suppression_reason: Mapped[Optional[SuppressionReasonEnum]] = mapped_column(
        SAEnum(
            SuppressionReasonEnum,
            name="notification_suppression_reason_enum",
            native_enum=True,
        ),
        nullable=True,
        comment="Reason for suppressing the notification",
    )

    subject: Mapped[StrLen255] = mapped_column(nullable=False)
    preview: Mapped[Optional[StrLen255]] = mapped_column(nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    dedupe_key: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)

    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    board = relationship("Board")
    actor = relationship("User", foreign_keys=[actor_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


# Indexes
Index(
    "ix_notification_emails_recipient_created_at",
    Notification.recipient_id,
    Notification.created_at,
)
Index(
    "ix_notification_emails_board_created_at",
    Notification.board_id,
    Notification.created_at,
)
Index(
    "ix_notification_emails_status_created_at",
    Notification.status,
    Notification.created_at,
)
