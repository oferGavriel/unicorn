import { Loader2, Plus, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IAuthUser } from '@/features/auth';
import { useGetUsersQuery } from '@/features/auth/services/auth.service';
import { boardApi } from '@/features/board/services';
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
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allUsers = [], isLoading: isUsersLoading } = useGetUsersQuery(undefined, {
    skip: !column.editable || !isOpen
  });

  const [addOwnerMutation] = boardApi.useAddRowOwnerMutation();
  const [removeOwnerMutation] = boardApi.useRemoveRowOwnerMutation();

  const selectedUserIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);
  console.log('value:', value);
  const available = useMemo(
    () =>
      !isOpen || isUsersLoading ? [] : allUsers.filter((u) => !selectedUserIds.has(u.id)),
    [isOpen, isUsersLoading, allUsers, selectedUserIds]
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

  const handleToggle = useCallback(() => {
    if (column.editable && !isUpdating) {
      setIsOpen((prev) => !prev);
    }
  }, [column.editable, isUpdating]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const renderUserAvatar = useCallback(
    (user: IAuthUser, size: 'sm' | 'md' = 'sm') => {
      const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
      if (isUpdating || user.avatarUrl === 'placeholder') {
        return <div className={`${sizeClass} rounded-full bg-gray-500 animate-pulse`} />;
      }

      console.log('user:', user);

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

  return (
    <div className="relative h-full" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={isUpdating || !column.editable}
        className={`
          h-full w-full flex items-center justify-center gap-1 p-1 rounded text-sm
          transition-all duration-200 min-w-[80px]
          ${column.editable ? 'hover:bg-[#333333] cursor-pointer' : 'cursor-default'}
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

        {column.editable && !isUpdating && (
          <Plus className="w-3 h-3 ml-1 text-gray-400" />
        )}
      </button>

      {isOpen && column.editable && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 mt-1 z-20 w-64 max-h-60 overflow-y-auto menu-dialog">
            {isUsersLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-400">Loading…</span>
              </div>
            ) : (
              <>
                {/* Selected */}
                {value.length > 0 && (
                  <div className="p-2 border-b border-gray-700">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Assigned ({value.length})
                    </div>
                    {value.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded-xl"
                      >
                        {renderUserAvatar(u, 'md')}
                        <div className="flex-1 text-white">
                          {u.firstName} {u.lastName}
                        </div>
                        <button
                          onClick={() => toggleUser(u.id)}
                          disabled={isUpdating || isUsersLoading}
                          className="p-2 hover:bg-red-900 rounded-xl text-red-400 "
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available */}
                {available.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Available ({available.length})
                    </div>
                    {available.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        disabled={isUpdating || isUsersLoading}
                        className="flex items-center gap-2 w-full p-2 hover:bg-gray-800 rounded text-white"
                      >
                        {renderUserAvatar(u, 'md')}
                        <div className="flex-1 text-left">
                          {u.firstName} {u.lastName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* None */}
                {!value.length && !available.length && (
                  <div className="p-4 text-center text-gray-500 text-sm">No users</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
