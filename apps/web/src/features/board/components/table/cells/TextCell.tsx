import React, { useCallback } from 'react';
import { toast } from 'sonner';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { EditableText } from '@/shared/components/EditableText';

import { BaseCellProps } from '../../../types/cell.interface';

type TextCellProps = BaseCellProps<string> & {
  onEditingChange?: (isEditing: boolean) => void;
};

export const TextCell: React.FC<TextCellProps> = ({
  value,
  onUpdate,
  column,
  onEditingChange
}) => {
  const handleSave = useCallback(
    async (newTaskName: string): Promise<void> => {
      try {
        await onUpdate(newTaskName);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update task name';
        console.error('Error updating task name:', errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [onUpdate]
  );

  return (
    <div className="px-1 py-1 min-h-[2rem] h-full flex items-center w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <EditableText
                value={value || ''}
                onSave={handleSave}
                className="w-full min-h-[2rem]"
                inputClassName="w-full px-2 py-1 rounded text-white"
                placeholder="Unnamed task"
                title={column.editable ? 'Click to edit task name' : undefined}
                validateEmpty={true}
                maxLength={100}
                onEditingChange={onEditingChange}
              />
            </div>
          </TooltipTrigger>
          {value && value.length > 0 && (
            <TooltipContent side="top" className="max-w-xs break-words" sideOffset={5}>
              <p className="text-sm">{value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
