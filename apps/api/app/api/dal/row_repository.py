from uuid import UUID
from typing import List, Optional, Annotated
from fastapi import Depends
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from app.database_models.row import Row
from app.common.repository import BaseRepository
from app.core.database import DBSessionDep


class RowRepository(BaseRepository[Row]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Row, Row.id, session)
        self.session = session

    async def list_by_table(self, table_id: UUID) -> List[Row]:
        stmt = (
            select(Row)
            .options(selectinload(Row.owner_users))
            .where(Row.table_id == table_id)
            .order_by(Row.position.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.unique().scalars().all())

    async def get(self, row_id: UUID, table_id: UUID) -> Optional[Row]:
        q = (
            select(Row)
            .options(selectinload(Row.owner_users))
            .where(Row.id == row_id, Row.table_id == table_id)
            .order_by(Row.position.asc())
        )
        result = await self.session.execute(q)
        row: Optional[Row] = result.scalar_one_or_none()
        return row

    async def create(self, row: Row) -> Row:
        if row.position > 0:
            max_position = (
                await self.session.execute(
                    select(func.max(Row.position)).where(Row.table_id == row.table_id)
                )
            ).scalar_one() or 0
            row.position = max_position + 1
        else:
            await self.session.execute(
                update(Row)
                .where(Row.table_id == row.table_id, Row.position >= row.position)
                .values(position=Row.position + 1)
            )

        self.session.add(row)
        await self.session.commit()

        q = select(Row).options(selectinload(Row.owner_users)).where(Row.id == row.id)
        result = await self.session.execute(q)
        created_row: Row = result.scalar_one()
        return created_row

    async def update(self, row: Row, data: dict) -> Row:
        updated_row = await self.update_entity(row, **data)

        q = (
            select(Row)
            .options(selectinload(Row.owner_users))
            .where(Row.id == updated_row.id)
        )
        result = await self.session.execute(q)
        updated_row_full: Row = result.scalar_one()
        return updated_row_full

    async def delete(self, row_id: UUID, table_id: UUID) -> None:
        row = await self.get(row_id, table_id)
        if not row:
            return

        await self.session.delete(row)
        await self.session.commit()


RowRepositoryDep = Annotated[RowRepository, Depends(RowRepository)]
