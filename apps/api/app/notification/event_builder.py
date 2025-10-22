from __future__ import annotations
from typing import Dict, Optional, Any
from datetime import datetime, timezone

from app.database_models import Row, Table, Board, User
from .schemas import (
    Event,
    Snapshot,
    UserSnapshot,
    BoardContext,
    TableContext,
    FieldDelta,
    EventType,
)


def build_row_event(
    # ruff: noqa: PLR0913
    *,
    etype: EventType,
    row: Row,
    table: Table,
    board: Board,
    actor: User,
    changed: Optional[list[str]] = None,
    old_values: Optional[Dict[str, Any]] = None,
) -> Event:
    board_ctx: BoardContext = {
        "id": str(board.id),
        "name": board.name,
    }

    table_ctx: TableContext = {
        "id": str(table.id),
        "name": table.name,
        "board_id": str(table.board_id),
    }

    actor_snapshot = _user_to_snapshot(actor)

    delta: Dict[str, FieldDelta] = {}
    if changed and old_values:
        delta = _build_delta(row, changed, old_values)

    event: Event = {
        "type": etype,
        "board": board_ctx,
        "table": table_ctx,
        "actor": actor_snapshot,
        "at": _iso_now(),
    }

    if row:
        event["row_id"] = str(row.id)
        event["snapshot"] = row_snapshot(row)

    if changed:
        event["changed"] = changed

    if delta:
        event["delta"] = delta

    return event


def _build_delta(
    row: Row,
    changed: list[str],
    old_values: Dict[str, Any],
) -> Dict[str, FieldDelta]:
    delta: Dict[str, FieldDelta] = {}

    for field in changed:
        old_val = old_values.get(field)
        new_val = getattr(row, field, None)

        from_str = _format_value(old_val)
        to_str = _format_value(new_val)

        field_delta: FieldDelta = {
            "from_value": from_str,
            "to_value": to_str,
        }

        delta[field] = field_delta

    return delta


def _format_value(value: Any) -> str:
    if value is None:
        return ""

    if hasattr(value, "value"):
        return str(value.value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, list):
        return ",".join(str(v) for v in value)

    return str(value)


def _user_to_snapshot(user: User) -> UserSnapshot:
    return {
        "id": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }


def row_snapshot(row: Row) -> Snapshot:
    status = getattr(row.status, "value", str(row.status))
    priority = getattr(row.priority, "value", str(row.priority))

    return {
        "name": row.name,
        "status": status,
        "priority": priority,
        "due_date": row.due_date.isoformat() if row.due_date else None,
    }


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()
