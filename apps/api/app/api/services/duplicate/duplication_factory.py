from sqlalchemy.ext.asyncio import AsyncSession
from .row_duplication_service import RowDuplicationService
from .table_duplication_service import TableDuplicationService
from .board_duplication_service import BoardDuplicationService


class DuplicationServiceFactory:
    @staticmethod
    def create_row_service(session: AsyncSession) -> RowDuplicationService:
        return RowDuplicationService(session)

    @staticmethod
    def create_table_service(session: AsyncSession) -> TableDuplicationService:
        row_service = DuplicationServiceFactory.create_row_service(session)
        return TableDuplicationService(session, row_service)

    @staticmethod
    def create_board_service(session: AsyncSession) -> BoardDuplicationService:
        table_service = DuplicationServiceFactory.create_table_service(session)
        return BoardDuplicationService(session, table_service)
