from typing import Literal, TypedDict, NotRequired, Dict

EventType = Literal[
    "RowCreated",
    "RowUpdated",
    "RowDeleted",
    "TableCreated",
    "TableUpdated",
    "TableDeleted"
]

class Snapshot(TypedDict, total=False):
    name: str
    status: str
    priority: str
    due_date: str | None

class Event(TypedDict):
    type: EventType
    board_id: str
    table_id: str | None
    row_id: str | None
    actor_id: str
    actor_name: str
    at: str  # ISO format datetime
    snapshot: NotRequired[Snapshot]
    changed: NotRequired[list[str]]
    delta: Dict[str, Dict[str, str]]  # example -> {"name": {"from": "Old", "to": "New"}}
