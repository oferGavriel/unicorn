from uuid import UUID
from typing import List, Optional, Annotated
from fastapi import Depends
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from app.database_models.row import Row
from app.common.repository import BaseRepository
from app.db.database import DBSessionDep


class RowRepository(BaseRepository[Row]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Row, Row.id, session)
        self.session = session

    async def list_by_table(self, table_id: UUID) -> List[Row]:
        stmt = (
            select(Row).options(selectinload(Row.owner_users)).where(Row.table_id == table_id).order_by(Row.position.asc())
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
        return (await self.session.execute(q)).scalar_one_or_none()

    async def create(self, row: Row) -> Row:
        if row.position > 0:
            max_position = (
                await self.session.execute(select(func.max(Row.position)).where(Row.table_id == row.table_id))
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
        return result.scalar_one()

    async def update(self, row: Row, data: dict) -> Row:

        return await self.update_entity(row, **data)

    async def delete(self, row_id: UUID, table_id: UUID) -> None:
        row = await self.get(row_id, table_id)
        if not row:
            return

        await self.session.delete(row)
        await self.session.commit()


RowRepositoryDep = Annotated[RowRepository, Depends(RowRepository)]
