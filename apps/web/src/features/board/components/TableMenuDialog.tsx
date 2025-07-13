import { Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface TableMenuDialogProps {
  onDuplicate: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const TableMenuDialog: React.FC<TableMenuDialogProps> = ({
  onDuplicate,
  onDelete,
  isDeleting = false
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-auto hover:bg-accent rounded-lg"
          disabled={isDeleting}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-48 menu-dialog">
        <DropdownMenuItem
          onClick={onDuplicate}
          disabled={isDeleting}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate Table
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onDelete}
          disabled={isDeleting}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
