import { Plus } from 'lucide-react';
import React, { ReactElement, useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components';
import { IAuthUser } from '@/features/auth';
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
import { UserMenuDialog } from '@/features/board/components/UserMenuDialog';
import { useLogout } from '@/hooks/useLogout';
import { Spinner } from '@/shared/components/Spinner';
import { useAppSelector } from '@/store';

import { UI_IDS, UI_TITLES } from './BoardPage.consts';

export type BoardPageProps = object;

const EmptyBoardsView: React.FC<{
  onShowCreateBoardDialog: () => void;
}> = ({ onShowCreateBoardDialog }) => {
  return (
    <div className="flex h-full justify-center items-center bg-[#212121]">
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
  const loggedInUser = useAppSelector((s) => s.authUser.user) as IAuthUser;

  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState<boolean>(false);
  const [showCreateTableDialog, setShowCreateTableDialog] = useState<boolean>(false);

  const [createBoard, { isLoading: isCreatingBoard }] = useCreateBoardMutation();
  const [createTable, { isLoading: isCreatingTable }] = useCreateTableMutation();
  const { logout } = useLogout();

  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId?: string }>();

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

      const randomColor = getRandomTableColor();

      await createTable({
        boardId,
        name: tableName.trim(),
        color: randomColor
      }).unwrap();

      setShowCreateTableDialog(false);
    },
    [boardId, createTable]
  );

  const handleLogout = useCallback(async () => {
    logout();
  }, [logout]);

  return (
    <div className="bg-[#212121] h-screen flex flex-col p-2 pt-1 gap-1 ">
      <header className="flex items-center justify-between pl-1 pr-3">
        <div className="p-2 rounded-sm cursor-pointer hover:bg-accent">
          <Link to="/">
            <img
              src="https://res.cloudinary.com/dqkstk6dw/image/upload/v1755948186/full_logo_t0w6ra.png"
              alt="unicorn logo"
              className="w-24"
            />
          </Link>
        </div>

        <UserMenuDialog
          user={loggedInUser}
          onLogout={handleLogout}
          onSettings={() => navigate('/settings')}
          onProfile={() => navigate(`/profile/${loggedInUser.id}`)}
        />
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {isLoadingBoards ? (
          <Spinner size="lg" text="Loading boards..." />
        ) : boards.length === 0 ? (
          <EmptyBoardsView
            onShowCreateBoardDialog={() => setShowCreateBoardDialog(true)}
          />
        ) : (
          <div className="flex justify-between gap-3 h-full">
            <BoardSidebar
              boards={boards}
              boardId={boardId}
              isLoadingBoards={isLoadingBoards}
              onSelectBoard={onSelectBoard}
              setShowCreateBoardDialog={setShowCreateBoardDialog}
            />

            <main className="bg-selected-board-bg border-gray-700 rounded-xl flex-1 primary-shadow overflow-auto">
              <SelectedBoard
                showCreateTableDialog={() => setShowCreateTableDialog(true)}
              />
            </main>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default BoardPage;
