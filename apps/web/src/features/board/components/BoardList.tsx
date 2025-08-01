import {
  CircleCheck,
  ExternalLink,
  House,
  MoreHorizontal,
  Pencil,
  SquareChartGantt,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UI_IDS, UI_TITLES } from '@/pages/board-page/BoardPage.consts';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EditableText } from '@/shared/components/EditableText';

import {
  useDeleteBoardMutation,
  useDuplicateBoardMutation,
  useUpdateBoardMutation
} from '../services/board.service';
import type { IBoardList } from '../types/board.interface';

export interface BoardListProps {
  boards: IBoardList[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
}

export const BoardList: React.FC<BoardListProps> = ({
  boards,
  selectedBoardId,
  onSelectBoard
}) => {
  const [updateBoard] = useUpdateBoardMutation();
  const [deleteBoard, { isLoading: isDeleting }] = useDeleteBoardMutation();
  const [duplicateBoard, { isLoading: isDuplicating }] = useDuplicateBoardMutation();

  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [isShowDeleteDialog, setIsShowDeleteDialog] = useState<boolean>(false);
  const [boardToDelete, setBoardToDelete] = useState<IBoardList | null>(null);

  const navigate = useNavigate();

  const handleBoardNameSave = (boardId: string) => {
    return async (newName: string) => {
      if (!newName.trim()) {
        throw new Error('Name cannot be empty');
      }

      await updateBoard({ id: boardId, name: newName.trim() }).unwrap();
      setEditingBoardId(null);
    };
  };

  const startEditing = (boardId: string): void => {
    setEditingBoardId(boardId);
  };

  const cancelEditing = (): void => {
    setEditingBoardId(null);
  };

  const showDeleteDialog = (board: IBoardList): void => {
    setBoardToDelete(board);
    setIsShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!boardToDelete) {
      return;
    }

    setIsShowDeleteDialog(false);
    setBoardToDelete(null);
    if (selectedBoardId === boardToDelete.id) {
      navigate('/boards');
    }
    await deleteBoard(boardToDelete.id).unwrap();
  };

  const cancelDelete = () => {
    setIsShowDeleteDialog(false);
    setBoardToDelete(null);
  };

  const handleDuplicate = async (board: IBoardList) => {
    const newBoard = await duplicateBoard(board.id).unwrap();
    navigate(`/boards/${newBoard.id}`);
  };

  return (
    <>
      <ScrollArea className="flex flex-col">
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-start gap-2"
          onClick={() => navigate('/')}
          data-testid={UI_IDS.HOME_BTN}
        >
          <House className="w-4 h-4" />
          {UI_TITLES.HOME_BTN}
        </Button>
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-start gap-2"
          onClick={() => toast.warning('My Work button clicked')}
          data-testid={UI_IDS.MY_WORK_BTN}
        >
          <CircleCheck className="w-4 h-4" />
          {UI_TITLES.MY_WORK_BTN}
        </Button>

        <Separator className="my-4 bg-gray-500" />

        <h3
          className="px-3 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2"
          data-testid={UI_IDS.BOARD_HEADER}
        >
          {UI_TITLES.BOARD_HEADER}
        </h3>

        {boards.map((board) => {
          const isSelected = board.id === selectedBoardId;
          const isEditing = editingBoardId === board.id;

          return (
            <div key={board.id} className="relative flex items-center group">
              {isEditing ? (
                // Use EditableText in auto-edit mode
                <div className="w-full p-2 my-1">
                  <EditableText
                    value={board.name}
                    onSave={handleBoardNameSave(board.id)}
                    onCancel={cancelEditing}
                    autoEdit={true}
                    className="w-full"
                    inputClassName="w-full text-sm bg-[#1a1a1a] border-gray-600 text-white"
                    placeholder="Enter board name..."
                    maxLength={40}
                    data-testid={UI_IDS.BOARD_EDIT_NAME_INPUT}
                  />
                </div>
              ) : (
                // Normal display mode
                <div
                  className={`w-full flex items-center gap-2 p-2 my-1 text-left pr-10 rounded-md text-sm single-line cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary' : 'hover:bg-accent'}`}
                  onClick={() => onSelectBoard(board.id)}
                  data-testid={UI_IDS.SELECT_BOARD_BTN}
                >
                  <SquareChartGantt strokeWidth={1.5} size={18} />
                  <span className="block">{board.name}</span>
                </div>
              )}

              {/* Dropdown Menu - hide when editing */}
              {!isEditing && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      data-testid={UI_IDS.BOARD_DROPDOWN_MENU_OPEN_BTN}
                    >
                      <Button
                        size="sm"
                        className="px-2 py-1 h-full flex bg-zinc-500 hover:bg-zinc-600 relative"
                        tabIndex={-1}
                      >
                        <MoreHorizontal className="w-4 h-2" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="start"
                      className="bg-secondary text-white border-0 shadow-[0px_6px_20px_#000000] min-w-64 p-1"
                    >
                      <DropdownMenuItem
                        onClick={() => window.open(`/boards/${board.id}`, '_blank')}
                        className="board-list-menu-item"
                        data-testid={UI_IDS.OPEN_IN_NEW_TAB_BTN}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {UI_TITLES.OPEN_IN_NEW_TAB_BTN}
                      </DropdownMenuItem>

                      <Separator className="my-1 bg-zinc-700" />

                      <DropdownMenuItem
                        onSelect={() => startEditing(board.id)}
                        className="board-list-menu-item"
                        data-testid={UI_IDS.RENAME_BOARD_BTN}
                      >
                        <Pencil className="w-4 h-4" />
                        {UI_TITLES.RENAME_BOARD_BTN}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="board-list-menu-item text-blue-400"
                        onClick={() => handleDuplicate(board)}
                        disabled={isDuplicating}
                        data-testid={UI_IDS.DUPLICATE_BOARD_BTN}
                      >
                        <SquareChartGantt className="w-4 h-4" />
                        {isDuplicating ? 'Duplicating...' : UI_TITLES.DUPLICATE_BOARD_BTN}
                      </DropdownMenuItem>

                      <Separator className="my-1 bg-zinc-700" />

                      <DropdownMenuItem
                        className="board-list-menu-item text-red-500 focus:text-red-500"
                        data-testid={UI_IDS.DELETE_BOARD_BTN}
                        onClick={() => showDeleteDialog(board)}
                      >
                        <Trash2 className="w-4 h-4" />
                        {UI_TITLES.DELETE_BOARD_BTN}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>

      <ConfirmDialog
        isOpen={isShowDeleteDialog}
        title={UI_TITLES.DELETE_BOARD_TITLE}
        message={`Are you sure you want to delete <strong>"${boardToDelete?.name}"</strong>?<br/><br/>This action cannot be undone.`}
        cancelText={UI_TITLES.DELETE_BOARD_CANCEL_BTN}
        confirmText={UI_TITLES.DELETE_BOARD_CONFIRM_BTN}
        isLoading={isDeleting}
        onCancel={cancelDelete}
        onConfirm={handleDelete}
        cancelBtnDataTestId={UI_IDS.DELETE_BOARD_CANCEL_BTN}
        confirmBtnDataTestId={UI_IDS.DELETE_BOARD_BTN_CONFIRMATION}
      />
    </>
  );
};
