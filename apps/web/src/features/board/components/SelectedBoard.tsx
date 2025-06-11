import { Plus } from 'lucide-react';
import React, { ReactElement, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import {
  useCreateRowMutation,
  useCreateTableMutation,
  useGetBoardByIdQuery
} from '../services/board.service';
import BoardTable from './table/BoardTable';

export type SelectedBoardProps = object;

export const SelectedBoard: React.FC<SelectedBoardProps> = (): ReactElement => {
  const { boardId } = useParams<{ boardId?: string }>();
  const {
    data: board,
    isLoading,
    error
  } = useGetBoardByIdQuery(boardId!, {
    skip: !boardId
  });

  const [createTable, { isLoading: isCreatingTable }] = useCreateTableMutation();
  const [createRow] = useCreateRowMutation();

  // Dialog states
  const [showTableDialog, setShowTableDialog] = useState<boolean>(false);
  const [tableName, setTableName] = useState<string>('New Table');

  // Loading and error states
  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Select a board to get started</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error loading board</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Board not found</div>
      </div>
    );
  }

  // Handlers
  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      return;
    }

    try {
      await createTable({
        boardId: boardId,
        name: tableName.trim()
      }).unwrap();

      setTableName('New Table');
      setShowTableDialog(false);
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tableName.trim()) {
      handleCreateTable();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
          <p className="text-gray-400 text-lg">{board.description}</p>
        </div>
      </div>

      {/* Tables */}
      <div className="flex flex-col gap-6">
        {board.tables && board.tables.length > 0 ? (
          board.tables.map((table) => (
            <BoardTable
              key={table.id}
              table={table}
              boardId={board.id}
              onAddRow={handleAddRow}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-400 mb-4">
              This board doesn&apos;t have any tables yet.
            </div>
            <div className="text-gray-500 text-sm mb-6">
              Create your first table to start organizing tasks.
            </div>
            <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first table
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Table</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Enter table name..."
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isCreatingTable}
                    autoFocus
                    className="bg-[#2a2a2a] border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowTableDialog(false)}
                    disabled={isCreatingTable}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTable}
                    disabled={isCreatingTable || !tableName.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isCreatingTable ? 'Creating...' : 'Create Table'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {board.tables && board.tables.length > 0 && (
        <div className="flex justify-center pt-4">
          <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                Add new table
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Table</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Enter table name..."
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isCreatingTable}
                  autoFocus
                  className="bg-[#2a2a2a] border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowTableDialog(false)}
                  disabled={isCreatingTable}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTable}
                  disabled={isCreatingTable || !tableName.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {isCreatingTable ? 'Creating...' : 'Create Table'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
