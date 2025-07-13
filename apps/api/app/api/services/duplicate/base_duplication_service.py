from abc import ABC, abstractmethod
from typing import Type, TypeVar, Generic, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import DeclarativeBase
from app.common.position import shift_positions

T = TypeVar("T", bound=DeclarativeBase)


class BaseDuplicationService(ABC, Generic[T]):
    def __init__(self, session: AsyncSession):
        self.session = session

    @abstractmethod
    async def duplicate(self, source_id: UUID, context: Dict[str, Any]) -> T:
        pass

    async def _get_next_position_with_shift(
        self,
        model_class: Type[T],
        owner_field_name: str,
        owner_id: UUID,
        source_position: int,
    ) -> int:
        new_position = source_position + 1

        owner_field = getattr(model_class, owner_field_name)
        await shift_positions(
            session=self.session,
            model=model_class,
            owner_field=owner_field,
            owner_id=owner_id,
            from_pos=source_position,
        )

        return new_position

    async def _get_max_position(
        self, model_class: Type[T], field_name: str, field_value: UUID
    ) -> int:
        position_field = model_class.position  # type: ignore[attr-defined]
        filter_field = getattr(model_class, field_name)

        stmt = select(func.coalesce(func.max(position_field), 0)).where(
            filter_field == field_value
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0
