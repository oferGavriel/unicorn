import json
import time
from typing import Iterable

import redis.asyncio as redis

from app.notification.schemas import Event
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logger import logger
from app.core.config import get_settings

DUE_ZSET = "notif:due"


async def emit_activity(
    db: AsyncSession,
    redis_client: redis.Redis,
    board_id: str,
    actor_id: str,
    events: Iterable[Event],
) -> None:
    settings = get_settings()
    payloads = _serialize_events(events)

    recipients = await _eligible_recipients_for_board(db, board_id, actor_id)
    if not recipients:
        logger.info(
            "notif.skip_no_recipients",
            extra={"board_id": board_id, "actor_id": actor_id},
        )
        return

    expiry_ms = _expiry_ms(settings.notif_window_seconds)

    pipe = redis_client.pipeline(transaction=False)
    for rid in recipients:
        gk = _group_key(board_id, actor_id, rid)

        for p in payloads:
            pipe.rpush(gk, p)

        pipe.zadd(DUE_ZSET, {gk: expiry_ms})

    await pipe.execute()

    logger.info(
        "notif.emit_ok",
        extra={
            "board_id": board_id,
            "actor_id": actor_id,
            "recipients": len(recipients),
            "events": len(payloads),
            "expiry_ms": expiry_ms,
        },
    )


def _serialize_events(events: Iterable[Event]) -> list[str]:
    out: list[str] = []
    for e in events:
        out.append(json.dumps(e, ensure_ascii=False))
    return out


def _group_key(board_id: str, actor_id: str, recipient_id: str) -> str:
    return f"notif:{board_id}:{actor_id}:{recipient_id}"


def _expiry_ms(window_sec: int) -> int:
    return int(time.time() * 1000) + (window_sec * 1000)


async def _eligible_recipients_for_board(
    db: AsyncSession, board_id: str, actor_id: str
) -> list[str]:
    settings = get_settings()
    if settings.notif_suppress_minutes == 0:
        rows = await db.execute(
            text("""
            SELECT bm.user_id
            FROM boardmembers bm
            WHERE bm.board_id = :b
              AND bm.user_id <> :a
          """),
            {"b": board_id, "a": actor_id},
        )
    else:
        threshold_timestamp = int(time.time()) - settings.notif_suppress_seconds
        rows = await db.execute(
            text("""
            SELECT bm.user_id
            FROM boardmembers bm
            JOIN users u ON bm.user_id = u.id
            WHERE bm.board_id = :b
              AND bm.user_id <> :a
              AND (u.last_seen_at IS NULL
              OR EXTRACT(EPOCH FROM u.last_seen_at) < :threshold)
          """),
            {"b": board_id, "a": actor_id, "threshold": threshold_timestamp},
        )

    return [str(r[0]) for r in rows.fetchall()]
