import { Plus } from 'lucide-react';
import React, { ReactElement } from 'react';

import { Button, ScrollArea } from '@/components/ui';
import { UI_IDS, UI_TITLES } from '@/pages/board-page/BoardPage.consts';

import { IBoardList } from '../types';
import { BoardList } from './BoardList';

export interface BoardSidebarProps {
  boards: IBoardList[];
  boardId: string | undefined;
  isLoadingBoards: boolean;
  onSelectBoard: (id: string) => void;
  setShowCreateBoardDialog: (show: boolean) => void;
}

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  boards,
  boardId,
  isLoadingBoards,
  onSelectBoard,
  setShowCreateBoardDialog
}): ReactElement => {
  return (
    <aside
      className="w-[333px] max-w-[380px] flex-shrink-0 bg-[#111111] rounded-xl border-gray-700 flex flex-col primary-shadow"
      data-testid={UI_IDS.BOARD_SIDEBAR}
    >
      <ScrollArea className="flex-1 py-4 px-3">
        {isLoadingBoards ? (
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
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowCreateBoardDialog(true)}
          disabled={isLoadingBoards}
          data-testid={UI_IDS.CREATE_BOARD_BTN}
        >
          <Plus className="h-4 w-4" />
          {UI_TITLES.CREATE_BOARD_BTN}
        </Button>
      </div>
    </aside>
  );
};
