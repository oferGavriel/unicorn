from uuid import UUID
from fastapi import Depends, Path

from app.common.errors.exceptions import PermissionDeniedError
from app.db.database import DBSessionDep
from app.database_models.board_member import BoardMember
from app.database_models.board import Board
from sqlalchemy import select, or_
from app.DI.current_user import CurrentUserDep
from app.database_models.user import User


async def board_member(
    session: DBSessionDep,  # noqa: B008
    board_id: UUID = Path(...),  # noqa: B008
    current_user: User = CurrentUserDep,
) -> None:
    stmt = (
        select(BoardMember.id)
        .outerjoin(Board, Board.id == BoardMember.board_id)
        .where(
            Board.id == board_id,
            or_(
                Board.owner_id == current_user.id,
                BoardMember.user_id == current_user.id,
            ),
        )
        .limit(1)
    )
    print("BEFORE BOARD MEMBER MIDDLEWARE")
    result = await session.execute(stmt)
    print("board_member result", result.all())
    if not result.scalar_one_or_none():
        raise PermissionDeniedError("You are not a member of this board.")


BoardMemberDep = Depends(board_member)
