import {
  CircleCheck,
  ExternalLink,
  House,
  MoreHorizontal,
  Pencil,
  SquareChartGantt,
  Trash2
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Input } from '@/components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
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

import {
  useDeleteBoardMutation,
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
  const [deleteBoard] = useDeleteBoardMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editingRowRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editingId) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          editingRowRef.current &&
          !editingRowRef.current.contains(event.target as Node)
        ) {
          setEditingId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingId]);

  const handleRename = (board: IBoardList) => {
    setEditingId(board.id);
    setEditValue(board.name);
  };

  const handleRenameBlur = async (board: IBoardList): Promise<void> => {
    if (editValue.trim() === '') {
      toast.error('Board name cannot be empty');
      return;
    }

    if (editValue === board.name) {
      toast.info('No changes made to the board name');
      setEditingId(null);
      return;
    }

    try {
      await updateBoard({ id: board.id, name: editValue }).unwrap();
      toast.success('Board renamed successfully');
    } catch (error: unknown) {
      console.error('Failed to rename board:', error);
      toast.error('Failed to rename board');
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (board: IBoardList) => {
    try {
      await deleteBoard(board.id).unwrap();
      toast.success('Board deleted');
      if (selectedBoardId === board.id) {
        navigate('/boards');
      }
    } catch (error: unknown) {
      console.error('Failed to delete board:', error);
      toast.error('Failed to delete board');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
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

      {boards.map((b) => {
        const isSelected = b.id === selectedBoardId;
        const isEditing = editingId === b.id;
        return (
          <div
            key={b.id}
            className="relative flex items-center group"
            ref={isEditing ? editingRowRef : null}
          >
            {editingId === b.id ? (
              <Input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleRenameBlur(b)}
                onKeyDown={(e) => handleKeyDown(e)}
                className="w-full border-input-border-color my-1 text-left"
                data-testid={UI_IDS.BOARD_EDIT_NAME_INPUT}
              />
            ) : (
              <div
                className={`w-full flex items-center gap-2 p-2 my-1 text-left pr-10 rounded-md text-sm single-line
                  ${isSelected ? 'bg-selected-board-bg' : ''}
                `}
                onClick={() => onSelectBoard(b.id)}
                data-testid={UI_IDS.SELECT_BOARD_BTN}
              >
                <SquareChartGantt strokeWidth={1.5} size={18} />
                <span className="block">{b.name}</span>
              </div>
            )}
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
                    onClick={() => window.open(`/boards/${b.id}`, '_blank')}
                    className="flex items-center gap-2"
                    data-testid={UI_IDS.OPEN_IN_NEW_TAB_BTN}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {UI_TITLES.OPEN_IN_NEW_TAB_BTN}
                  </DropdownMenuItem>

                  <Separator className="my-1 bg-zinc-700" />

                  <DropdownMenuItem
                    onClick={() => handleRename(b)}
                    className="flex items-center gap-2"
                    data-testid={UI_IDS.RENAME_BOARD_BTN}
                  >
                    <Pencil className="w-4 h-4" />
                    {UI_TITLES.RENAME_BOARD_BTN}
                  </DropdownMenuItem>

                  <Separator className="my-1 bg-zinc-700" />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-500 focus:text-red-500"
                        onSelect={(e) => e.preventDefault()}
                        data-testid={UI_IDS.DELETE_BOARD_BTN}
                      >
                        <Trash2 className="w-4 h-4" />
                        {UI_TITLES.DELETE_BOARD_BTN}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-dialog-bg text-white border-0 shadow-[0px_6px_20px_#000000]">
                      <AlertDialogHeader>
                        <AlertDialogTitle
                          className="text-xl tracking-wide"
                          data-testid={UI_IDS.ALERT_DELETE_BOARD_TITLE}
                        >
                          {UI_TITLES.ALERT_DELETE_BOARD_TITLE}
                        </AlertDialogTitle>
                        <AlertDialogDescription
                          className="text-gray-300 text-sm tracking-wide"
                          data-testid={UI_IDS.ALERT_DELETE_BOARD_DESCRIPTION}
                        >
                          Are you sure you want to delete{' '}
                          <span className="font-bold">{b.name}</span>? This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          data-testid={UI_IDS.ALERT_DELETE_BOARD_CANCEL_BTN}
                        >
                          {UI_TITLES.ALERT_DELETE_BOARD_CANCEL_BTN}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(b)}
                          data-testid={UI_IDS.ALERT_DELETE_BOARD_BTN_CONFIRMATION}
                        >
                          {UI_TITLES.ALERT_DELETE_BOARD_BTN_CONFIRMATION}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
};
