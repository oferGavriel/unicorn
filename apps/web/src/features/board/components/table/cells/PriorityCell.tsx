import { Check, TriangleAlert } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { PriorityEnum } from '@/shared/shared.enum';

import { BaseCellProps } from '../../../types/cell.interface';

type PriorityCellProps = BaseCellProps<PriorityEnum>;

const PRIORITY_CONFIG = {
  [PriorityEnum.LOW]: {
    label: 'Low',
    bgColor: 'bg-[#79affd]',
    textColor: 'text-white',
    icon: null
  },
  [PriorityEnum.MEDIUM]: {
    label: 'Medium',
    bgColor: 'bg-[#777ae5]',
    textColor: 'text-white',
    icon: null
  },
  [PriorityEnum.HIGH]: {
    label: 'High',
    bgColor: 'bg-[#6645a9]',
    textColor: 'text-white',
    icon: null
  },
  [PriorityEnum.CRITICAL]: {
    label: 'Critical',
    bgColor: 'bg-[#4b247f]',
    textColor: 'text-white',
    icon: <TriangleAlert color="#ffd60a" strokeWidth={2.3} size={18} />
  }
} as const;

export const PriorityCell: React.FC<PriorityCellProps> = ({
  value,
  onUpdate,
  column
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPriority = PRIORITY_CONFIG[value] || PRIORITY_CONFIG[PriorityEnum.MEDIUM];

  const handlePriorityChange = useCallback(
    async (newPriority: PriorityEnum) => {
      if (newPriority === value || !column.editable) {
        return;
      }

      setIsLoading(true);
      setIsOpen(false);

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

  const handleToggle = useCallback(() => {
    if (column.editable) {
      setIsOpen((prev) => !prev);
    }
  }, [column.editable]);

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

  return (
    <div className="relative w-full h-full" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={isLoading || !column.editable}
        className={`
          w-full h-full flex items-center justify-center font-medium text-center
          transition-all duration-200
          ${currentPriority.textColor} ${currentPriority.bgColor}
          ${column.editable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
          ${isLoading ? 'opacity-50' : ''}
        `}
      >
        <div className="flex items-center gap-1">
          <span>{currentPriority.label}</span>
          <span>{currentPriority?.icon}</span>
        </div>
      </button>

      {isOpen && column.editable && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-[#333333] border border-gray-600 rounded-md shadow-lg z-20 min-w-[140px]">
            {Object.entries(PRIORITY_CONFIG).map(([priorityKey, config]) => {
              const priorityValue = priorityKey as PriorityEnum;
              const isSelected = priorityValue === value;

              return (
                <button
                  key={priorityKey}
                  onClick={() => handlePriorityChange(priorityValue)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                    hover:bg-[#404040] transition-colors
                    ${isSelected ? 'bg-[#404040]' : ''}
                  `}
                >
                  <span>{config.icon}</span>
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
