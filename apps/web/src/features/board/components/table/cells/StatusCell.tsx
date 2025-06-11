import { Check } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { StatusEnum } from '@/shared/shared.enum';

import { BaseCellProps } from '../../../types/cell.interface';

type StatusCellProps = BaseCellProps<StatusEnum>;

const STATUS_CONFIG = {
  [StatusEnum.NOT_STARTED]: {
    label: 'Not Started',
    bgColor: 'bg-[#797e93]',
    textColor: 'text-gray-200'
  },
  [StatusEnum.WORKING_ON_IT]: {
    label: 'Working on it',
    bgColor: 'bg-[#fdbc64]',
    textColor: 'text-white'
  },
  [StatusEnum.STUCK]: {
    label: 'Stuck',
    bgColor: 'bg-[#e8697d]',
    textColor: 'text-white'
  },
  [StatusEnum.DONE]: {
    label: 'Done',
    bgColor: 'bg-[#33d391]',
    textColor: 'text-white'
  }
} as const;

export const StatusCell: React.FC<StatusCellProps> = ({ value, onUpdate, column }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_CONFIG[value] || STATUS_CONFIG[StatusEnum.NOT_STARTED];

  const handleStatusChange = useCallback(
    async (newStatus: StatusEnum) => {
      if (newStatus === value || !column.editable) {
        return;
      }

      setIsLoading(true);
      setIsOpen(false);

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

  const handleToggle = useCallback(() => {
    if (column.editable) {
      setIsOpen((prev) => !prev);
    }
  }, [column.editable]);

  return (
    <div className="relative w-full h-full" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={isLoading || !column.editable}
        className={`
          w-full h-full flex items-center justify-center font-medium text-center
          transition-all duration-200
          ${currentStatus.textColor} ${currentStatus.bgColor}
          ${column.editable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <span>{currentStatus.label}</span>
      </button>

      {isOpen && column.editable && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="popover-content absolute top-full left-0 mt-1 bg-[#333333] border border-gray-600 rounded-md shadow-lg z-20 min-w-[160px]">
            {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
              const statusValue = statusKey as StatusEnum;
              const isSelected = statusValue === value;

              return (
                <button
                  key={statusKey}
                  onClick={() => handleStatusChange(statusValue)}
                  className={`
                    w-full h-full flex items-center gap-2 px-3 py-2 text-left text-sm
                    hover:bg-[#404040] transition-colors
                    ${isSelected ? 'bg-[#404040]' : ''}
                  `}
                >
                  <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                  <span className="text-white">{config.label}</span>
                  {isSelected && <Check className="w-4 h-4 ml-auto text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
