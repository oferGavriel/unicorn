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
