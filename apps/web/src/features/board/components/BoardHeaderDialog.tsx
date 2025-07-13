import { Calendar, Crown, Edit3, Plus, Settings, Users, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useGetUsersQuery } from '@/features/auth';
import { EditableText } from '@/shared/components/EditableText';
import { Spinner } from '@/shared/components/Spinner';

import { useAddBoardMemberMutation, useRemoveBoardMemberMutation } from '../services';
import { IBoard } from '../types/board.interface';

interface BoardHeaderDialogProps {
  board: IBoard;
  onUpdateBoard: (name: string, description?: string) => Promise<void>;
  onBoardSettings?: () => void;
  onManageMembers?: () => void;
  children: React.ReactNode;
}

type DialogView = 'main' | 'settings' | 'members';

export const BoardHeaderDialog: React.FC<BoardHeaderDialogProps> = ({
  board,
  onUpdateBoard,
  onBoardSettings,
  children
}) => {
  const [currentView, setCurrentView] = useState<DialogView>('main');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isMemberOperationLoading, setIsMemberOperationLoading] =
    useState<boolean>(false);

  const [addBoardMember] = useAddBoardMemberMutation();
  const [removeBoardMember] = useRemoveBoardMemberMutation();

  const { data: allUsers, isLoading: isLoadingUsers } = useGetUsersQuery(undefined, {
    skip: currentView !== 'members'
  });

  const handleNameSave = async (newName: string) => {
    if (newName.trim() && newName !== board.name) {
      setIsUpdating(true);
      try {
        await onUpdateBoard(newName.trim(), board.description);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDescriptionSave = async (newDescription: string) => {
    if (newDescription !== (board.description || '')) {
      setIsUpdating(true);
      try {
        await onUpdateBoard(board.name, newDescription.trim() || undefined);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAddMember = async (userId: string) => {
    setIsMemberOperationLoading(true);
    try {
      await addBoardMember({
        boardId: board.id,
        userId
      }).unwrap();
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setIsMemberOperationLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsMemberOperationLoading(true);
    try {
      await removeBoardMember({
        boardId: board.id,
        userId
      }).unwrap();
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsMemberOperationLoading(false);
    }
  };

  const memberSet = useMemo(() => {
    return new Set(board.memberIds || []);
  }, [board.memberIds]);

  console.log('board', board);

  const renderMainView = () => (
    <>
      {/* Board Info Section */}
      <div className="p-4 border-b border-gray-600">
        <div className="space-y-3">
          <div className="flex flex-col w-full">
            <span className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">
              Board Name
            </span>
            <EditableText
              value={board.name}
              onSave={handleNameSave}
              className="text-lg font-semibold text-white"
              inputClassName="text-lg font-semibold bg-[#1a1a1a] border-gray-600 text-white w-auto"
              placeholder="Enter board name..."
              disabled={isUpdating}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">
              Description
            </label>
            <EditableText
              value={board.description || ''}
              onSave={handleDescriptionSave}
              className="text-sm text-gray-300 min-h-[2rem]"
              inputClassName="text-sm bg-[#1a1a1a] border-gray-600 text-gray-300 min-h-[3rem]"
              placeholder="Add a description..."
              multiline={true}
              disabled={isUpdating}
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4 border-b border-gray-600">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created
            </span>
            <span className="text-gray-300">{formatDate(board.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Last Updated
            </span>
            <span className="text-gray-300">{formatDate(board.updatedAt)}</span>
          </div>

          <div
            className="flex items-center justify-between text-gray-400 hover:text-gray-300 cursor-pointer rounded p-1 hover:bg-gray-700/50"
            onClick={() => setCurrentView('members')}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </span>
            <span className="text-gray-300">{board.memberIds.length || 0} →</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-2">
        <Button
          onClick={() => setCurrentView('members')}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
        >
          <Users className="mr-2 h-4 w-4" />
          Manage Members
        </Button>

        {onBoardSettings && (
          <Button
            onClick={onBoardSettings}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Board Settings
          </Button>
        )}
      </div>
    </>
  );

  const renderMembersView = () => (
    <>
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentView('main')}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1"
            >
              ← Back
            </Button>
            <h3 className="text-lg font-semibold text-white">Board Members</h3>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {isLoadingUsers ? (
          <div className="py-8">
            <Spinner text="Loading users..." />
          </div>
        ) : (
          <div className="space-y-3">
            {allUsers?.map((user) => {
              const isOwner = user.id === board.ownerId;
              const isMember = memberSet.has(user.id);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl || '/default-avatar.png'}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-white font-medium flex items-center gap-3">
                        {user.firstName} {user.lastName}
                        {isOwner && <Crown className="inline h-4 w-4 text-yellow-500" />}
                        {isMember && !isOwner && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            Member
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>

                  {isOwner ? (
                    <span className="text-xs text-gray-500">Owner</span>
                  ) : isMember ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isMemberOperationLoading}
                      className="flex items-center justify-center text-red-400 hover:text-white hover:bg-red-600 rounded-full h-8 w-8 p-0 transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleRemoveMember(user.id)}
                    >
                      {isMemberOperationLoading ? (
                        <Spinner size="sm" className="h-4 w-4" text="" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isMemberOperationLoading ? 'Processing...' : 'Remove member'}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isMemberOperationLoading}
                      className="flex items-center justify-center text-green-400 hover:text-white hover:bg-green-600 rounded-full h-8 w-8 p-0 transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleAddMember(user.id)}
                    >
                      {isMemberOperationLoading ? (
                        <Spinner size="sm" text="" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isMemberOperationLoading ? 'Processing...' : 'Add member'}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-96 menu-dialog p-0">
        {currentView === 'main' ? renderMainView() : renderMembersView()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
