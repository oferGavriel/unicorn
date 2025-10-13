from uuid import UUID
from typing import Annotated
from fastapi import Depends
from sqlalchemy import insert, delete
from app.database_models.row import Row
from app.database_models.row_owner import RowOwner
from app.common.repository import BaseRepository
from app.core.database import DBSessionDep


class RowOwnerRepository(BaseRepository[Row]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Row, Row.id, session)
        self.session = session

    async def add(self, row_id: UUID, user_id: UUID) -> None:
        await self.session.execute(
            insert(RowOwner).values(row_id=row_id, user_id=user_id)
        )

    async def remove(self, row_id: UUID, user_id: UUID) -> None:
        await self.session.execute(
            delete(RowOwner).where(RowOwner.row_id == row_id, RowOwner.user_id == user_id)
        )


RowOwnerRepositoryDep = Annotated[RowOwnerRepository, Depends(RowOwnerRepository)]
