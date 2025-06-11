"""rename_table_order_to_position

Revision ID: 14881d44b88f
Revises: 35473395531f
Create Date: 2025-06-01 13:33:21.904377

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14881d44b88f'
down_revision: Union[str, None] = '35473395531f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Copy data from order to position if position is null
    op.execute("UPDATE tables SET position = \"order\" WHERE position IS NULL")

    # Drop the order column since position already exists
    op.drop_column('tables', 'order')


def downgrade() -> None:
    # Add order column back
    op.add_column('tables', sa.Column('order', sa.Integer(), nullable=True))

    # Copy data from position to order
    op.execute("UPDATE tables SET \"order\" = position")

    # Make order not null
    op.alter_column('tables', 'order', nullable=False)
