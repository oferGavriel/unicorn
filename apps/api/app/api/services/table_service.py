from typing import List, Annotated
from uuid import uuid4, UUID
from fastapi import Depends

from app.api.dal.table_repository import TableRepositoryDep
from app.api.dal.board_repository import BoardRepositoryDep
from app.database_models import Table
from app.api.models.table_model import TableCreate, TableUpdate, TableRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError, ConflictError


class TableService(BaseService[Table, TableRead]):
    def __init__(
        self, table_repository: TableRepositoryDep, board_repository: BoardRepositoryDep
    ):
        super().__init__(TableRead, table_repository)
        self.table_repository = table_repository
        self.board_repository = board_repository

    async def list_tables(self, board_id: UUID, user_id: UUID) -> List[TableRead]:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")
        tables = await self.table_repository.list_by_board(board_id)

        return [self.convert_to_model(table) for table in tables]

    async def get_table(
        self, table_id: UUID, board_id: UUID, user_id: UUID
    ) -> TableRead:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")

        table = await self.table_repository.get(table_id, board_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        return self.convert_to_model(table)

    async def create_table(
        self, board_id: UUID, user_id: UUID, data: TableCreate
    ) -> TableRead:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")

        payload = Table(
            id=uuid4(),
            board_id=board_id,
            name=data.name,
            description=data.description,
        )
        result = await self.table_repository.create(payload)
        return self.convert_to_model(result)

    async def update_table(
        self,
        table_id: UUID,
        board_id: UUID,
        user_id: UUID,
        data: TableUpdate,
    ) -> TableRead:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")

        table = await self.table_repository.get(table_id, board_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        if table.version != data.version:
            raise ConflictError(message=f"Version conflict for table {table_id}")

        payload = data.model_dump(
            exclude_none=True, include={"name", "description", "order"}
        )
        payload["version"] = table.version + 1

        updated_table = await self.table_repository.update(table, payload)
        return self.convert_to_model(updated_table)

    async def delete_table(self, table_id: UUID, board_id: UUID, user_id: UUID) -> None:
        board = await self.board_repository.get(board_id, user_id)
        if not board:
            raise NotFoundError(message=f"Board with ID {board_id} not found")

        table = await self.table_repository.get(table_id, board_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        await self.table_repository.soft_delete(table_id, board_id)


TableServiceDep = Annotated[TableService, Depends(TableService)]
