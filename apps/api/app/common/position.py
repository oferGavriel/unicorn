from uuid import UUID
from typing import Any
from sqlalchemy import update, func
from sqlalchemy.ext.asyncio import AsyncSession


async def shift_positions(
    session: AsyncSession, model: Any, owner_field: Any, owner_id: UUID, from_pos: int
) -> None:
    await session.execute(
        update(model)
        .where(
            owner_field == owner_id,
            model.position > from_pos,
            model.is_deleted.is_(False),
        )
        .values(position=model.position + 1, updated_at=func.now())
    )
