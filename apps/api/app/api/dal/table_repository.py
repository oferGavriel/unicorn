from uuid import UUID
from fastapi import Depends
from typing import List, Optional, Annotated
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload, selectinload

from app.db.database import DBSessionDep
from app.common.repository import BaseRepository
from app.database_models.table import Table
from app.database_models.board_member import BoardMember


class TableRepository(BaseRepository[Table]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Table, Table.id, session)
        self.session = session

    async def list_by_board(self, board_id: UUID) -> List[Table]:
        q = (
            select(Table)
            .where(Table.board_id == board_id, ~Table.is_deleted)
            .options(joinedload(Table.rows))
            .order_by(Table.position)
        )
        res = await self.session.execute(q)
        return list(res.unique().scalars().all())

    async def get(self, table_id: UUID, board_id: UUID) -> Optional[Table]:
        q = (
            select(Table)
            .where(
                Table.id == table_id,
                Table.board_id == board_id,
                ~Table.is_deleted,
            )
            .options(joinedload(Table.rows))
        )
        result = await self.session.execute(q)
        return result.unique().scalar_one_or_none()

    async def get_by_user(self, table_id: UUID, user_id: UUID) -> Optional[Table]:
        q = (
            select(Table)
            .join(BoardMember, Table.board_id == BoardMember.board_id)
            .where(
                Table.id == table_id,
                ~Table.is_deleted,
                BoardMember.user_id == user_id,
            )
            .options(joinedload(Table.rows))
        )
        result = await self.session.execute(q)
        return result.unique().scalar_one_or_none()

    async def create(self, table: Table) -> Table:
        self.session.add(table)
        await self.session.commit()

        q = select(Table).where(Table.id == table.id).options(selectinload(Table.rows))
        result = await self.session.execute(q)
        return result.scalar_one()

    async def update(self, table: Table, data: dict) -> Table:
        return await self.update_entity(table, **data)

    async def soft_delete(self, table_id: UUID, board_id: UUID) -> None:
        await self.session.execute(
            update(Table).where(Table.id == table_id, Table.board_id == board_id).values(is_deleted=True)
        )
        await self.session.commit()


TableRepositoryDep = Annotated[TableRepository, Depends(TableRepository)]
