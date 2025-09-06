from typing import Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "cb659aa97802"
down_revision: Union[str, None] = "09f8a0df3cfc"
branch_labels = None
depends_on = None

kind_enum = postgresql.ENUM(
    "BOARD_ACTIVITY_DIGEST",
    name="notification_kind_enum",
    create_type=False,
)
channel_enum = postgresql.ENUM(
    "EMAIL",
    "IN_APP",
    "WEB_PUSH",
    name="notification_channel_enum",
    create_type=False,
)
status_enum = postgresql.ENUM(
    "QUEUED",
    "SENT",
    "FAILED",
    "SUPPRESSED",
    name="notification_status_enum",
    create_type=False,
)
suppress_enum = postgresql.ENUM(
    "RECIPIENT_ACTIVE",
    "PREFERENCES_DISABLED",
    "INVALID_EMAIL",
    "RATE_LIMITED",
    "OTHER",
    name="notification_suppression_reason_enum",
    create_type=False,
)


def upgrade() -> None:
    # 1) Create enum types (if not exist)
    bind = op.get_bind()
    for enum in (kind_enum, channel_enum, status_enum, suppress_enum):
        enum.create(bind, checkfirst=True)

    # 2) Add new columns (use postgres UUID)
    op.add_column(
        "notifications",
        sa.Column(
            "board_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="Board the activity belongs to.",
        ),
    )
    op.add_column(
        "notifications",
        sa.Column(
            "actor_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="User who performed the summarized actions.",
        ),
    )
    op.add_column(
        "notifications",
        sa.Column(
            "recipient_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            comment="User who received or would have received this email.",
        ),
    )

    op.add_column(
        "notifications",
        sa.Column(
            "kind",
            kind_enum,
            nullable=False,
            comment="Semantic category of the notification (e.g., board activity digest)",
        ),
    )
    op.add_column(
        "notifications",
        sa.Column(
            "channel", channel_enum, nullable=False, comment="Delivery channel used."
        ),
    )
    op.add_column(
        "notifications",
        sa.Column(
            "status",
            status_enum,
            nullable=False,
            comment="Delivery status for this recipient.",
        ),
    )
    op.add_column(
        "notifications",
        sa.Column(
            "suppression_reason",
            suppress_enum,
            nullable=True,
            comment="If suppressed, the reason (e.g., recipient_active).",
        ),
    )

    op.add_column(
        "notifications", sa.Column("subject", sa.String(length=255), nullable=False)
    )
    op.add_column(
        "notifications", sa.Column("preview", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "notifications",
        sa.Column(
            "dedupe_key",
            sa.String(length=255),
            nullable=True,
            comment="Idempotency key per (board, actor, recipient, window).",
        ),
    )
    op.add_column(
        "notifications", sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.alter_column(
        "notifications",
        "payload",
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_nullable=False,
    )

    op.create_unique_constraint(
        "uq_notifications_dedupe_key",
        "notifications",
        ["dedupe_key"],
    )
    op.create_index(
        "ix_notifications_recipient_created_at",
        "notifications",
        ["recipient_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_board_created_at",
        "notifications",
        ["board_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_notifications_status_created_at",
        "notifications",
        ["status", "created_at"],
        unique=False,
    )

    op.drop_constraint(
        op.f("notifications_row_id_fkey"), "notifications", type_="foreignkey"
    )
    op.create_foreign_key(
        "fk_notifications_actor",
        "notifications",
        "users",
        ["actor_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_notifications_recipient",
        "notifications",
        "users",
        ["recipient_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_notifications_board",
        "notifications",
        "boards",
        ["board_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_column("notifications", "row_id")
    op.drop_column("notifications", "type")

    op.add_column(
        "users", sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("users", "last_seen_at")

    op.add_column("notifications", sa.Column("type", sa.VARCHAR(), nullable=False))
    op.add_column(
        "notifications",
        sa.Column("row_id", postgresql.UUID(as_uuid=True), nullable=False),
    )

    op.drop_constraint("fk_notifications_board", "notifications", type_="foreignkey")
    op.drop_constraint("fk_notifications_recipient", "notifications", type_="foreignkey")
    op.drop_constraint("fk_notifications_actor", "notifications", type_="foreignkey")
    op.create_foreign_key(
        op.f("notifications_row_id_fkey"), "notifications", "rows", ["row_id"], ["id"]
    )

    op.drop_constraint("uq_notifications_dedupe_key", "notifications", type_="unique")
    op.drop_index("ix_notifications_status_created_at", table_name="notifications")
    op.drop_index("ix_notifications_board_created_at", table_name="notifications")
    op.drop_index("ix_notifications_recipient_created_at", table_name="notifications")

    op.alter_column(
        "notifications",
        "payload",
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_nullable=False,
    )

    op.drop_column("notifications", "sent_at")
    op.drop_column("notifications", "dedupe_key")
    op.drop_column("notifications", "preview")
    op.drop_column("notifications", "subject")
    op.drop_column("notifications", "suppression_reason")
    op.drop_column("notifications", "status")
    op.drop_column("notifications", "channel")
    op.drop_column("notifications", "kind")
    op.drop_column("notifications", "recipient_id")
    op.drop_column("notifications", "actor_id")
    op.drop_column("notifications", "board_id")

    bind = op.get_bind()
    for enum in (suppress_enum, status_enum, channel_enum, kind_enum):
        enum.drop(bind, checkfirst=True)
