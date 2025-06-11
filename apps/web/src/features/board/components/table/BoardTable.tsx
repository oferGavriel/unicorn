import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EditableText } from '@/shared/components/EditableText';
import { TableColorEnum } from '@/shared/shared.enum';

import {
  useUpdateRowMutation,
  useUpdateTableMutation
} from '../../services/board.service';
import { IRow } from '../../types/row.interface';
import { ITable, TABLE_COLUMNS } from '../../types/table.interface';
import { ColorPicker } from '../table/ColorPicker';
import { createTableColumns } from '../table/columns';
import TableBody from '../table/TableBody';
import TableHeader from '../table/TableHeader';
import { IndicatorCell } from './cells';

interface BoardTableProps {
  table: ITable;
  boardId: string;
  onAddRow: (tableId: string, taskName: string) => Promise<void>;
  onRowMove?: (
    rowId: string,
    fromTableId: string,
    toTableId: string,
    newPosition: number
  ) => void;
}

const BoardTable: React.FC<BoardTableProps> = ({
  table,
  boardId,
  onAddRow /*,onRowMove*/
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  const [updateRow] = useUpdateRowMutation();
  const [updateTable] = useUpdateTableMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo<ColumnDef<IRow>[]>(
    () => createTableColumns(boardId, TABLE_COLUMNS, table.color, updateRow),
    [updateRow, boardId, table.color]
  );

  const tableInstance = useReactTable({
    data: table.rows || [],
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

  const handleTableColorChange = async (newColor: TableColorEnum) => {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeRow = table.rows?.find((row) => row.id === active.id);
    const overRow = table.rows?.find((row) => row.id === over.id);

    if (!activeRow || !overRow) {
      return;
    }

    const newPosition = overRow.position;

    try {
      await updateRow({
        tableId: table.id,
        rowId: activeRow.id,
        position: newPosition,
        boardId
      });
    } catch (error) {
      console.error('Failed to update row position:', error);
    }
  };

  const rowIds = useMemo(() => (table.rows || []).map((row) => row.id), [table.rows]);

  return (
    <div className="shadow-sm">
      {/* Table Header */}
      <div className="group flex items-center gap-2 mx-2">
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

      {/* Table Content */}
      <div className="my-2 border-gray-600 bg-board-table-color">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="min-w-full text-sm text-center board-table">
            <TableHeader table={tableInstance} />
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              <TableBody table={tableInstance} tableColor={table.color} />
            </SortableContext>
          </div>
        </DndContext>

        {/* Add Row Button */}
        <div className="flex h-9">
          <div className="w-[6px] flex-shrink-0">
            <IndicatorCell tableColor={table.color} position="add-row" />{' '}
          </div>
          <div className="w-full border-b border-gray-600 flex items-center">
            <div className="mx-[6px]">
              {isAddingTask ? (
                <div className="flex items-center gap-2 w-full  h-full">
                  <EditableText
                    value=""
                    onSave={handleAddTask}
                    className="text-gray-400 w-full max-w-80 py-2 h-full"
                    inputClassName="text-gray-400 bg-transparent outline-none max-w-72"
                    placeholder="Enter task name..."
                    validateEmpty={true}
                    autoEdit={true}
                    onCancel={() => setIsAddingTask(false)}
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="flex justify-start w-64 h-6 gap-1 ml-6 text-gray-400 hover:text-white"
                  size="sm"
                  onClick={() => setIsAddingTask(true)}
                >
                  <Plus size={12} />
                  Add task
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardTable;
