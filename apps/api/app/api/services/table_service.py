from typing import List, Annotated
from uuid import uuid4, UUID
from fastapi import Depends

from app.api.dal.table_repository import TableRepositoryDep
from app.api.services.board_service import BoardServiceDep
from app.database_models import Table
from app.api.models.table_model import TableCreate, TableUpdate, TableRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError

from app.api.services.duplicate.duplication_factory import DuplicationServiceFactory


class TableService(BaseService[Table, TableRead]):
    def __init__(self, table_repository: TableRepositoryDep, board_service: BoardServiceDep):
        super().__init__(TableRead, table_repository)
        self.table_repository = table_repository
        self.board_service = board_service

    async def list_tables(self, board_id: UUID, user_id: UUID) -> List[TableRead]:
        await self._check_if_board_exists(board_id, user_id)
        tables = await self.table_repository.list_by_board(board_id)

        return [self.convert_to_model(table) for table in tables]

    async def get_table(self, table_id: UUID, board_id: UUID, user_id: UUID) -> TableRead:
        await self._check_if_board_exists(board_id, user_id)

        table = await self._get_table_entity(table_id, board_id)

        return self.convert_to_model(table)

    async def create_table(self, board_id: UUID, user_id: UUID, data: TableCreate) -> TableRead:
        await self._check_if_board_exists(board_id, user_id)

        table_data = data.model_dump(exclude_none=True)

        payload = Table(
            id=uuid4(),
            board_id=board_id,
            **table_data,
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
        await self._check_if_board_exists(board_id, user_id)

        table = await self._get_table_entity(table_id, board_id)

        payload = data.model_dump(exclude_none=True)

        updated_table = await self.table_repository.update(table, payload)
        return self.convert_to_model(updated_table)

    async def delete_table(self, table_id: UUID, board_id: UUID, user_id: UUID) -> None:
        await self._check_if_board_exists(board_id, user_id)

        await self._get_table_entity(table_id, board_id)

        await self.table_repository.delete(table_id, board_id)

    async def duplicate_table(self, table_id: UUID, board_id: UUID, user_id: UUID) -> TableRead:
        await self._check_if_board_exists(board_id, user_id)

        source_table = await self._get_table_entity(table_id, board_id)

        print("source_table:", source_table)

        if not source_table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        duplication_service = DuplicationServiceFactory.create_table_service(self.table_repository.session)
        duplicated_table = await duplication_service.duplicate(
            source_id=table_id,
            context={
                'user_id': user_id,
                'include_rows': True,
                'source_table': source_table,
            },
        )

        await self.table_repository.session.commit()

        new_table = await self._get_table_entity(duplicated_table.id, board_id)

        return self.convert_to_model(new_table)

    async def _check_if_board_exists(self, board_id: UUID, user_id: UUID) -> None:
        await self.board_service.get_board_entity(board_id, user_id)

    async def _get_table_entity(self, table_id: UUID, board_id: UUID) -> Table:
        table = await self.table_repository.get(table_id, board_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")
        return table


TableServiceDep = Annotated[TableService, Depends(TableService)]
