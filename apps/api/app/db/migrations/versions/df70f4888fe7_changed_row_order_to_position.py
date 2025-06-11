"""changed row order to position

Revision ID: df70f4888fe7
Revises: e46bc7639572
Create Date: 2025-05-31 17:18:40.737512

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df70f4888fe7'
down_revision: Union[str, None] = 'e46bc7639572'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('rows', sa.Column('position', sa.Integer(), nullable=True))
    op.execute('UPDATE rows SET position = "order"')
    op.alter_column('rows', 'position', nullable=False)
    op.drop_index('ix_rows_table_order', table_name='rows')
    op.create_index('ix_rows_table_position', 'rows', ['table_id', 'position'], unique=False)
    op.drop_column('rows', 'order')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('rows', sa.Column('order', sa.INTEGER(), autoincrement=False, nullable=True))
    op.execute('UPDATE rows SET "order" = position')
    op.alter_column('rows', 'order', nullable=False)
    op.drop_index('ix_rows_table_position', table_name='rows')
    op.create_index('ix_rows_table_order', 'rows', ['table_id', 'order'], unique=False)
    op.drop_column('rows', 'position')
