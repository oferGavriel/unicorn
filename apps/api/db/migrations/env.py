from __future__ import annotations

from logging.config import fileConfig

import os
from sqlalchemy import pool
from sqlalchemy.engine import Connection, create_engine

from alembic import context
from db.base import Base
from app.models.user import User


config = context.config
fileConfig(config.config_file_name)

# database URL from env
def _db_url() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")        # default 5432
    name = os.getenv("DB_NAME", "mondaylite")
    user = os.getenv("DB_USER", "postgres")
    pw   = os.getenv("DB_PASS", "3578")
    return f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{name}"

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", _db_url())


def run_migrations_offline() -> None:
    """Run migrations in --sql mode."""
    context.configure(
        url=_db_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB."""
    connectable = create_engine(_db_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:  # type: Connection
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()