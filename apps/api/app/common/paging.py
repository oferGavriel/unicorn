from fastapi import Query, Depends
from pydantic import Field
from typing import Annotated, TypeVar, Generic, List
from app.db.base import BaseSchema

M = TypeVar("M", bound=BaseSchema)


class PageParams:
    def __init__(
        self, cursor: str | None = Query(None), limit: int = Query(10, ge=1, le=100)
    ):
        def get_offset() -> int:
            if cursor is None:
                return 0
            return int(cursor)

        self.skip = get_offset()
        self.limit = limit

    @staticmethod
    def get_cursor(next_id: int | None) -> str | None:
        return None if next_id is None else str(next_id)


class PaginatedResponse(BaseSchema, Generic[M]):
    total_count: int = Field(description="Total number of items")
    items: List[M] = Field(description="List of items")
    next_cursor: str | None = Field(
        description="Next cursor for pagination", default=None
    )


PageParamsDep = Annotated[PageParams, Depends(PageParams)]
