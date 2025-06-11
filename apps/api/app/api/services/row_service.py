from typing import List, Annotated
from uuid import uuid4, UUID
from fastapi import Depends
from app.api.dal.row_repository import RowRepositoryDep
from app.api.dal.table_repository import TableRepositoryDep
from app.database_models import Row
from app.api.models.row_model import RowCreate, RowUpdate, RowRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError
from app.core.enums import StatusEnum, PriorityEnum


class RowService(BaseService[Row, RowRead]):
    def __init__(self, row_repository: RowRepositoryDep, table_repository: TableRepositoryDep):
        super().__init__(RowRead, row_repository)
        self.row_repository = row_repository
        self.table_repository = table_repository

    async def list_rows(self, table_id: UUID, user_id: UUID) -> List[RowRead]:
        # check if table exists
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")
        rows = await self.row_repository.list_by_table(table_id)

        return [self.convert_to_model(row) for row in rows]

    async def get_row(self, row_id: UUID, table_id: UUID, user_id: UUID) -> RowRead:
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        row = await self.row_repository.get(row_id, table_id)
        if not row:
            raise NotFoundError(message=f"Row with ID {row_id} not found")
        return self.convert_to_model(row)

    async def create_row(
        self,
        table_id: UUID,
        user_id: UUID,
        data: RowCreate,
    ) -> RowRead:
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        payload = Row(
            id=uuid4(),
            table_id=table_id,
            name=data.name,
            position=data.position,
            owners=[],
            status=StatusEnum.NOT_STARTED,
            priority=PriorityEnum.MEDIUM,
            due_date=None,
        )
        result = await self.row_repository.create(payload)
        return self.convert_to_model(result)

    async def update_row(self, row_id: UUID, table_id: UUID, user_id: UUID, data: RowUpdate) -> RowRead:
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        row = await self.row_repository.get(row_id, table_id)
        if not row:
            raise NotFoundError(message=f"Row with ID {row_id} not found")

        payload = data.model_dump(exclude_none=True)
        updated_row = await self.row_repository.update(row, payload)

        return self.convert_to_model(updated_row)

    async def delete_row(self, row_id: UUID, table_id: UUID, user_id: UUID) -> None:
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

        row = await self.row_repository.get(row_id, table_id)
        if not row:
            raise NotFoundError(message=f"Row with ID {row_id} not found")

        await self.row_repository.delete(row_id, table_id)


RowServiceDep = Annotated[RowService, Depends(RowService)]
