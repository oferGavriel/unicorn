import { Check } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { StatusEnum } from '@/shared/shared.enum';

import { BaseCellProps, STATUS_CONFIG } from '../../../types/cell.interface';

type StatusCellProps = BaseCellProps<StatusEnum>;

export const StatusCell: React.FC<StatusCellProps> = ({ value, onUpdate, column }) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentStatus = STATUS_CONFIG[value] || STATUS_CONFIG[StatusEnum.NOT_STARTED];

  const handleStatusChange = useCallback(
    async (newStatus: StatusEnum) => {
      if (newStatus === value || !column.editable) {
        return;
      }

      setIsLoading(true);

      try {
        await onUpdate(newStatus);
      } catch (error) {
        console.error('Failed to update status:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [value, onUpdate, column.editable]
  );

  if (!column.editable) {
    return (
      <div className="relative w-full h-full">
        <div
          className={`
            w-full h-full flex items-center justify-center font-medium text-center
            transition-all duration-200 cursor-default
            ${currentStatus.textColor} ${currentStatus.bgColor}
          `}
        >
          <span>{currentStatus.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            variant={'clean'}
            className={`
              w-full h-full flex items-center justify-center font-medium text-center
              transition-all duration-200
              ${currentStatus.textColor} ${currentStatus.bgColor}
              hover:opacity-80 cursor-pointer
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            <span>{currentStatus.label}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="dialog-dropdown" sideOffset={4}>
          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
            const statusValue = statusKey as StatusEnum;
            const isSelected = statusValue === value;

            return (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => handleStatusChange(statusValue)}
                className={`
                  flex items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer
                  hover:bg-[#404040] text-white transition-colors
                  ${isSelected ? 'bg-[#404040]' : ''}
                `}
              >
                <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                <span className="flex-1">{config.label}</span>
                {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
