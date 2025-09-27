from enum import Enum


class StatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    STUCK = "stuck"
    WORKING_ON_IT = "working_on_it"
    DONE = "done"


class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RoleEnum(str, Enum):
    owner = "owner"
    member = "member"


class NotificationChannelEnum(str, Enum):
    EMAIL = "email"
    IN_APP = "in_app"
    WEB_PUSH = "web_push"


class NotificationStatusEnum(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    SUPPRESSED = "suppressed"


class SuppressionReasonEnum(str, Enum):
    RECIPIENT_ACTIVE = "recipient_active"
    PREFERENCES_DISABLED = "preferences_disabled"
    INVALID_EMAIL = "invalid_email"
    RATE_LIMITED = "rate_limited"
    OTHER = "other"


class NotificationKindEnum(str, Enum):
    BOARD_ACTIVITY_DIGEST = "board_activity_digest"
    WELCOME = "welcome"
    BOARD_INVITATION = "board_invitation"
    ROW_ASSIGNMENT = "row_assignment"
    DEADLINE_REMINDER = "deadline_reminder"
