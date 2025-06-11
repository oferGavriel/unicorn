"""Refactor Row and Table tables

Revision ID: e46bc7639572
Revises: 88450a8bd5b4
Create Date: 2025-05-31 17:04:02.731776

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e46bc7639572'
down_revision: Union[str, None] = '88450a8bd5b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Create the enum type first
    tablecolorenum = postgresql.ENUM(
        'RED',
        'ORANGE',
        'YELLOW',
        'GREEN',
        'BLUE',
        'PURPLE',
        'PINK',
        'CYAN',
        'LIME',
        'MAGENTA',
        'BROWN',
        'GRAY',
        'BLACK',
        'WHITE',
        'DEFAULT',
        name='tablecolorenum',
    )
    tablecolorenum.create(op.get_bind())

    # 2. Add owners column as nullable first
    op.add_column('rows', sa.Column('owners', sa.ARRAY(sa.UUID()), nullable=True))

    # 3. Migrate existing assignee_id to owners array
    op.execute(
        """
        UPDATE rows
        SET owners = CASE
            WHEN assignee_id IS NOT NULL THEN ARRAY[assignee_id]
            ELSE ARRAY[]::uuid[]
        END
    """
    )

    # 4. Now make owners NOT NULL
    op.alter_column('rows', 'owners', nullable=False)

    # 5. Drop old assignee_id column
    op.drop_constraint('rows_assignee_id_fkey', 'rows', type_='foreignkey')
    op.drop_column('rows', 'assignee_id')
    op.drop_column('rows', 'description')

    # 6. Add table columns with defaults
    op.add_column(
        'tables',
        sa.Column(
            'color',
            sa.Enum(
                'RED',
                'ORANGE',
                'YELLOW',
                'GREEN',
                'BLUE',
                'PURPLE',
                'PINK',
                'CYAN',
                'LIME',
                'MAGENTA',
                'BROWN',
                'GRAY',
                'BLACK',
                'WHITE',
                'DEFAULT',
                name='tablecolorenum',
            ),
            nullable=True,
        ),
    )
    op.add_column('tables', sa.Column('position', sa.Integer(), nullable=True))

    # 7. Set default values for existing tables
    op.execute("UPDATE tables SET color = 'DEFAULT' WHERE color IS NULL")
    op.execute("UPDATE tables SET position = 0 WHERE position IS NULL")

    # 8. Make columns NOT NULL
    op.alter_column('tables', 'color', nullable=False)
    op.alter_column('tables', 'position', nullable=False)

    # 9. Drop version column
    op.drop_column('tables', 'version')


def downgrade() -> None:
    """Downgrade schema."""
    # Add version column back
    op.add_column('tables', sa.Column('version', sa.INTEGER(), autoincrement=False, nullable=False, server_default='1'))

    # Drop new columns
    op.drop_column('tables', 'position')
    op.drop_column('tables', 'color')

    # Add back old row columns
    op.add_column('rows', sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('rows', sa.Column('assignee_id', sa.UUID(), autoincrement=False, nullable=True))

    # Migrate owners back to assignee_id (take first owner if exists)
    op.execute(
        """
        UPDATE rows
        SET assignee_id = CASE
            WHEN array_length(owners, 1) > 0 THEN owners[1]
            ELSE NULL
        END
    """
    )

    # Recreate foreign key
    op.create_foreign_key('rows_assignee_id_fkey', 'rows', 'users', ['assignee_id'], ['id'])

    # Drop owners column
    op.drop_column('rows', 'owners')

    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS tablecolorenum')
