import { Loader2, Plus, User, X } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IAuthUser } from '@/features/auth';
import { boardApi, useGetBoardMembersQuery } from '@/features/board/services';
import { IRow, TableColumn } from '@/features/board/types';

type UsersCellProps = {
  boardId: string;
  tableId: string;
  rowId: string;
  value: IAuthUser[];
  row: IRow;
  column: TableColumn;
};

export const UsersCell: React.FC<UsersCellProps> = ({
  value = [],
  column,
  boardId,
  tableId,
  rowId
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // const { data: allUsers = [], isLoading: isUsersLoading } = useGetUsersQuery(undefined, {
  //   skip: !column.editable || !isDropdownOpen
  // });
  const { data: allUsers = [], isLoading: isUsersLoading } = useGetBoardMembersQuery(
    boardId,
    {
      skip: !column.editable || !isDropdownOpen
    }
  );

  const [addOwnerMutation] = boardApi.useAddRowOwnerMutation();
  const [removeOwnerMutation] = boardApi.useRemoveRowOwnerMutation();

  const selectedUserIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);
  const availableUsers = useMemo(
    () => allUsers.filter((u) => !selectedUserIds.has(u.id)),
    [allUsers, selectedUserIds]
  );

  const toggleUser = useCallback(
    async (userId: string) => {
      if (!column.editable || isUpdating || isUsersLoading) {
        return;
      }

      setIsUpdating(true);

      try {
        const isCurrentlySelected = selectedUserIds.has(userId);

        if (isCurrentlySelected) {
          await removeOwnerMutation({
            boardId,
            tableId,
            rowId,
            ownerId: userId
          }).unwrap();
        } else {
          await addOwnerMutation({
            boardId,
            tableId,
            rowId,
            ownerId: userId
          }).unwrap();
        }
      } catch (error) {
        console.error('Failed to update row owner:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [
      column.editable,
      isUpdating,
      isUsersLoading,
      selectedUserIds,
      removeOwnerMutation,
      boardId,
      tableId,
      rowId,
      addOwnerMutation
    ]
  );

  const renderUserAvatar = useCallback(
    (user: IAuthUser, size: 'sm' | 'md' = 'sm') => {
      const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

      if (isUpdating || user.avatarUrl === 'placeholder') {
        return <div className={`${sizeClass} rounded-full bg-gray-500 animate-pulse`} />;
      }

      if (user.avatarUrl) {
        return (
          <img
            src={user.avatarUrl}
            alt={`${user.firstName} ${user.lastName} avatar`}
            className={`${sizeClass} rounded-full object-cover`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      }
    },
    [isUpdating]
  );

  if (!column.editable) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        {value.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-4 h-4" />
            <span>Unassigned</span>
          </div>
        ) : (
          <div className="flex items-center -space-x-1">
            {value.slice(0, 3).map((user) => (
              <div key={user.id} className="relative">
                {renderUserAvatar(user)}
              </div>
            ))}
            {value.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium ml-1">
                +{value.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <DropdownMenu onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isUpdating}
            variant={'clean'}
            className={`
              h-full w-full flex items-center justify-center gap-1 p-1 rounded text-sm
              transition-all duration-200 min-w-[80px]
              hover:bg-[#333333] cursor-pointer
              ${isUpdating ? 'opacity-50' : ''}
            `}
          >
            {value.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-500">
                <User className="w-4 h-4" />
                <span>Assign</span>
                {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            ) : (
              <div className="flex items-center">
                <div className="flex items-center -space-x-1">
                  {value.slice(0, 3).map((user) => (
                    <div key={user.id} className="relative">
                      {renderUserAvatar(user)}
                    </div>
                  ))}
                  {value.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium ml-1">
                      +{value.length - 3}
                    </div>
                  )}
                </div>
                {isUpdating && (
                  <Loader2 className="w-3 h-3 ml-1 animate-spin text-gray-400" />
                )}
              </div>
            )}

            {!isUpdating && <Plus className="w-3 h-3 ml-1 text-gray-400" />}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="dialog-dropdown w-64 max-h-60 overflow-y-auto"
          sideOffset={4}
        >
          {isUsersLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">Loading users...</span>
            </div>
          ) : (
            <>
              {value.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-medium text-gray-400">
                    Assigned ({value.length})
                  </DropdownMenuLabel>
                  {value.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      className="flex items-center gap-2 p-2 hover:bg-[#404040] cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      {renderUserAvatar(user, 'md')}
                      <div className="flex-1 text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <button
                        onClick={() => toggleUser(user.id)}
                        disabled={isUpdating}
                        className="p-1 hover:bg-red-900 rounded text-red-400"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {value.length > 0 && availableUsers.length > 0 && (
                <DropdownMenuSeparator className="bg-gray-600" />
              )}

              {/* Available Users */}
              {availableUsers.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-medium text-gray-400">
                    Available ({availableUsers.length})
                  </DropdownMenuLabel>
                  {availableUsers.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      disabled={isUpdating}
                      className="flex items-center gap-2 p-2 hover:bg-[#404040] cursor-pointer text-white"
                    >
                      {renderUserAvatar(user, 'md')}
                      <div className="flex-1">
                        {user.firstName} {user.lastName}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!value.length && !availableUsers.length && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No users available
                </div>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
