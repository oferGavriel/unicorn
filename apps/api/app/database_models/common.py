from typing import Annotated
from datetime import datetime
from sqlalchemy import func, Boolean, INTEGER, String, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import TIMESTAMP


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
    )


class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, doc="Soft-delete flag")


IntPk = Annotated[int, mapped_column(INTEGER, primary_key=True, autoincrement=True)]

StrLen15 = Annotated[str, mapped_column(String(15))]
StrLen50 = Annotated[str, mapped_column(String(50))]
StrLen100 = Annotated[str, mapped_column(String(100))]
StrLen255 = Annotated[str, mapped_column(String(255))]
StrLen4k = Annotated[str, mapped_column(String(4000))]

Decimal16Dot4 = Annotated[float, mapped_column(DECIMAL(precision=16, scale=4))]
