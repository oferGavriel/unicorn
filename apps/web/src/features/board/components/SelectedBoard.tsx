import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, Plus } from 'lucide-react';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components';

import {
  useCreateRowMutation,
  useGetBoardByIdQuery,
  useUpdateBoardMutation,
  useUpdateTablePositionMutation
} from '../services/board.service';
import { ITable } from '../types';
import { BoardHeaderDialog } from './BoardHeaderDialog';
import BoardTable from './table/BoardTable';
import DraggableTable from './table/DraggableTable';

export interface SelectedBoardProps {
  showCreateTableDialog: () => void;
}

const EmptyTablesView: React.FC<{
  showCreateTableDialog: () => void;
}> = ({ showCreateTableDialog }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-400 text-xl mb-2">
        This board doesn&apos;t have any tables yet.
      </div>
      <div className="text-gray-500 text-lg mb-4">
        Create your first table to start organizing tasks.
      </div>
      <Button onClick={showCreateTableDialog} variant={'primary'} className="px-8">
        + Add Table
      </Button>
    </div>
  );
};

export const SelectedBoard: React.FC<SelectedBoardProps> = ({
  showCreateTableDialog
}): ReactElement => {
  const { boardId } = useParams<{ boardId?: string }>();
  const { data: board, isLoading } = useGetBoardByIdQuery(boardId!, {
    skip: !boardId
  });

  const [createRow] = useCreateRowMutation();
  const [updateTablePosition] = useUpdateTablePositionMutation();
  const [updateBoard] = useUpdateBoardMutation();
  const [activeTable, setActiveTable] = useState<ITable | null>(null);

  const sortedTables = useMemo(() => {
    return board?.tables?.slice().sort((a, b) => a.position - b.position) || [];
  }, [board?.tables]);

  const tableIds = useMemo(() => sortedTables.map((table) => table.id), [sortedTables]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      if (active.data.current?.type === 'table') {
        const draggedTable = sortedTables.find((table) => table.id === active.id);
        setActiveTable(draggedTable || null);
      }
    },
    [sortedTables]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTable(null);

      if (!over || active.id === over.id) {
        return;
      }
      if (active.data.current?.type !== 'table' || over.data.current?.type !== 'table') {
        return;
      }

      const targetIndex = sortedTables.findIndex((table) => table.id === over.id);
      const newPosition = targetIndex + 1;

      try {
        await updateTablePosition({
          boardId: boardId!,
          tableId: active.id as string,
          newPosition
        }).unwrap();
      } catch (error) {
        console.error('Failed to update table position:', error);
      }
    },
    [boardId, sortedTables, updateTablePosition]
  );

  const handleAddRow = useCallback(
    async (tableId: string, taskName: string = 'New Task') => {
      if (!boardId) {
        return;
      }

      try {
        await createRow({
          tableId,
          boardId,
          name: taskName
        }).unwrap();
      } catch (error) {
        console.error('Failed to create row:', error);
      }
    },
    [boardId, createRow]
  );

  const handleUpdateBoard = useCallback(
    async (name: string, description?: string) => {
      if (!boardId) {
        return;
      }

      await updateBoard({
        id: boardId,
        name,
        description
      }).unwrap();
    },
    [boardId, updateBoard]
  );

  if (!boardId || !board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Select a board to get started</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-xl">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-2 h-full">
      <div className="h-full overflow-y-auto">
        {sortedTables.length === 0 ? (
          <EmptyTablesView showCreateTableDialog={showCreateTableDialog} />
        ) : (
          <>
            <div className="py-4 pl-4 pr-2 sticky top-0 bg-selected-board-bg z-10">
              <BoardHeaderDialog
                board={board}
                onUpdateBoard={handleUpdateBoard}
                onBoardSettings={() => {}}
                onManageMembers={() => {}}
              >
                <div className="flex items-center gap-2 cursor-pointer rounded-sm py-1 px-2 -mt-1 w-fit hover:bg-accent transition-colors">
                  <h2 className="text-2xl font-bold text-[#eeeeee]">{board.name}</h2>
                  <ChevronDown size={25} className="text-[#aaaaaa]" />
                </div>
              </BoardHeaderDialog>
            </div>

            <div className="flex-1 pl-10">
              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={tableIds} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4">
                    {sortedTables.map((table) => (
                      <DraggableTable
                        key={table.id}
                        table={table}
                        boardId={board.id}
                        onAddRow={handleAddRow}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={null}>
                  {activeTable && (
                    <div className="opacity-90 rotate-1 scale-105 shadow-2xl border-2 border-blue-400 rounded-lg">
                      <BoardTable
                        table={activeTable}
                        boardId={board.id}
                        onAddRow={handleAddRow}
                      />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>

              <div className="flex justify-start pt-4 pb-6">
                <Button
                  onClick={showCreateTableDialog}
                  variant={'outline'}
                  className="px-4 py-2 h-auto leading-3"
                >
                  <Plus size={26} className="w-6 h-auto" />
                  Add new table
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
