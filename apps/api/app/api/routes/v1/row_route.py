from uuid import UUID
from fastapi import APIRouter, status
from app.api.models.row_model import RowCreate, RowRead, RowUpdate
from app.api.services.row_service import RowServiceDep
from app.DI.current_user import CurrentUserDep
from app.database_models.user import User

router = APIRouter()


@router.post("/", response_model=RowRead, status_code=status.HTTP_201_CREATED)
async def create_row(
    table_id: UUID,
    data: RowCreate,
    row_service: RowServiceDep,
    current_user: User = CurrentUserDep,
) -> RowRead:
    return await row_service.create_row(table_id, current_user.id, data)


@router.patch("/{row_id}", response_model=RowRead)
async def update_row(
    table_id: UUID,
    row_id: UUID,
    data: RowUpdate,
    row_service: RowServiceDep,
    current_user: User = CurrentUserDep,
) -> RowRead:
    return await row_service.update_row(row_id, table_id, current_user.id, data)


@router.delete("/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_row(
    table_id: UUID,
    row_id: UUID,
    row_service: RowServiceDep,
    current_user: User = CurrentUserDep,
) -> None:
    await row_service.delete_row(row_id, table_id, current_user.id)
