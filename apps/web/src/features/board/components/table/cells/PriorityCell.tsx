import { Check } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PriorityEnum } from '@/shared/shared.enum';

import { BaseCellProps, PRIORITY_CONFIG } from '../../../types/cell.interface';

type PriorityCellProps = BaseCellProps<PriorityEnum>;

export const PriorityCell: React.FC<PriorityCellProps> = ({
  value,
  onUpdate,
  column
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentPriority = PRIORITY_CONFIG[value] || PRIORITY_CONFIG[PriorityEnum.MEDIUM];

  const handlePriorityChange = useCallback(
    async (newPriority: PriorityEnum) => {
      if (newPriority === value || !column.editable) {
        return;
      }

      setIsLoading(true);

      try {
        await onUpdate(newPriority);
      } catch (error) {
        console.error('Failed to update priority:', error);
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
            ${currentPriority.textColor} ${currentPriority.bgColor}
          `}
        >
          <div className="flex items-center gap-1">
            <span>{currentPriority.label}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={'clean'}
            disabled={isLoading}
            className={`
              w-full h-full flex items-center justify-center font-medium text-center
              transition-all duration-200
              ${currentPriority.textColor} ${currentPriority.bgColor}
              hover:opacity-80 cursor-pointer
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              <span>{currentPriority.label}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="dialog-dropdown" sideOffset={4}>
          {Object.entries(PRIORITY_CONFIG).map(([priorityKey, config]) => {
            const priorityValue = priorityKey as PriorityEnum;
            const isSelected = priorityValue === value;

            return (
              <DropdownMenuItem
                key={priorityKey}
                onClick={() => handlePriorityChange(priorityValue)}
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
