from uuid import UUID
from typing import List, Optional, Annotated
from fastapi import Depends
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.database_models.board import Board
from app.database_models.table import Table
from app.database_models.row import Row
from app.database_models.board_member import BoardMember
from app.common.repository import BaseRepository
from app.core.database import DBSessionDep


class BoardRepository(BaseRepository[Board]):
    def __init__(self, session: DBSessionDep):
        super().__init__(Board, Board.id, session)
        self.session = session

    async def list_for_user(self, user_id: UUID) -> List[Board]:
        q = (
            select(Board)
            .outerjoin(BoardMember, BoardMember.board_id == Board.id)
            .where(
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            .options(selectinload(Board.members))
            .order_by(Board.updated_at.desc(), Board.created_at.desc())
        )
        res = await self.session.execute(q)
        return list(res.unique().scalars().all())

    async def get_full_tree(self, board_id: UUID, user_id: UUID) -> Optional[Board]:
        q = (
            select(Board)
            .outerjoin(BoardMember, BoardMember.board_id == Board.id)
            .where(
                Board.id == board_id,
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            .options(
                selectinload(Board.members).selectinload(BoardMember.user),
                selectinload(Board.owner),
                selectinload(Board.tables)
                .selectinload(Table.rows)
                .selectinload(Row.owner_users),
            )
        )
        res = await self.session.execute(q)
        board: Optional[Board] = res.unique().scalars().one_or_none()
        return board

    async def get_for_user(self, board_id: UUID, user_id: UUID) -> Optional[Board]:
        q = (
            select(Board)
            .outerjoin(BoardMember, BoardMember.board_id == Board.id)
            .where(
                Board.id == board_id,
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            .options(
                selectinload(Board.members).selectinload(BoardMember.user),
                selectinload(Board.owner),
            )
        )
        res = await self.session.execute(q)
        board: Optional[Board] = res.unique().scalars().one_or_none()
        return board

    async def get(self, board_id: UUID) -> Optional[Board]:
        q = select(Board).where(Board.id == board_id)
        res = await self.session.execute(q)
        board: Optional[Board] = res.unique().scalars().one_or_none()
        return board

    async def create(self, board: Board) -> Board:
        self.session.add(board)
        await self.session.commit()
        q = select(Board).where(Board.id == board.id).options(selectinload(Board.members))
        result = await self.session.execute(q)
        created_board: Board = result.scalar_one()
        return created_board

    async def update(self, board: Board, data: dict) -> Board:
        return await self.update_entity(board, **data)

    async def delete(self, board_id: UUID, user_id: UUID) -> None:
        board = await self.get_for_user(board_id, user_id)
        if not board:
            return

        await self.session.delete(board)
        await self.session.commit()


BoardRepositoryDep = Annotated[BoardRepository, Depends(BoardRepository)]
