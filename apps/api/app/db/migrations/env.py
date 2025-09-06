from __future__ import annotations

from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import create_engine

from alembic import context
import app.database_models  # noqa: F401
from app.db.base import Base
from app.core.config import get_settings

settings = get_settings()

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


if not settings.db_url_sync:
    raise ValueError("Missing database URL in settings (db_url_sync)")

config.set_main_option("sqlalchemy.url", str(settings.db_url_sync))
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in --sql mode."""
    context.configure(
        url=settings.db_url_sync,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB."""
    connectable = create_engine(settings.db_url_sync, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
