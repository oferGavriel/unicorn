from typing import Annotated, Iterable
from app.core.logger import logger
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import RedisDep
from app.notification.schemas import Event
from app.notification.emitter import emit_activity
from app.notification.event_builder import build_row_event
from app.database_models import Row, Table, Board, User


class NotificationService:
    def __init__(self, redis_client: RedisDep):
        self.redis_client = redis_client

    async def emit_row_created(
        # ruff: noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        board: Board,
        actor: User,
    ) -> None:
        event = build_row_event(
            etype="RowCreated",
            row=row,
            table=table,
            board=board,
            actor=actor,
        )

        await self._emit_events(
            db=db,
            board_id=str(board.id),
            actor_id=str(actor.id),
            events=[event],
        )

    async def emit_row_updated(
        # ruff: noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        board: Board,
        actor: User,
        changed_fields: list[str],
        old_values: dict,
    ) -> None:
        event = build_row_event(
            etype="RowUpdated",
            row=row,
            table=table,
            board=board,
            actor=actor,
            changed=changed_fields,
            old_values=old_values,
        )

        await self._emit_events(
            db=db,
            board_id=str(board.id),
            actor_id=str(actor.id),
            events=[event],
        )

    async def emit_row_deleted(
        # ruff: noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        board: Board,
        actor: User,
    ) -> None:
        event = build_row_event(
            etype="RowDeleted",
            row=row,
            table=table,
            board=board,
            actor=actor,
        )

        await self._emit_events(
            db=db,
            board_id=str(board.id),
            actor_id=str(actor.id),
            events=[event],
        )

    async def _emit_events(
        # ruff: noqa: PLR0913
        self,
        db: AsyncSession,
        board_id: str,
        actor_id: str,
        events: Iterable[Event],
    ) -> None:
        await emit_activity(
            db=db,
            redis_client=self.redis_client,
            board_id=board_id,
            actor_id=actor_id,
            events=events,
        )

        logger.info(
            "notif.emit_events",
            extra={
                "board_id": board_id,
                "actor_id": actor_id,
                "event_count": len(list(events)),
            },
        )


NotificationServiceDep = Annotated[NotificationService, Depends(NotificationService)]
