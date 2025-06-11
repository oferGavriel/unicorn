import { Plus } from 'lucide-react';
import React, { ReactElement } from 'react';

import { Button, ScrollArea } from '@/components/ui';
import { UI_IDS, UI_TITLES } from '@/pages/board-page/BoardPage.consts';

import { IBoardList } from '../types';
import { BoardList } from './BoardList';

export interface BoardSidebarProps {
  boards: IBoardList[];
  boardId: string | undefined;
  boardsLoading: boolean;
  onSelectBoard: (id: string) => void;
  setShowModal: (show: boolean) => void;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  boards,
  boardId,
  boardsLoading,
  onSelectBoard,
  setShowModal
}): ReactElement => {
  return (
    <aside
      className="w-[333px] max-w-[380px] bg-gray-800 dark:bg-zinc-900 rounded-xl border-gray-700 flex flex-col"
      data-testid={UI_IDS.BOARD_SIDEBAR}
    >
      <ScrollArea className="flex-1 p-4">
        {boardsLoading ? (
          <p className="text-gray-200" data-testid={UI_IDS.LOADING_BOARDS}>
            {UI_TITLES.LOADING_BOARDS}
          </p>
        ) : (
          <BoardList
            boards={boards}
            selectedBoardId={boardId ?? null}
            onSelectBoard={onSelectBoard}
          />
        )}
      </ScrollArea>

      <div className="p-4">
        <Button
          variant="default"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowModal(true)}
          disabled={boardsLoading}
          data-testid={UI_IDS.CREATE_BOARD_BTN}
        >
          <Plus className="h-4 w-4" />
          {UI_TITLES.CREATE_BOARD_BTN}
        </Button>
      </div>
    </aside>
  );
};
