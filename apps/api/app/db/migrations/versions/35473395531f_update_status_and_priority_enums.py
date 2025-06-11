"""update_status_and_priority_enums

Revision ID: 35473395531f
Revises: df70f4888fe7
Create Date: 2025-05-31 20:29:29.327123

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '35473395531f'
down_revision: Union[str, None] = 'df70f4888fe7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update StatusEnum
    op.execute("ALTER TYPE statusenum RENAME TO statusenum_old")
    op.execute("CREATE TYPE statusenum AS ENUM ('not_started', 'stuck', 'working_on_it', 'done')")
    op.execute(
        "ALTER TABLE rows ALTER COLUMN status TYPE statusenum USING "
        "CASE status::text "
        "WHEN 'todo' THEN 'not_started'::statusenum "
        "WHEN 'in_progress' THEN 'working_on_it'::statusenum "
        "WHEN 'done' THEN 'done'::statusenum "
        "ELSE 'not_started'::statusenum END"
    )
    op.execute("DROP TYPE statusenum_old")

    # Update PriorityEnum
    op.execute("ALTER TYPE priorityenum RENAME TO priorityenum_old")
    op.execute("CREATE TYPE priorityenum AS ENUM ('low', 'medium', 'high', 'critical')")
    op.execute(
        "ALTER TABLE rows ALTER COLUMN priority TYPE priorityenum USING "
        "CASE priority::text "
        "WHEN 'low' THEN 'low'::priorityenum "
        "WHEN 'medium' THEN 'medium'::priorityenum "
        "WHEN 'high' THEN 'high'::priorityenum "
        "ELSE 'medium'::priorityenum END"
    )
    op.execute("DROP TYPE priorityenum_old")


def downgrade() -> None:
    # Revert StatusEnum
    op.execute("ALTER TYPE statusenum RENAME TO statusenum_old")
    op.execute("CREATE TYPE statusenum AS ENUM ('todo', 'in_progress', 'done')")
    op.execute(
        "ALTER TABLE rows ALTER COLUMN status TYPE statusenum USING "
        "CASE status::text "
        "WHEN 'not_started' THEN 'todo'::statusenum "
        "WHEN 'stuck' THEN 'todo'::statusenum "
        "WHEN 'working_on_it' THEN 'in_progress'::statusenum "
        "WHEN 'done' THEN 'done'::statusenum "
        "ELSE 'todo'::statusenum END"
    )
    op.execute("DROP TYPE statusenum_old")

    # Revert PriorityEnum
    op.execute("ALTER TYPE priorityenum RENAME TO priorityenum_old")
    op.execute("CREATE TYPE priorityenum AS ENUM ('low', 'medium', 'high')")
    op.execute(
        "ALTER TABLE rows ALTER COLUMN priority TYPE priorityenum USING "
        "CASE priority::text "
        "WHEN 'low' THEN 'low'::priorityenum "
        "WHEN 'medium' THEN 'medium'::priorityenum "
        "WHEN 'high' THEN 'high'::priorityenum "
        "WHEN 'critical' THEN 'high'::priorityenum "
        "ELSE 'medium'::priorityenum END"
    )
    op.execute("DROP TYPE priorityenum_old")
