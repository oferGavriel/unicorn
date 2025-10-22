from typing import Literal, TypedDict, NotRequired, Dict

EventType = Literal[
    "RowCreated",
    "RowUpdated",
    "RowDeleted",
    "TableCreated",
    "TableUpdated",
    "TableDeleted",
]


class UserSnapshot(TypedDict):
    id: str
    first_name: str
    last_name: str
    email: str


class BoardContext(TypedDict):
    id: str
    name: str


class TableContext(TypedDict):
    id: str
    name: str
    board_id: str


class Snapshot(TypedDict, total=False):
    name: str
    status: str
    priority: str
    due_date: str | None


class FieldDelta(TypedDict):
    from_value: str
    to_value: str


class Event(TypedDict):
    type: EventType
    board: BoardContext
    table: TableContext
    actor: UserSnapshot
    at: str
    row_id: NotRequired[str]
    snapshot: NotRequired[Snapshot]
    changed: NotRequired[list[str]]
    delta: NotRequired[Dict[str, FieldDelta]]
