from uuid import UUID
from typing import Annotated, Optional
from fastapi import Depends
from sqlalchemy import delete, select
from app.database_models.board_member import BoardMember
from app.common.repository import BaseRepository
from app.core.database import DBSessionDep
from app.core.enums import RoleEnum


class BoardMemberRepository(BaseRepository[BoardMember]):
    def __init__(self, session: DBSessionDep):
        super().__init__(BoardMember, BoardMember.id, session)
        self.session = session

    async def list_members(self, board_id: UUID) -> list[BoardMember]:
        q = select(BoardMember).where(BoardMember.board_id == board_id)
        result = await self.session.execute(q)
        return list(result.scalars().all())

    async def get_by_user_id(self, board_id: UUID, user_id: UUID) -> BoardMember | None:
        q = select(BoardMember).where(
            BoardMember.board_id == board_id,
            BoardMember.user_id == user_id,
        )
        result = await self.session.execute(q)
        board_member: Optional[BoardMember] = result.scalar_one_or_none()
        return board_member

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
