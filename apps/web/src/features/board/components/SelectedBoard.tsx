import { ChevronDown, Plus } from 'lucide-react';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components';

import { useCreateRowMutation, useGetBoardByIdQuery } from '../services/board.service';
import BoardTable from './table/BoardTable';

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

  const handleAddRow = async (tableId: string, taskName: string = 'New Task') => {
    try {
      await createRow({
        tableId,
        boardId,
        name: taskName,
        position: board.tables?.find((t) => t.id === tableId)?.rows?.length || 0
      }).unwrap();
    } catch (error) {
      console.error('Failed to create row:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 h-screen">
      {!board.tables || board.tables.length === 0 ? (
        <EmptyTablesView showCreateTableDialog={showCreateTableDialog} />
      ) : (
        <>
          <div className="py-4 pl-4 pr-2">
            <div className="flex items-center gap-2 cursor-pointer rounded-sm py-1 px-2 -mt-1 w-fit hover:bg-accent">
              <h2 className="text-2xl font-bold text-[#eeeeee]">{board.name}</h2>
              <ChevronDown size={25} className="text-[#aaaaaa]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pl-10">
            <div className="flex flex-col gap-4">
              {board.tables.map((table) => (
                <BoardTable
                  key={table.id}
                  table={table}
                  boardId={board.id}
                  onAddRow={handleAddRow}
                  boardMembers={board.members}
                />
              ))}

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
          </div>
        </>
      )}
    </div>
  );
};
