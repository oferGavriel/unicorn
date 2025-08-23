import { LogOut, Settings, User } from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IAuthUser } from '@/features/auth';

interface UserMenuDialogProps {
  user: IAuthUser;
  onLogout: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
}

export const UserMenuDialog: React.FC<UserMenuDialogProps> = ({
  user,
  onLogout,
  onSettings,
  onProfile
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center bg-[#36363B] rounded-[6px_20px_20px_6px] cursor-pointer hover:bg-[#404045] transition-colors">
          <div className="flex items-center mx-2">
            <img
              src="https://res.cloudinary.com/dqkstk6dw/image/upload/v1755948181/logo_lwf6l7.png"
              alt="unicorn logo"
              className="w-6"
            />
          </div>
          <img src={user.avatarUrl} alt="user avatar" className="w-8 h-8 rounded-full" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 menu-dialog">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>

        <DropdownMenuSeparator className="bg-gray-600" />

        {onProfile && (
          <DropdownMenuItem
            onClick={onProfile}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
        )}

        {onSettings && (
          <DropdownMenuItem
            onClick={onSettings}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-gray-600" />

        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
