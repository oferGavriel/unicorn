from uuid import uuid4, UUID
from typing import Dict, Any
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database_models import Board, Table, Row, BoardMember
from app.api.models.board_member_model import RoleEnum
from app.common.errors.exceptions import NotFoundError
from .base_duplication_service import BaseDuplicationService
from .table_duplication_service import TableDuplicationService


class BoardDuplicationService(BaseDuplicationService[Board]):

    def __init__(self, session: AsyncSession, table_duplication_service: TableDuplicationService):
        super().__init__(session)
        self.table_duplication_service = table_duplication_service

    async def duplicate(self, source_id: UUID, context: Dict[str, Any]) -> Board:
        user_id = context['user_id']
        include_tables = context.get('include_tables', True)
        include_members = context.get('include_members', True)

        source_board = await self._get_source_board(source_id, user_id)

        new_board_name = await self._generate_unique_board_name(source_board.name, user_id)

        new_position = await self._get_next_position_with_shift(
            model_class=Board, owner_field_name='owner_id', owner_id=user_id, source_position=source_board.position
        )

        new_board = Board(
            id=uuid4(),
            name=new_board_name,
            description=source_board.description,
            owner_id=user_id,
            position=new_position,
        )

        self.session.add(new_board)
        await self.session.flush()

        await self._add_owner_as_member(new_board.id, user_id)

        if include_members:
            await self._duplicate_members(source_board, new_board.id, user_id)

        if include_tables:
            await self._duplicate_tables(source_board, new_board.id, user_id)

        return new_board

    async def _get_source_board(self, board_id: UUID, user_id: UUID) -> Board:
        stmt = (
            select(Board)
            .outerjoin(BoardMember, BoardMember.board_id == Board.id)
            .where(
                Board.id == board_id,
                ~Board.is_deleted,
                or_(
                    Board.owner_id == user_id,
                    BoardMember.user_id == user_id,
                ),
            )
            .options(
                selectinload(Board.members),
                selectinload(Board.tables).selectinload(Table.rows).selectinload(Row.owner_users),
            )
        )
        result = await self.session.execute(stmt)
        board = result.scalar_one_or_none()

        if not board:
            raise NotFoundError(f"Board with ID {board_id} not found")

        return board

    async def _add_owner_as_member(self, board_id: UUID, user_id: UUID) -> None:
        owner_member = BoardMember(board_id=board_id, user_id=user_id, role=RoleEnum.owner)
        self.session.add(owner_member)

    async def _duplicate_members(self, source_board: Board, new_board_id: UUID, owner_id: UUID) -> None:
        members_to_add = []

        for member in source_board.members:
            if member.user_id == owner_id:
                continue

            new_member = BoardMember(
                board_id=new_board_id,
                user_id=member.user_id,
                role=member.role if member.role != RoleEnum.owner else RoleEnum.member,
            )
            members_to_add.append(new_member)

        if members_to_add:
            self.session.add_all(members_to_add)

    async def _duplicate_tables(self, source_board: Board, new_board_id: UUID, user_id: UUID) -> None:
        for table in sorted(source_board.tables, key=lambda t: t.position):
            if table.is_deleted:
                continue

            await self.table_duplication_service.duplicate(
                source_id=table.id,
                context={
                    'user_id': user_id,
                    'target_board_id': new_board_id,
                    'include_rows': True,
                },
            )

    async def _generate_unique_board_name(self, original_name: str, owner_id: UUID) -> str:
        base_name = original_name
        if original_name.endswith(')') and ' (' in original_name:
            last_paren_index = original_name.rfind(' (')
            potential_number = original_name[last_paren_index + 2 : -1]
            if potential_number.isdigit():
                base_name = original_name[:last_paren_index]

        pattern = f"{base_name} ("

        stmt = select(Board.name).where(Board.owner_id == owner_id, Board.name.like(f"{pattern}%"))
        result = await self.session.execute(stmt)
        existing_names = result.scalars().all()

        existing_numbers = set()
        for name in existing_names:
            if name.startswith(pattern) and name.endswith(')'):
                suffix = name[len(pattern) : -1]
                if suffix.isdigit():
                    existing_numbers.add(int(suffix))

        next_number = 1
        while next_number in existing_numbers:
            next_number += 1

        return f"{base_name} ({next_number})"
