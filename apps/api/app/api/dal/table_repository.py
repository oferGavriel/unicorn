from uuid import UUID
from fastapi import Depends
from typing import List, Optional, Annotated
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app.core.database import DBSessionDep
from app.common.repository import BaseRepository
from app.database_models.table import Table
from app.database_models.row import Row
from app.database_models.board_member import BoardMember


class TableRepository(BaseRepository[Table]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Table, Table.id, session)
        self.session = session

    async def list_by_board(self, board_id: UUID) -> List[Table]:
        q = (
            select(Table)
            .where(Table.board_id == board_id)
            .options(selectinload(Table.rows).selectinload(Row.owner_users))
            .order_by(Table.position)
        )
        res = await self.session.execute(q)
        return list(res.unique().scalars().all())

    async def get(self, table_id: UUID, board_id: UUID) -> Optional[Table]:
        q = (
            select(Table)
            .where(Table.id == table_id, Table.board_id == board_id)
            .options(joinedload(Table.rows).selectinload(Row.owner_users))
        )
        result = await self.session.execute(q)
        table: Optional[Table] = result.unique().scalar_one_or_none()
        return table

    async def get_by_user(self, table_id: UUID, user_id: UUID) -> Optional[Table]:
        q = (
            select(Table)
            .join(BoardMember, Table.board_id == BoardMember.board_id)
            .where(
                Table.id == table_id,
                BoardMember.user_id == user_id,
            )
            .options(joinedload(Table.rows))
        )
        result = await self.session.execute(q)
        table: Optional[Table] = result.unique().scalar_one_or_none()
        return table

    async def create(self, table: Table) -> Table:
        self.session.add(table)
        await self.session.commit()

        q = select(Table).where(Table.id == table.id).options(selectinload(Table.rows))
        result = await self.session.execute(q)
        created_table: Table = result.scalar_one()
        return created_table

    async def update(self, table: Table, data: dict) -> Table:
        return await self.update_entity(table, **data)

    async def delete(self, table_id: UUID, board_id: UUID) -> None:
        table = await self.get(table_id, board_id)
        if not table:
            return
        await self.session.delete(table)
        await self.session.commit()


TableRepositoryDep = Annotated[TableRepository, Depends(TableRepository)]
