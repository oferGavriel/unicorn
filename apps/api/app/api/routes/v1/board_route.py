from uuid import UUID
from typing import List
from fastapi import APIRouter, status
from app.api.models.board_model import BoardCreate, BoardRead, BoardUpdate, BoardDetailRead
from app.api.services.board_service import BoardServiceDep
from app.DI.current_user import CurrentUserDep
from app.database_models.user import User

router = APIRouter()


@router.get("/", response_model=list[BoardRead])
async def list_boards(
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> List[BoardRead]:
    return await board_service.list_boards(current_user.id)


@router.post("/", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
async def create_board(
    data: BoardCreate,
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> BoardRead:
    return await board_service.create_board(current_user.id, data)


@router.get("/{board_id}", response_model=BoardDetailRead)
async def get_board(
    board_id: UUID,
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> BoardDetailRead:
    return await board_service.get_board(board_id, current_user.id)


@router.patch("/{board_id}", response_model=BoardRead)
async def update_board(
    board_id: UUID,
    data: BoardUpdate,
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> BoardRead:
    return await board_service.update_board(board_id, current_user.id, data)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: UUID,
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> None:
    await board_service.delete_board(board_id, current_user.id)


@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    board_id: UUID,
    user_id: UUID,
    board_service: BoardServiceDep,
    current_user: User = CurrentUserDep,
) -> None:
    await board_service.remove_member(board_id, current_user.id, user_id)
