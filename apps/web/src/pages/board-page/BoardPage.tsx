import { Plus } from 'lucide-react';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components';
import {
  CreateBoardDialog,
  getRandomTableColor,
  ICreateBoardRequest,
  SelectedBoard,
  useCreateBoardMutation,
  useCreateTableMutation,
  useGetBoardsQuery
} from '@/features/board';
import { BoardSidebar } from '@/features/board/components/BoardSidebar';
import { CreateTableDialog } from '@/features/board/components/CreateTableDialog';
import { Spinner } from '@/shared/components/Spinner';

import { UI_IDS, UI_TITLES } from './BoardPage.consts';

export type BoardPageProps = object;

const EmptyBoardsView: React.FC<{
  onShowCreateBoardDialog: () => void;
}> = ({ onShowCreateBoardDialog }) => {
  return (
    <div className="board-page flex w-screen h-screen justify-center items-center bg-[#212121]">
      <div className="text-center">
        <h2
          className="text-3xl font-bold text-white mb-4"
          data-testid={UI_IDS.EMPTY_BOARD_HEADER}
        >
          {UI_TITLES.EMPTY_BOARD_HEADER}
        </h2>
        <p
          className="text-gray-400 mb-6 text-xl"
          data-testid={UI_IDS.EMPTY_BOARD_MESSAGE}
        >
          {UI_TITLES.EMPTY_BOARD_MESSAGE}
        </p>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={onShowCreateBoardDialog}
          data-testid={UI_IDS.EMPTY_BOARD_CREATE_BTN}
        >
          <Plus className="h-4 w-4" />
          {UI_TITLES.EMPTY_BOARD_CREATE_BTN}
        </Button>
      </div>
    </div>
  );
};

const BoardPage: React.FC<BoardPageProps> = (): ReactElement => {
  const { data: boards = [], isLoading: isLoadingBoards } = useGetBoardsQuery();

  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState<boolean>(false);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState<boolean>(false);

  const [createBoard, { isLoading: isCreatingBoard }] = useCreateBoardMutation();
  const [createTable, { isLoading: isCreatingTable }] = useCreateTableMutation();

  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId?: string }>();

  useEffect(() => {
    if (!boardId && boards.length > 0 && !isLoadingBoards) {
      navigate(`/boards/${boards[0].id}`, { replace: true });
    }
  }, [boards, boardId, navigate, isLoadingBoards]);

  const onSelectBoard = useCallback(
    (id: string) => {
      navigate(`/boards/${id}`);
    },
    [navigate]
  );

  const handleCreateBoard = useCallback(
    async (payload: ICreateBoardRequest) => {
      const newBoard = await createBoard(payload).unwrap();
      navigate(`/boards/${newBoard.id}`);
      setShowCreateBoardDialog(false);
    },
    [createBoard, navigate]
  );

  const handleCreateTable = useCallback(
    async (tableName: string): Promise<void> => {
      if (!tableName.trim() || !boardId) {
        return;
      }

      try {
        const randomColor = getRandomTableColor();

        await createTable({
          boardId,
          name: tableName.trim(),
          color: randomColor
        }).unwrap();

        setShowCreateTableDialog(false);
      } catch (error) {
        console.error('Failed to create table:', error);
      }
    },
    [boardId, createTable]
  );

  return (
    <>
      {isLoadingBoards ? (
        <Spinner />
      ) : boards.length === 0 ? (
        <EmptyBoardsView onShowCreateBoardDialog={() => setShowCreateBoardDialog(true)} />
      ) : (
        <div className="board-page flex w-screen h-screen justify-between bg-[#212121] p-3 gap-3">
          <BoardSidebar
            boards={boards}
            boardId={boardId}
            isLoadingBoards={isLoadingBoards}
            onSelectBoard={onSelectBoard}
            setShowCreateBoardDialog={setShowCreateBoardDialog}
          />

          <main className="bg-[#111111] border-gray-700 rounded-xl flex-1 overflow-y-hidden primary-shadow">
            <SelectedBoard showCreateTableDialog={() => setShowCreateTableDialog(true)} />
          </main>
        </div>
      )}

      <CreateBoardDialog
        isOpen={showCreateBoardDialog}
        onClose={() => setShowCreateBoardDialog(false)}
        onCreateBoard={handleCreateBoard}
        isCreatingBoard={isCreatingBoard}
      />

      <CreateTableDialog
        isOpen={showCreateTableDialog}
        onClose={() => setShowCreateTableDialog(false)}
        onCreateTable={handleCreateTable}
        isCreatingTable={isCreatingTable}
      />
    </>
  );
};

export default BoardPage;
