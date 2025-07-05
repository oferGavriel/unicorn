from typing import Annotated
from uuid import uuid4, UUID
from fastapi import Depends
from app.api.dal.row_repository import RowRepositoryDep
from app.api.dal.table_repository import TableRepositoryDep
from app.api.dal.row_owner_repository import RowOwnerRepositoryDep
from app.api.dal.auth_repository import AuthRepositoryDep
from app.database_models import Row
from app.api.models.row_model import RowCreate, RowUpdate, RowRead
from app.common.service import BaseService
from app.common.errors.exceptions import NotFoundError, ConflictError
from app.core.enums import StatusEnum, PriorityEnum
from app.common.service import convert_to_model
from app.api.models.row_model import RowOwnerRead

from app.api.services.duplicate.duplication_factory import DuplicationServiceFactory


class RowService(BaseService[Row, RowRead]):
    def __init__(
        self,
        row_repository: RowRepositoryDep,
        table_repository: TableRepositoryDep,
        row_owner_repository: RowOwnerRepositoryDep,
        auth_repository: AuthRepositoryDep,
    ):
        super().__init__(RowRead, row_repository)
        self.row_repository = row_repository
        self.table_repository = table_repository
        self.row_owner_repository = row_owner_repository
        self.auth_repository = auth_repository

    async def get_row(self, row_id: UUID, table_id: UUID) -> RowRead:
        row = await self.row_repository.get(row_id, table_id)
        if not row:
            raise NotFoundError(message=f"Row with ID {row_id} not found")
        return self.row_to_read(row)

    async def create_row(
        self,
        table_id: UUID,
        user_id: UUID,
        data: RowCreate,
    ) -> RowRead:
        await self._check_if_table_exists(table_id, user_id)

        new_row = Row(
            id=uuid4(),
            table_id=table_id,
            name=data.name,
            position=data.position,
            status=StatusEnum.NOT_STARTED,
            priority=PriorityEnum.MEDIUM,
        )
        created = await self.row_repository.create(new_row)
        return self.row_to_read(created)

    async def update_row(self, row_id: UUID, table_id: UUID, user_id: UUID, data: RowUpdate) -> RowRead:
        await self._check_if_table_exists(table_id, user_id)

        row = await self._get_row_entity(row_id, table_id)

        payload = data.model_dump(exclude_unset=True)
        updated = await self.row_repository.update(row, payload)
        return self.row_to_read(updated)

    async def delete_row(self, row_id: UUID, table_id: UUID) -> None:
        await self._get_row_entity(row_id, table_id)
        await self.row_repository.delete(row_id, table_id)

    async def add_owner(self, row_id: UUID, table_id: UUID, new_owner_id: UUID) -> RowOwnerRead:
        row = await self._get_row_entity(row_id, table_id)

        if any(u.id == new_owner_id for u in row.owner_users):
            raise ConflictError(message=f"User with ID {new_owner_id} is already an owner of this row")

        await self.row_owner_repository.add(row_id, new_owner_id)
        await self.row_owner_repository.session.commit()

        user = await self.auth_repository.get_by_id(new_owner_id)
        if not user:
            raise NotFoundError(message=f"User with ID {new_owner_id} not found")

        return RowOwnerRead(
            id=user.id, first_name=user.first_name, last_name=user.last_name, email=user.email, avatar_url=user.avatar_url
        )

    async def remove_owner(self, row_id: UUID, table_id: UUID, owner_id: UUID) -> None:
        await self._get_row_entity(row_id, table_id)
        await self.row_owner_repository.remove(row_id, owner_id)
        await self.row_owner_repository.session.commit()

    async def duplicate_row(self, row_id: UUID, table_id: UUID, user_id: UUID) -> RowRead:
        await self._check_if_table_exists(table_id, user_id)

        duplication_service = DuplicationServiceFactory.create_row_service(self.row_repository.session)
        new_row = await duplication_service.duplicate(source_id=row_id, context={'user_id': user_id})

        await self.row_repository.session.commit()

        return self.row_to_read(new_row)

    def row_to_read(self, row: Row) -> RowRead:
        print("row.owner_users:", row)
        # await self.row_repository.session.refresh(row, ['owner_users'])
        owners = [
            RowOwnerRead(id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email, avatar_url=u.avatar_url)
            for u in row.owner_users
        ]
        return convert_to_model(row, RowRead, custom_mapping={"owners": owners})

    async def _check_if_table_exists(self, table_id: UUID, user_id: UUID) -> None:
        table = await self.table_repository.get_by_user(table_id, user_id)
        if not table:
            raise NotFoundError(message=f"Table with ID {table_id} not found")

    async def _get_row_entity(self, row_id: UUID, table_id: UUID) -> Row:
        row = await self.row_repository.get(row_id, table_id)
        if not row:
            raise NotFoundError(message=f"Row with ID {row_id} not found in table {table_id}")
        return row


RowServiceDep = Annotated[RowService, Depends(RowService)]
