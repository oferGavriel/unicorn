import { AlertCircle, Loader2, Plus, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useGetUsersQuery } from '@/features/auth/services/auth.service';

import { BaseCellProps } from '../../../types/cell.interface';

type UsersCellProps = BaseCellProps<string[]>;

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export const UsersCell: React.FC<UsersCellProps> = ({ value = [], onUpdate, column }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery(undefined, {
    skip: !column.editable || !isOpen
  });

  const { selectedUsers, invalidUserIds } = React.useMemo(() => {
    const selected: User[] = [];
    const invalid: string[] = [];

    value.forEach((userId) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        selected.push(user);
      } else {
        invalid.push(userId);
        if (!isUsersLoading && users.length > 0) {
          console.warn(`User with ID ${userId} not found in users list`);
        }
      }
    });

    return { selectedUsers: selected, invalidUserIds: invalid };
  }, [value, users, isUsersLoading]);

  const availableUsers = React.useMemo(() => {
    if (isUsersLoading) {
      return [];
    } // Return empty during loading
    return users.filter((user) => !value.includes(user.id));
  }, [users, value, isUsersLoading]);

  useEffect(() => {
    if (
      invalidUserIds.length > 0 &&
      column.editable &&
      !isUsersLoading &&
      users.length > 0
    ) {
      const validUserIds = value.filter((id) => !invalidUserIds.includes(id));
      if (validUserIds.length !== value.length) {
        console.log('Cleaning up invalid user IDs:', invalidUserIds);
        const result = onUpdate(validUserIds);
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch((error: unknown) => {
            console.error('Failed to update users after cleanup:', error);
          });
        }
      }
    }
  }, [invalidUserIds, value, column.editable, onUpdate, isUsersLoading, users.length]);

  const handleUserToggle = useCallback(
    async (userId: string, isSelected: boolean) => {
      if (!column.editable || isUpdating || isUsersLoading) {
        return;
      }

      const userExists = users.some((user) => user.id === userId);
      if (!userExists) {
        console.error(`Cannot toggle user ${userId}: user does not exist`);
        return;
      }

      setIsUpdating(true);

      try {
        const newUserIds = isSelected
          ? value.filter((id) => id !== userId)
          : [...value, userId];

        await onUpdate(newUserIds);
      } catch (error) {
        console.error('Failed to update users:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [value, onUpdate, column.editable, isUpdating, users, isUsersLoading]
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

  const renderUserAvatar = useCallback((user: User, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={`${user.name} avatar`}
          className={`${sizeClass} rounded-full object-cover`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    }

    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2); // Max 2 initials

    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-medium`}
        title={user.name}
      >
        {initials}
      </div>
    );
  }, []);

  const renderInvalidUserWarning = () => {
    if (invalidUserIds.length === 0 || isUsersLoading) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-red-900/20 rounded text-xs text-red-400">
        <AlertCircle className="w-3 h-3" />
        <span>
          {invalidUserIds.length} invalid user{invalidUserIds.length > 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center px-3 py-4">
      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      <span className="ml-2 text-sm text-gray-400">Loading users...</span>
    </div>
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
        {selectedUsers.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-4 h-4" />
            <span>Assign</span>
            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex items-center -space-x-1">
              {selectedUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="relative">
                  {renderUserAvatar(user)}
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white font-medium ml-1">
                  +{selectedUsers.length - 3}
                </div>
              )}
            </div>
            {invalidUserIds.length > 0 && !isUsersLoading && (
              <AlertCircle
                className="w-3 h-3 ml-1 text-red-400"
                aria-label={`${invalidUserIds.length} invalid users`}
              />
            )}
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
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-[#333333] border border-gray-600 rounded-md shadow-lg z-[9999] min-w-[250px] max-h-[300px] overflow-y-auto">
            {/* Loading State */}
            {isUsersLoading && renderLoadingState()}

            {/* Content when users are loaded */}
            {!isUsersLoading && (
              <>
                {/* Invalid Users Warning */}
                {invalidUserIds.length > 0 && (
                  <div className="px-3 py-2 border-b border-gray-600">
                    {renderInvalidUserWarning()}
                  </div>
                )}

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-600">
                      Assigned ({selectedUsers.length})
                    </div>
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[#404040] transition-colors group"
                      >
                        {renderUserAvatar(user, 'md')}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUserToggle(user.id, true)}
                          disabled={isUpdating}
                          className={`
                            text-red-400 hover:text-red-300 transition-colors p-1 rounded
                            ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-400/10'}
                          `}
                          title="Remove user"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Available Users */}
                {availableUsers.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-600">
                      Available ({availableUsers.length})
                    </div>
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserToggle(user.id, false)}
                        disabled={isUpdating}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 transition-colors
                          ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#404040] cursor-pointer'}
                        `}
                      >
                        {renderUserAvatar(user, 'md')}
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm text-white truncate">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* No Users Available */}
                {availableUsers.length === 0 &&
                  selectedUsers.length === users.length &&
                  users.length > 0 && (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      All users are assigned
                    </div>
                  )}

                {/* No Users Exist */}
                {users.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No users available
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
