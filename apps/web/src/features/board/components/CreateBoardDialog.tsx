import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Separator,
  Textarea
} from '@/components';
import { IAuthUser, useGetUsersQuery } from '@/features/auth';
import { UI_IDS, UI_TITLES } from '@/pages/board-page/BoardPage.consts';
import { useAppSelector } from '@/store';

import type { ICreateBoardRequest } from '../types/board.interface';

export interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (payload: ICreateBoardRequest) => Promise<void>;
  isCreatingBoard?: boolean;
}

export const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({
  isOpen,
  onClose,
  onCreateBoard
}): React.ReactElement | null => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedUsersId, setSelectedUsersId] = useState<string[]>([]);
  const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery(undefined, {
    skip: !isOpen
  });
  const currentUser = useAppSelector((state) => state.authUser.user) as IAuthUser;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => user.id !== currentUser.id);
  }, [users, currentUser.id]);

  useEffect(() => {
    if (isOpen) {
      setName('New board');
      setDescription('');
      setSelectedUsersId([]);
      document.body.style.overflow = 'hidden';
    } else {
      setName('');
      setDescription('');
      setSelectedUsersId([]);
      setIsSubmitting(false);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const toggleUser = (id: string) =>
    setSelectedUsersId((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast.warning('Please enter a board name.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateBoard({
        name,
        description: description.trim() || undefined,
        memberIds: selectedUsersId
      });
      toast.success('Board created successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to create board. Please try again.');
      console.error('Create board error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, selectedUsersId, onCreateBoard, onClose]);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [onClose, handleSubmit]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, handleKeydown]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle
            className="text-3xl"
            data-testid={UI_IDS.CREATE_BOARD_DIALOG_TITLE}
          >
            {UI_TITLES.CREATE_BOARD_DIALOG_TITLE}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label
              className="block text-sm text-[#eeeeee] font-medium mb-2"
              data-testid={UI_IDS.CREATE_BOARD_NAME_LABEL}
            >
              {UI_TITLES.CREATE_BOARD_NAME_LABEL}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border-input-border-color px-4 py-2"
            />
          </div>

          <div>
            <label
              className="block text-sm text-[#eeeeee] font-medium mb-2"
              data-testid={UI_IDS.CREATE_BOARD_DESCRIPTION_LABEL}
            >
              {UI_TITLES.CREATE_BOARD_DESCRIPTION_LABEL}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none border-input-border-color px-4 py-2"
              placeholder={UI_TITLES.CREATE_BOARD_DESCRIPTION_PLACEHOLDER}
              rows={3}
            />
          </div>

          <Separator className="my-4 h-[1px] bg-[#636466]" />

          <div>
            <label className="block text-sm font-medium mb-1">Members</label>
            {isUsersLoading ? (
              <p>Loading users…</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">
                No other users available to add as members.
              </p>
            ) : (
              <div className="max-h-32 mt-2 space-y-1 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center space-x-2"
                    onClick={() => toggleUser(u.id)}
                  >
                    <Checkbox checked={selectedUsersId.includes(u.id)} />
                    <span className="text-sm">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-xs text-gray-300">({u.email})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="text-base rounded-sm"
            onClick={() => onClose()}
            data-testid={UI_IDS.CREATE_BOARD_CANCEL_BTN}
          >
            {UI_TITLES.CREATE_BOARD_CANCEL_BTN}
          </Button>
          <Button
            onClick={handleSubmit}
            className="ml-2 text-base rounded-sm"
            disabled={isSubmitting}
            data-testid={UI_IDS.CREATE_BOARD_CREATE_BTN}
            variant={'primary'}
          >
            {isSubmitting
              ? UI_TITLES.CREATE_BOARD_CREATING
              : UI_TITLES.CREATE_BOARD_CREATE_BTN}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
