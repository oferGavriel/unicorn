from uuid import uuid4, UUID
from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.errors.exceptions import NotFoundError
from app.database_models import Table
from .base_duplication_service import BaseDuplicationService
from .row_duplication_service import RowDuplicationService


class TableDuplicationService(BaseDuplicationService[Table]):
    def __init__(
        self, session: AsyncSession, row_duplication_service: RowDuplicationService
    ):
        super().__init__(session)
        self.row_duplication_service = row_duplication_service

    async def duplicate(self, source_id: UUID, context: Dict[str, Any]) -> Table:
        target_board_id = context.get("target_board_id")
        user_id = context["user_id"]
        include_rows = context.get("include_rows", True)

        source_table = context.get("source_table")
        if not source_table:
            source_table = await self._get_source_table(source_id)

        final_board_id = target_board_id or source_table.board_id
        is_same_board = final_board_id == source_table.board_id

        if is_same_board:
            new_position = await self._get_next_position_with_shift(
                model_class=Table,
                owner_field_name="board_id",
                owner_id=final_board_id,
                source_position=source_table.position,
            )
        else:
            new_position = (
                await self._get_max_position(Table, "board_id", final_board_id) + 1
            )

        new_table = Table(
            id=uuid4(),
            board_id=final_board_id,
            name=source_table.name,
            description=source_table.description,
            color=source_table.color,
            position=new_position,
        )

        self.session.add(new_table)
        await self.session.flush()

        if include_rows:
            await self._duplicate_rows(source_table, new_table.id, user_id)

        return new_table

    async def _get_source_table(self, table_id: UUID) -> Table:
        stmt = (
            select(Table)
            .where(Table.id == table_id)
            .options(selectinload(Table.rows))
            .order_by(Table.position)
        )
        result = await self.session.execute(stmt)
        table = result.scalar_one_or_none()

        if not table:
            raise NotFoundError(f"Table with ID {table_id} not found")

        return table

    async def _duplicate_rows(
        self, source_table: Table, new_table_id: UUID, user_id: UUID
    ) -> None:
        for row in sorted(source_table.rows, key=lambda r: r.position):
            if row.is_deleted:
                continue

            await self.row_duplication_service.duplicate(
                source_id=row.id,
                context={
                    "user_id": user_id,
                    "target_table_id": new_table_id,
                },
            )
