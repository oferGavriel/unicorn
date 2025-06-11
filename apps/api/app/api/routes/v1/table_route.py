from uuid import UUID
from fastapi import APIRouter, status
from fastapi.responses import Response
from app.api.models.table_model import TableCreate, TableRead, TableUpdate
from app.api.services.table_service import TableServiceDep
from app.DI.current_user import CurrentUserDep

router = APIRouter()


@router.get("/", response_model=list[TableRead], description="List all tables")
async def list_tables(
    board_id: UUID,
    table_service: TableServiceDep,
    current_user=CurrentUserDep,
):
    return await table_service.list_tables(board_id, current_user.id)


@router.post(
    "/",
    response_model=TableRead,
    status_code=status.HTTP_201_CREATED,
    description="Create a new table",
)
async def create_table(
    board_id: UUID,
    data: TableCreate,
    table_service: TableServiceDep,
    current_user=CurrentUserDep,
):
    return await table_service.create_table(board_id, current_user.id, data)


@router.patch("/{table_id}", response_model=TableRead, description="Update a table by ID")
async def update_table(
    board_id: UUID,
    table_id: UUID,
    data: TableUpdate,
    table_service: TableServiceDep,
    current_user=CurrentUserDep,
):
    return await table_service.update_table(table_id, board_id, current_user.id, data)


@router.delete(
    "/{table_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    description="Delete a table by ID",
)
async def delete_table(
    board_id: UUID,
    table_id: UUID,
    table_service: TableServiceDep,
    current_user=CurrentUserDep,
):
    await table_service.delete_table(table_id, board_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
