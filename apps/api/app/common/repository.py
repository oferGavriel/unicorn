import abc
from uuid import UUID
from sqlalchemy import ColumnExpressionArgument, Executable, select, func
from sqlalchemy.orm import DeclarativeMeta, InstrumentedAttribute
from sqlalchemy.sql.base import ExecutableOption
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Generic, TypeVar, List, Tuple, Sequence, Optional, Any, Type
from abc import ABC
from app.db.base import BaseSchema
from app.common.errors.exceptions import NotFoundError

T = TypeVar("T", bound=DeclarativeMeta)
_T_co = TypeVar("_T_co", bound=Any, covariant=True)
M = TypeVar("M", bound=BaseSchema)


class Repository(Generic[T], ABC):
    @abc.abstractmethod
    async def get_paged(self, skip: int, limit: int) -> Tuple[int, List[T], Optional[int]]:
        pass

    @abc.abstractmethod
    async def get_all(self) -> Sequence[T]:
        pass

    @abc.abstractmethod
    async def get_by_id(self, primary_key: UUID, *options: ExecutableOption) -> Optional[T]:
        pass

    @abc.abstractmethod
    async def create_entity(self, entity: T) -> T:
        pass

    @abc.abstractmethod
    async def get_and_create(self, **kwargs: Any) -> T:
        pass

    @abc.abstractmethod
    async def get_and_update(self, **kwargs: Any) -> T:
        pass

    @abc.abstractmethod
    async def update_entity(self, entity: T) -> T:
        pass

    @abc.abstractmethod
    async def _get_paged_using_filter(
        self,
        skip: int,
        limit: int,
        filter_criteria: ColumnExpressionArgument[bool],
        *options: ExecutableOption,
    ) -> Tuple[int, List[T], Optional[int]]:
        pass

    @abc.abstractmethod
    async def delete_by_id(self, primary_key: UUID) -> None:
        pass


class BaseRepository(Repository[T]):
    def __init__(
        self,
        model: Type[T],
        primary_key_column: InstrumentedAttribute[_T_co],
        session: AsyncSession,
    ):
        self._session = session
        self.model = model
        self.primary_key_column = primary_key_column
        self.primary_key_column_name = self.primary_key_column.key

    def get_primary_key(self, entity: T) -> Any:
        return getattr(entity, self.primary_key_column_name)

    async def get_single(
        self,
        filter_criteria: ColumnExpressionArgument[bool],
        *options: ExecutableOption,
    ) -> Optional[T]:
        stmt = select(self.model).where(filter_criteria).options(*options)
        result = await self._session.execute(stmt)
        return result.scalars().first()

    async def get_count(self, filter_criteria: ColumnExpressionArgument[bool]) -> int:
        stmt = select(func.count()).where(filter_criteria).select_from(self.model)
        result = await self._session.scalar(stmt)
        return int(result or 0)

    async def get_by_id(self, entity_id: UUID, *options: ExecutableOption) -> Optional[T]:
        return await self.get_single(self.primary_key_column == entity_id, *options)

    async def get_by_ids(self, entity_ids: List[UUID], *options: ExecutableOption) -> Sequence[T]:
        stmt = select(self.model).where(self.primary_key_column.in_(entity_ids)).options(*options)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_paged(self, skip: int, limit: int) -> Tuple[int, List[T], Optional[int]]:
        stmt = select(self.model).offset(skip).limit(limit + 1).order_by(self.primary_key_column)
        count_stmt = select(func.count()).select_from(self.model)
        return await self._get_paged_using_stmt(count_stmt, limit, stmt)

    async def get_and_update(self, **kwargs: Any) -> T:
        entity = await self.get_by_id(kwargs[self.primary_key_column_name])
        if entity is None:
            raise NotFoundError(
                message=f"Entity with {self.primary_key_column_name}={kwargs[self.primary_key_column_name]} not found"
            )
        for key, value in kwargs.items():
            setattr(entity, key, value)
        return await self.update_entity(entity)

    async def update_entity(self, entity: T, **kwargs: Any) -> T:
        for key, value in kwargs.items():
            setattr(entity, key, value)
        await self._session.merge(entity)
        await self._session.commit()
        await self._session.refresh(entity)
        return entity

    async def _get_paged_using_filter(
        self,
        skip: int,
        limit: int,
        filter_criteria: ColumnExpressionArgument[bool],
        *options: ExecutableOption,
    ) -> Tuple[int, List[T], Optional[int]]:
        stmt = (
            select(self.model)
            .offset(skip)
            .limit(limit + 1)
            .where(filter_criteria)
            .order_by(self.primary_key_column)
            .options(*options)
        )
        count_stmt = select(func.count()).where(filter_criteria).select_from(self.model)
        return await self._get_paged_using_stmt(count_stmt, limit, stmt)

    async def _get_paged_using_stmt(
        self, count_stmt: Executable, limit: int, stmt: Executable
    ) -> Tuple[int, List[T], Optional[int]]:
        result = await self._session.execute(stmt)
        total_count = await self._session.scalar(count_stmt)
        result_array = list(result.scalars().all())
        next_id = self.get_primary_key(result_array[limit]) if len(result_array) > limit else None
        return int(total_count), result_array[:limit], next_id

    async def get_all(self) -> Sequence[T]:
        stmt = select(self.model)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_and_create(self, **kwargs: Any) -> T:
        entity = self.model(**kwargs)
        return await self.create_entity(entity)

    async def create_entity(self, entity: T) -> T:
        self._session.add(entity)
        await self._session.commit()
        await self._session.refresh(entity)
        return entity

    async def create_all(self, instances: Sequence[T], batch_size: int = 500) -> None:
        if not instances:
            return

        for i in range(0, len(instances), batch_size):
            batch = instances[i : i + batch_size]
            self._session.add_all(batch)
            await self._session.flush()

        await self._session.commit()

    async def delete_by_id(self, primary_key: UUID) -> None:
        entity = await self.get_by_id(primary_key)

        if entity is None:
            return None

        await self._session.delete(entity)
        await self._session.commit()
