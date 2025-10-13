from typing import Annotated, Iterable
from app.core.logger import logger
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import RedisDep
from app.notification.schemas import Event
from app.notification.emitter import emit_activity
from app.notification.event_builder import build_row_event
from app.database_models import Row, Table


class NotificationService:
    def __init__(self, redis_client: RedisDep):
        self.redis_client = redis_client

    async def emit_row_created(  # noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        actor_id: str,
        actor_name: str,
    ) -> None:
        """Emit notification for row creation"""
        event = build_row_event(
            etype="RowCreated",
            row=row,
            table=table,
            actor_id=actor_id,
            actor_name=actor_name,
        )

        await self._emit_events(db, str(table.board_id), actor_id, actor_name, [event])

    async def emit_row_updated( # noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        actor_id: str,
        actor_name: str,
        changed_fields: list[str],
        old_values: dict,
    ) -> None:
        """Emit notification for row update"""
        event = build_row_event(
            etype="RowUpdated",
            row=row,
            table=table,
            actor_id=actor_id,
            actor_name=actor_name,
            changed=changed_fields,
            old_values=old_values,
        )

        await self._emit_events(db, str(table.board_id), actor_id, actor_name, [event])

    async def emit_row_deleted( # noqa: PLR0913
        self,
        db: AsyncSession,
        row: Row,
        table: Table,
        actor_id: str,
        actor_name: str,
    ) -> None:
        """Emit notification for row deletion"""
        event = build_row_event(
            etype="RowDeleted",
            row=row,
            table=table,
            actor_id=actor_id,
            actor_name=actor_name,
        )

        await self._emit_events(db, str(table.board_id), actor_id, actor_name, [event])


    async def _emit_events( # noqa: PLR0913
        self,
        db: AsyncSession,
        board_id: str,
        actor_id: str,
        actor_name: str,
        events: Iterable[Event],
    ) -> None:
        await emit_activity(
            db=db,
            redis_client=self.redis_client,
            board_id=board_id,
            actor_id=actor_id,
            actor_name=actor_name,
            events=events,
        )
        logger.info(
            "notif.emit_events",
            extra={
                "board_id": board_id,
                "actor_id": actor_id,
                "events": sum(1 for _ in events),
            },
        )


NotificationServiceDep = Annotated[NotificationService, Depends(NotificationService)]
