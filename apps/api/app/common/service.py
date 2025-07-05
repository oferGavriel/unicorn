import abc
from typing import Generic, TypeVar, List, Optional, Any, Type, Dict
from abc import ABC
from uuid import UUID
from app.db.base import BaseSchema
from sqlalchemy.orm import DeclarativeMeta
from app.common.paging import PageParams, PaginatedResponse
from app.common.repository import Repository

M = TypeVar("M", bound=BaseSchema)
T = TypeVar("T", bound=DeclarativeMeta)


class Service(Generic[T, M], ABC):
    @abc.abstractmethod
    async def get_paged(self, q: PageParams) -> PaginatedResponse[M]:
        pass

    @abc.abstractmethod
    async def get_all(self) -> List[M]:
        pass

    @abc.abstractmethod
    async def get_by_id(self, entity_id: UUID) -> Optional[M]:
        pass

    @abc.abstractmethod
    async def create(self, **kwargs: Any) -> M:
        pass

    @abc.abstractmethod
    def convert_to_model(self, entity: T) -> M:
        pass

    @abc.abstractmethod
    async def delete_by_id(self, entity_id: UUID) -> None:
        pass


class BaseService(Generic[T, M], Service[T, M]):
    def __init__(self, schema: Type[M], repository: Repository[T]):
        self.schema = schema
        self.repository = repository

    async def get_paged(self, q: PageParams) -> PaginatedResponse[M]:
        total_count, entities, next_cursor = await self.repository.get_paged(q.skip, q.limit)
        return self.convert_to_paginated_response(total_count, entities, next_cursor)

    def convert_to_paginated_response(
        self, total_count: int, entities: List[T], next_id: Optional[int]
    ) -> PaginatedResponse[M]:
        return PaginatedResponse(
            total_count=total_count,
            items=[self.convert_to_model(entity) for entity in entities],
            next_cursor=PageParams.get_cursor(next_id),
        )

    def convert_to_model(self, entity: T) -> M:
        return self.schema.model_validate(entity)

    async def get_all(self) -> List[M]:
        entities = await self.repository.get_all()
        return [self.convert_to_model(entity) for entity in entities]

    async def get_by_id(self, entity_id: UUID) -> Optional[M]:
        entity = await self.repository.get_by_id(entity_id)
        return self.convert_to_model(entity) if entity else None

    async def create(self, **kwargs: Any) -> M:
        entity = await self.repository.create_entity(**kwargs)
        return self.convert_to_model(entity)

    async def delete_by_id(self, entity_id: UUID) -> None:
        await self.repository.delete_by_id(entity_id)


def convert_to_model(
    entity: DeclarativeMeta,
    pydantic_model: Type[M],
    custom_mapping: Optional[Dict[str, Any]] = None,
    field_mapping: Optional[Dict[str, str]] = None,
) -> M:

    custom_mapping = custom_mapping or {}
    field_mapping = field_mapping or {}

    entity_dict: Dict[str, Any] = {}

    for field in pydantic_model.model_fields:
        if field in custom_mapping:
            entity_dict[field] = custom_mapping[field]
        else:
            entity_attr = field_mapping.get(field, field)
            entity_dict[field] = getattr(entity, entity_attr, None)

    return pydantic_model.model_validate(entity_dict)
