import {
  closestCenter,
  DndContext,
  DraggableAttributes,
  DragOverlay
} from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { UI_IDS } from '@/pages/board-page/BoardPage.consts';
import { ColorPicker } from '@/shared/components/ColorPicker';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EditableText } from '@/shared/components/EditableText';

import { useRowDragAndDrop } from '../../hooks/useRowDragAndDrop';
import {
  useDeleteTableMutation,
  useDuplicateTableMutation,
  useUpdateRowMutation,
  useUpdateTableMutation
} from '../../services/board.service';
import { IRow } from '../../types/row.interface';
import { ITable, TABLE_COLUMNS, TableColor } from '../../types/table.interface';
import { createTableColumns } from '../table/columns';
import TableBody from '../table/TableBody';
import TableHeader from '../table/TableHeader';
import { TableMenuDialog } from '../TableMenuDialog';
import TableFooter from './TableFooter';

interface BoardTableProps {
  table: ITable;
  boardId: string;
  onAddRow: (tableId: string, taskName: string) => Promise<void>;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap | undefined;
  isDragging?: boolean;
}

const BoardTable: React.FC<BoardTableProps> = ({
  table,
  boardId,
  onAddRow,
  dragAttributes,
  dragListeners,
  isDragging = false
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  const handleEditingChange = useCallback((rowId: string, isEditing: boolean) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      if (isEditing) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  const [updateRow] = useUpdateRowMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable, { isLoading: isDeletingTable }] = useDeleteTableMutation();
  const [duplicateTable] = useDuplicateTableMutation();

  const sortedTableData = useMemo(() => {
    return [...(table.rows || [])].sort((a, b) => a.position - b.position);
  }, [table.rows]);

  const filteredDragListeners = useMemo(() => {
    if (!dragListeners) {
      return undefined;
    }

    return {
      ...dragListeners,
      onPointerDown: (event: React.PointerEvent) => {
        const target = event.target as Element;
        const isInteractiveElement =
          target.closest('[role="dialog"]') ||
          target.closest('[role="menu"]') ||
          target.closest('[data-editable-text]') ||
          target.closest('[data-color-picker]');

        // Disable dragging if any row is being edited
        if (isInteractiveElement || editingRows.size > 0) {
          event.stopPropagation();
          return;
        }

        dragListeners.onPointerDown?.(event);
      }
    };
  }, [dragListeners, editingRows]);

  const {
    sensors: rowSensors,
    activeRow,
    handleDragStart: handleRowDragStart,
    handleDragEnd: handleRowDragEnd
  } = useRowDragAndDrop({
    boardId,
    tableId: table.id,
    rows: sortedTableData
  });

  const columns = useMemo<ColumnDef<IRow>[]>(
    () =>
      createTableColumns(
        boardId,
        TABLE_COLUMNS,
        table.color,
        updateRow,
        handleEditingChange
      ),
    [updateRow, boardId, table.color, handleEditingChange]
  );

  const tableInstance = useReactTable({
    data: sortedTableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters
    },
    getRowId: (row) => row.id
  });

  const handleAddTask = async (taskName: string) => {
    try {
      await onAddRow(table.id, taskName);
    } catch (error) {
      toast.error('Failed to add task');
      console.error('Failed to add task:', error);
      throw error;
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleTableNameSave = async (newName: string) => {
    try {
      await updateTable({
        boardId: table.boardId,
        tableId: table.id,
        name: newName
      }).unwrap();
    } catch (error) {
      toast.error('Failed to update table name');
      throw error;
    }
  };

  const handleTableColorChange = async (newColor: TableColor) => {
    try {
      await updateTable({
        boardId: table.boardId,
        tableId: table.id,
        color: newColor
      }).unwrap();
    } catch (error) {
      toast.error('Failed to update table color');
      throw error;
    }
  };

  const confirmDelete = useCallback(async () => {
    try {
      await deleteTable({
        boardId: table.boardId,
        tableId: table.id
      }).unwrap();
    } catch (error) {
      toast.error('Failed to delete table');
      console.error('Failed to delete table:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [deleteTable, table.boardId, table.id]);

  const handleDuplicateTable = useCallback(async () => {
    duplicateTable({
      boardId: table.boardId,
      tableId: table.id
    })
      .unwrap()
      .then(() => {
        toast.success(`Table "${table.name}" duplicated successfully`);
      })
      .catch((error) => {
        toast.error('Failed to duplicate table');
        console.error('Failed to duplicate table:', error);
      });
  }, [duplicateTable, table.boardId, table.id, table.name]);

  const handleDeleteTable = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  return (
    <div className="shadow-sm mt-2">
      {/* Table Header */}
      <div
        className={`group flex items-center gap-2 mx-2 relative cursor-grab active:cursor-grabbing
        ${isDragging ? 'cursor-grabbing' : ''} rounded-lg p-2 transition-colors`}
        {...dragAttributes}
        {...filteredDragListeners}
        title="Drag to reorder table"
      >
        <div
          className="absolute -left-12 group-hover:opacity-100 opacity-0 cursor-pointer p-1"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <TableMenuDialog
            onDuplicate={handleDuplicateTable}
            onDelete={handleDeleteTable}
            isDeleting={isDeletingTable}
          />
        </div>

        <ColorPicker selectedColor={table.color} onColorChange={handleTableColorChange} />
        <EditableText
          value={table.name}
          onSave={handleTableNameSave}
          className="text-lg font-semibold"
          inputClassName="text-lg font-semibold"
          style={{ color: table.color }}
          title="Click to edit table name"
        />

        {table.rows.length >= 1 && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm text-gray-400">
            {table.rows.length} Tasks
          </span>
        )}
      </div>

      <div className="my-2 relative">
        <DndContext
          sensors={rowSensors}
          collisionDetection={closestCenter}
          onDragStart={handleRowDragStart}
          onDragEnd={handleRowDragEnd}
        >
          <div className="min-w-full text-sm text-center board-table">
            <TableHeader table={tableInstance} />
            <TableBody
              table={tableInstance}
              boardId={boardId}
              tableId={table.id}
              editingRows={editingRows}
            />
            <TableFooter
              table={table}
              isAddingTask={isAddingTask}
              setIsAddingTask={setIsAddingTask}
              onAddTask={handleAddTask}
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeRow && (
              <div className="opacity-90 shadow-xl border border-blue-400 rounded bg-[#2a2a2a] min-h-[36px] flex items-center px-4">
                <span className="text-white font-medium">{activeRow.name}</span>
                <span className="ml-2 text-gray-400 text-sm">Moving row...</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Table"
        message={`Are you sure you want to delete "${table.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeletingTable}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmBtnDataTestId={UI_IDS.DELETE_TABLE_BTN_CONFIRMATION}
        cancelBtnDataTestId={UI_IDS.DELETE_TABLE_CANCEL_BTN}
      />
    </div>
  );
};

export default BoardTable;
