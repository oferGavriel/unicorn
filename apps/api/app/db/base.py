from sqlalchemy import MetaData
from pydantic import ConfigDict, BaseModel
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import declarative_base, declared_attr

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        protected_namespaces=(),
        arbitrary_types_allowed=True,
    )


class BaseMixin:
    @declared_attr  # type: ignore
    def __tablename__(cls) -> str:  # noqa: N805
        return cls.__name__.lower() + "s"  # type: ignore

    def __repr__(self) -> str:
        pk = getattr(self, "id", None)
        return f"<{self.__class__.__name__}(id={pk})>"


Base = declarative_base(cls=BaseMixin)
