import { Plus } from 'lucide-react';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components';
import {
  CreateBoardDialog,
  ICreateBoardRequest,
  SelectedBoard,
  useCreateBoardMutation,
  useGetBoardsQuery
} from '@/features/board';
import { BoardSidebar } from '@/features/board/components/BoardSidebar';

import { UI_IDS, UI_TITLES } from './BoardPage.consts';

export type BoardPageProps = object;

export const BoardPage: React.FC<BoardPageProps> = (): ReactElement => {
  const { data: boards = [], isLoading: boardsLoading } = useGetBoardsQuery();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [createBoard] = useCreateBoardMutation();

  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId?: string }>();

  useEffect(() => {
    if (!boardId && boards.length > 0 && !boardsLoading) {
      navigate(`/boards/${boards[0].id}`, { replace: true });
    }
  }, [boards, boardId, navigate, boardsLoading]);

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
      setShowModal(false);
    },
    [createBoard, navigate]
  );

  // Show empty state when no boards exist
  if (!boardsLoading && boards.length === 0) {
    return (
      <div className="board-page flex w-screen h-screen justify-center items-center bg-[#212121]">
        <div className="text-center">
          <h2
            className="text-2xl font-bold text-white mb-4"
            data-testid={UI_IDS.EMPTY_BOARD_HEADER}
          >
            {UI_TITLES.EMPTY_BOARD_HEADER}
          </h2>
          <p className="text-gray-400 mb-6" data-testid={UI_IDS.EMPTY_BOARD_MESSAGE}>
            {UI_TITLES.EMPTY_BOARD_MESSAGE}
          </p>
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setShowModal(true)}
            data-testid={UI_IDS.EMPTY_BOARD_CREATE_BTN}
          >
            <Plus className="h-4 w-4" />
            {UI_TITLES.EMPTY_BOARD_CREATE_BTN}
          </Button>
        </div>

        <CreateBoardDialog
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreateBoard={handleCreateBoard}
        />
      </div>
    );
  }

  return (
    <div className="board-page flex w-screen h-screen justify-between bg-[#212121] p-3 gap-3">
      <BoardSidebar
        boards={boards}
        boardId={boardId}
        boardsLoading={boardsLoading}
        onSelectBoard={onSelectBoard}
        setShowModal={setShowModal}
      />

      <main className="bg-gray-800 dark:bg-zinc-900 rounded-xl border-gray-700 flex-1 py-4 pl-4 pr-2">
        <SelectedBoard />
      </main>

      <CreateBoardDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreateBoard={handleCreateBoard}
      />
    </div>
  );
};
