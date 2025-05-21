from uuid import uuid4, UUID
from fastapi import Depends
from typing import List, Annotated
from app.api.dal.board_repository import BoardRepositoryDep
from app.api.dal.board_member_repository import BoardMemberRepositoryDep
from app.database_models import Board
from app.api.models.board_model import BoardCreate, BoardUpdate, BoardRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError
from app.api.models.board_member_model import RoleEnum


class BoardService(BaseService[Board, BoardRead]):
    def __init__(
        self,
        board_repository: BoardRepositoryDep,
        member_repository: BoardMemberRepositoryDep,
    ):
        super().__init__(BoardRead, board_repository)
        self.board_repository = board_repository
        self.member_repository = member_repository

    async def list_boards(self, owner_id: UUID) -> List[BoardRead]:
        boards = await self.board_repository.list_for_user(owner_id)
        return [self.convert_to_model(board) for board in boards]

    async def get_board(self, board_id: UUID, user_id: UUID) -> BoardRead:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")
        return self.convert_to_model(board)

    async def create_board(self, owner_id: UUID, data: BoardCreate) -> BoardRead:
        payload = Board(
            id=uuid4(),
            name=data.name,
            description=data.description,
            owner_id=owner_id,
        )

        created_board = await self.board_repository.create(payload)
        await self.member_repository.add(
            created_board.id, owner_id, role=RoleEnum.owner
        )
        return self.convert_to_model(created_board)

    async def update_board(
        self, board_id: UUID, owner_id: UUID, data: BoardUpdate
    ) -> BoardRead:
        board = await self.board_repository.get(board_id, owner_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")

        payload = data.model_dump(
            exclude_none=True, include={"name", "description", "order"}
        )
        updated_board = await self.board_repository.update(board, payload)

        return self.convert_to_model(updated_board)

    async def delete_board(self, board_id: UUID, owner_id: UUID) -> None:
        await self.get_board(board_id, owner_id)
        await self.board_repository.soft_delete(board_id, owner_id)

    async def add_member(
        self, board_id: UUID, current_user_id: UUID, user_to_add_id: UUID
    ) -> None:
        board = await self.board_repository.get(board_id, current_user_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")
        await self.member_repository.add(board_id, user_to_add_id)

    async def remove_member(
        self, board_id: UUID, current_user_id: UUID, user_to_remove_id: UUID
    ) -> None:
        board = await self.board_repository.get(board_id, current_user_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")
        await self.member_repository.remove(board_id, user_to_remove_id)


BoardServiceDep = Annotated[BoardService, Depends(BoardService)]
