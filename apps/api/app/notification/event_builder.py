from __future__ import annotations
from typing import Dict, Optional, Any
from datetime import datetime, timezone

from app.database_models import Row, Table
from .schemas import Event, Snapshot


def build_row_event(  # noqa: PLR0913
    *,
    etype: str,
    row: Row,
    table: Table,
    actor_id: str,
    actor_name: str,
    changed: Optional[list[str]] = None,
    old_values: Optional[Dict[str, Any]] = None,
) -> Event:
    delta = {}
    if changed and old_values:
        for field in changed:
            old_val = old_values.get(field)
            new_val = getattr(row, field, None)

            # Handle enum values
            if old_val is not None and hasattr(old_val, "value"):
                old_val = old_val.value
            if new_val is not None and hasattr(new_val, "value"):
                new_val = new_val.value

            # Handle datetime values
            if isinstance(old_val, datetime):
                old_val = old_val.isoformat() if old_val else None
            if isinstance(new_val, datetime):
                new_val = new_val.isoformat() if new_val else None

            delta[field] = {
                "from": str(old_val) if old_val is not None else None,
                "to": str(new_val) if new_val is not None else None
            }


    return {
        "type": etype,  # type: ignore  # mypy: ignore incompatible type
        "board_id": str(table.board_id),
        "table_id": str(table.id),
        "table_name": table.name,
        "row_id": str(row.id),
        "actor_id": str(actor_id),
        "actor_name": actor_name,
        "at": _iso_now(),
        "snapshot": row_snapshot(row) if row else {},
        "changed": changed or [],
        "delta": {
          k: {
            "from": v["from"] or "",
            "to": v["to"] or ""
          }
          for k, v in delta.items()
        },
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
