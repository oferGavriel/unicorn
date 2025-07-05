from uuid import uuid4, UUID
from fastapi import Depends
from typing import List, Annotated

from app.api.dal.board_repository import BoardRepositoryDep
from app.api.dal.board_member_repository import BoardMemberRepositoryDep
from app.api.services.row_service import RowServiceDep
from app.api.services.duplicate.duplication_factory import DuplicationServiceFactory

from app.database_models import Board

from app.api.models.board_model import BoardCreate, BoardUpdate, BoardRead, BoardDetailRead
from app.api.models.table_model import TableRead
from app.api.models.board_member_model import RoleEnum

from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError, PermissionDeniedError
from app.common.service import convert_to_model


class BoardService(BaseService[Board, BoardRead]):
    def __init__(
        self,
        board_repository: BoardRepositoryDep,
        member_repository: BoardMemberRepositoryDep,
        row_service: RowServiceDep,
    ):
        super().__init__(BoardRead, board_repository)
        self.board_repository = board_repository
        self.member_repository = member_repository
        self.row_service = row_service

    async def list_boards(self, user_id: UUID) -> List[BoardRead]:
        boards = await self.board_repository.list_for_user(user_id)
        return [self._to_board_with_members(board) for board in boards]

    async def get_board_full_tree(self, board_id: UUID, user_id: UUID) -> BoardDetailRead:
        board = await self.board_repository.get_full_tree(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")

        return self._to_board_detailed(board)

    async def create_board(self, user_id: UUID, data: BoardCreate) -> BoardRead:
        board_to_add = Board(
            id=uuid4(),
            name=data.name,
            description=data.description,
            owner_id=user_id,
        )

        created_board = await self.board_repository.create(board_to_add)

        await self.member_repository.add(created_board.id, user_id, role=RoleEnum.owner)

        if data.member_ids:
            if user_id in data.member_ids:
                data.member_ids.remove(user_id)

            for uid in data.member_ids:
                await self.member_repository.add(created_board.id, uid, role=RoleEnum.member)

        return self._to_board_with_members(created_board)

    async def update_board(self, board_id: UUID, user_id: UUID, data: BoardUpdate) -> BoardRead:
        board = await self.get_board_entity(board_id, user_id)

        payload = data.model_dump(exclude_none=True, include={"name", "description", "position"})
        await self.board_repository.update(board, payload)
        board_with_members = await self.get_board_entity(board_id, user_id)

        return self._to_board_with_members(board_with_members)

    async def delete_board(self, board_id: UUID, user_id: UUID) -> None:
        await self.get_board_entity(board_id, user_id)
        await self.board_repository.delete(board_id, user_id)

    async def add_member(self, board_id: UUID, current_user_id: UUID, user_id_to_add: UUID) -> UUID:
        await self.get_board_entity(board_id, current_user_id)
        board_member = await self.member_repository.add(board_id, user_id_to_add)
        return board_member.id

    async def remove_member(self, board_id: UUID, current_user_id: UUID, user_to_remove_id: UUID) -> None:
        await self.get_board_entity(board_id, current_user_id)
        await self.member_repository.remove(board_id, user_to_remove_id)

    async def duplicate_board(self, board_id: UUID, user_id: UUID) -> BoardRead:
        await self.get_board_entity(board_id, user_id)

        duplication_service = DuplicationServiceFactory.create_board_service(self.board_repository.session)
        duplicated_board = await duplication_service.duplicate(
            source_id=board_id,
            context={
                'user_id': user_id,
                'include_tables': True,
                'include_members': True,
            },
        )

        await self.board_repository.session.commit()
        new_board = await self.get_board_entity(duplicated_board.id, user_id)

        return self._to_board_with_members(new_board)

    async def get_board_entity(self, board_id: UUID, user_id: UUID) -> Board:
        board_exists = await self.board_repository.get(board_id)
        if not board_exists:
            raise NotFoundError(f"Board with ID {board_id} not found")
        board = await self.board_repository.get_for_user(board_id, user_id)
        if not board:
            raise PermissionDeniedError(f"You do not have permission to access board with ID {board_id}")

        return board

    def _to_board_with_members(self, board: Board) -> BoardRead:
        return convert_to_model(
            board,
            BoardRead,
            custom_mapping={
                "member_ids": [str(m.user_id) for m in board.members],
            },
        )

    def _to_board_detailed(self, board: Board) -> BoardDetailRead:
        return convert_to_model(
            board,
            BoardDetailRead,
            custom_mapping={
                "member_ids": [str(m.user_id) for m in board.members],
                "tables": [
                    convert_to_model(
                        table,
                        TableRead,
                        custom_mapping={
                            "rows": [self.row_service.row_to_read(row) for row in table.rows],
                        },
                    )
                    for table in board.tables
                ],
            },
        )


BoardServiceDep = Annotated[BoardService, Depends(BoardService)]
