from enum import Enum


class StatusEnum(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class RoleEnum(str, Enum):
    owner = "owner"
    member = "member"
