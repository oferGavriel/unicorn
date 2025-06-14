from uuid import uuid4, UUID
from fastapi import Depends
from typing import List, Annotated
from app.api.dal.board_repository import BoardRepositoryDep
from app.api.dal.board_member_repository import BoardMemberRepositoryDep
from app.api.dal.table_repository import TableRepositoryDep
from app.api.dal.auth_repository import AuthRepositoryDep
from app.database_models import Board
from app.api.models.board_model import BoardCreate, BoardUpdate, BoardRead, BoardDetailRead
from app.api.models.table_model import TableRead
from app.api.models.user_model import UserRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError
from app.api.models.board_member_model import RoleEnum
from app.common.service import convert_to_model


class BoardService(BaseService[Board, BoardRead]):
    def __init__(
        self,
        board_repository: BoardRepositoryDep,
        member_repository: BoardMemberRepositoryDep,
        table_repository: TableRepositoryDep,
        auth_repository: AuthRepositoryDep,
    ):
        super().__init__(BoardRead, board_repository)
        self.board_repository = board_repository
        self.member_repository = member_repository
        self.table_repository = table_repository
        self.auth_repository = auth_repository

    async def list_boards(self, owner_id: UUID) -> List[BoardRead]:
        boards = await self.board_repository.list_for_user(owner_id)
        return [await self._to_board_with_members(board) for board in boards]

    async def get_board(self, board_id: UUID, user_id: UUID) -> BoardDetailRead:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")
        return await self._to_board_with_members_and_tables(board)

    async def create_board(self, owner_id: UUID, data: BoardCreate) -> BoardRead:
        board = Board(
            id=uuid4(),
            name=data.name,
            description=data.description,
            owner_id=owner_id,
        )

        created_board = await self.board_repository.create(board)

        await self.member_repository.add(created_board.id, owner_id, role=RoleEnum.owner)

        if data.member_ids:
            if owner_id in data.member_ids:
                data.member_ids.remove(owner_id)

            for uid in data.member_ids:
                await self.member_repository.add(created_board.id, uid, role=RoleEnum.member)

        return await self._to_board_with_members(created_board)

    async def update_board(self, board_id: UUID, owner_id: UUID, data: BoardUpdate) -> BoardRead:
        board = await self.board_repository.get(board_id, owner_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")

        payload = data.model_dump(exclude_none=True, include={"name", "description", "order"})
        updated_board = await self.board_repository.update(board, payload)

        return await self._to_board_with_members(updated_board)

    async def delete_board(self, board_id: UUID, owner_id: UUID) -> None:
        await self.get_board(board_id, owner_id)
        await self.board_repository.soft_delete(board_id, owner_id)

    async def add_member(self, board_id: UUID, current_user_id: UUID, user_to_add_id: UUID) -> None:
        board = await self.board_repository.get(board_id, current_user_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")
        await self.member_repository.add(board_id, user_to_add_id)

    async def remove_member(self, board_id: UUID, current_user_id: UUID, user_to_remove_id: UUID) -> None:
        board = await self.board_repository.get(board_id, current_user_id)
        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")
        await self.member_repository.remove(board_id, user_to_remove_id)

    async def _to_board_with_members(self, board: Board) -> BoardRead:
        members = await self.member_repository.list_members(board.id)
        return convert_to_model(
            board,
            BoardRead,
            custom_mapping={
                "member_ids": [str(m.user_id) for m in members],
            },
        )

    async def _to_board_with_members_and_tables(self, board: Board) -> BoardDetailRead:
        members = await self.member_repository.list_members(board.id)
        user_ids = [m.user_id for m in members]
        users = await self.auth_repository.get_users_by_ids(user_ids)
        tables = await self.table_repository.list_by_board(board.id)

        return convert_to_model(
            board,
            BoardDetailRead,
            custom_mapping={
                "members": [convert_to_model(user, UserRead) for user in users],
                "tables": [convert_to_model(table, TableRead) for table in tables],
            },
        )


BoardServiceDep = Annotated[BoardService, Depends(BoardService)]
