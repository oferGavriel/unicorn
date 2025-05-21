from uuid import UUID
from typing import List, Optional, Annotated
from fastapi import Depends
from sqlalchemy import select, update, or_
from app.database_models.board import Board
from app.database_models.board_member import BoardMember
from app.common.repository import BaseRepository
from app.db.database import DBSessionDep


class BoardRepository(BaseRepository[Board]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Board, Board.id, session)
        self.session = session

    async def list_for_user(self, user_id: UUID) -> List[Board]:
        """Return all boards where the user is either the owner or a member."""
        q = (
            select(Board)
            .outerjoin(BoardMember, BoardMember.board_id == Board.id)
            .where(
                ~Board.is_deleted,
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            .order_by(Board.order)
        )
        res = await self.session.execute(q)
        return list(res.unique().scalars().all())

    async def get(self, board_id: UUID, user_id: UUID) -> Optional[Board]:
        """Return a single board if the user is owner or member; else None."""
        q = (
            select(Board)
            .outerjoin(BoardMember)
            .where(
                Board.id == board_id,
                ~Board.is_deleted,
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
        )
        res = await self.session.execute(q)
        return res.scalar_one_or_none()

    async def create(self, board: Board) -> Board:
        self.session.add(board)
        await self.session.commit()
        await self.session.refresh(board)
        return board

    async def update(self, board: Board, data: dict) -> Board:
        return await self.update_entity(board, **data)

    async def soft_delete(self, board_id: UUID, owner_id: UUID) -> None:
        q = (
            update(Board)
            .where(Board.id == board_id, Board.owner_id == owner_id)
            .values(is_deleted=True)
            .execution_options(synchronize_session="fetch")
        )
        await self.session.execute(q)
        await self.session.commit()


BoardRepositoryDep = Annotated[BoardRepository, Depends(BoardRepository)]
