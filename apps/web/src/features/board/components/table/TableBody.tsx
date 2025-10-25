import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { type Table as TanStackTable } from '@tanstack/react-table';
import React, { useMemo } from 'react';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

import { useRowOperations } from '../../hooks/useRowOperations';
import { IRow } from '../../types/row.interface';
import DraggableRow from './DraggableRow';

interface TableBodyProps {
  table: TanStackTable<IRow>;
  boardId: string;
  tableId: string;
  editingRows?: Set<string>;
}

const TableBody: React.FC<TableBodyProps> = ({
  table,
  boardId,
  tableId,
  editingRows = new Set()
}) => {
  const {
    deleteRowData,
    isDeletingRow,
    handleDuplicateRow,
    handleDeleteRow,
    confirmDeleteRow,
    cancelDeleteRow
  } = useRowOperations({ boardId, tableId });

  const rows = table.getRowModel().rows;
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  if (rows.length === 0) {
    return <div className="board-table-body bg-board-table-color"></div>;
  }

  return (
    <>
      <div className="board-table-body bg-board-table-color">
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {rows.map((row) => (
            <DraggableRow
              key={row.id}
              row={row}
              tableId={tableId}
              boardId={boardId}
              onDuplicate={handleDuplicateRow}
              onDelete={handleDeleteRow}
              isDeleting={isDeletingRow}
              isEditing={editingRows.has(row.original.id)}
            />
          ))}
        </SortableContext>
      </div>

      <ConfirmDialog
        isOpen={!!deleteRowData}
        title="Delete Row"
        message={`Are you sure you want to delete "${deleteRowData?.rowName}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeletingRow}
        onConfirm={confirmDeleteRow}
        onCancel={cancelDeleteRow}
        confirmBtnDataTestId="delete-row-confirm-btn"
        cancelBtnDataTestId="delete-row-cancel-btn"
      />
    </>
  );
};

export default TableBody;
