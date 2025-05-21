from uuid import UUID
from typing import Annotated
from fastapi import Depends
from sqlalchemy import delete
from app.database_models.board_member import BoardMember
from app.common.repository import BaseRepository
from app.db.database import DBSessionDep
from app.core.enums import RoleEnum


class BoardMemberRepository(BaseRepository[BoardMember]):
    def __init__(self, session: DBSessionDep):
        super().__init__(BoardMember, BoardMember.id, session)
        self.session = session

    async def add(
        self, board_id: UUID, user_id: UUID, role: RoleEnum = RoleEnum.member
    ) -> BoardMember:
        bm = BoardMember(board_id=board_id, user_id=user_id, role=role)
        self.session.add(bm)
        await self.session.commit()
        await self.session.refresh(bm)
        return bm

    async def remove(self, board_id: UUID, user_id: UUID) -> None:
        q = delete(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        await self.session.execute(q)
        await self.session.commit()


BoardMemberRepositoryDep = Annotated[
    BoardMemberRepository, Depends(BoardMemberRepository)
]
