from uuid import uuid4, UUID
from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database_models import Row
from app.database_models.row_owner import RowOwner
from app.common.errors.exceptions import NotFoundError
from .base_duplication_service import BaseDuplicationService


class RowDuplicationService(BaseDuplicationService[Row]):

    async def duplicate(self, source_id: UUID, context: Dict[str, Any]) -> Row:
        target_table_id = context.get('target_table_id')
        # user_id = context['user_id']

        source_row = await self._get_source_row(source_id)

        final_table_id = target_table_id or source_row.table_id
        is_same_table = final_table_id == source_row.table_id

        if is_same_table:
            new_position = await self._get_next_position_with_shift(
                model_class=Row, owner_field_name='table_id', owner_id=final_table_id, source_position=source_row.position
            )
        else:
            new_position = await self._get_max_position(Row, 'table_id', final_table_id) + 1

        new_row = Row(
            id=uuid4(),
            table_id=final_table_id,
            name=source_row.name,
            status=source_row.status,
            priority=source_row.priority,
            due_date=source_row.due_date,
            position=new_position,
        )

        self.session.add(new_row)
        await self.session.flush()

        await self._duplicate_owners(source_row, new_row.id)

        return new_row

    async def _get_source_row(self, row_id: UUID) -> Row:
        stmt = select(Row).where(Row.id == row_id).options(selectinload(Row.owner_users)).order_by(Row.position)
        result = await self.session.execute(stmt)
        row = result.scalar_one_or_none()

        if not row:
            raise NotFoundError(f"Row with ID {row_id} not found")

        return row

    async def _duplicate_owners(self, source_row: Row, new_row_id: UUID) -> None:
        if not source_row.owner_users:
            return

        owner_records = [RowOwner(row_id=new_row_id, user_id=owner.id) for owner in source_row.owner_users]

        self.session.add_all(owner_records)
