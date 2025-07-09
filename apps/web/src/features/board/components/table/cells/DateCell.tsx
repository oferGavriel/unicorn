import { Calendar, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { BaseCellProps } from '../../../types/cell.interface';

type DateCellProps = BaseCellProps<string | null>;

export const DateCell: React.FC<DateCellProps> = ({ value, onUpdate, column }) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) {
      return null;
    }

    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      // Reset time to compare only dates
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        return { formatted: 'Today', className: 'text-green-400' };
      }

      if (date.getTime() === tomorrow.getTime()) {
        return { formatted: 'Tomorrow', className: 'text-blue-400' };
      }

      if (date < today) {
        return {
          formatted: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          className: 'text-red-400'
        };
      }

      return {
        formatted: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        className: 'text-gray-300'
      };
    } catch {
      return { formatted: 'Invalid date', className: 'text-red-400' };
    }
  }, []);

  const handleDateChange = useCallback(
    async (newDate: Date | null) => {
      if (!column.editable || isLoading) {
        return;
      }

      setIsLoading(true);

      try {
        const isoDate = newDate ? newDate.toISOString() : null;
        await onUpdate(isoDate);
      } catch (error) {
        console.error('Failed to update date:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate, column.editable, isLoading]
  );

  const handleClearDate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await handleDateChange(null);
    },
    [handleDateChange]
  );

  const handleQuickSelect = useCallback(
    async (daysOffset: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      await handleDateChange(date);
    },
    [handleDateChange]
  );

  const selectedDate = value ? new Date(value) : undefined;
  const dateInfo = formatDate(value);

  if (!column.editable) {
    return (
      <div className="h-full w-full flex items-center justify-center gap-2 px-2 py-1 text-sm">
        <Calendar className="w-4 h-4" />
        <span className={dateInfo?.className || 'text-gray-500'}>
          {dateInfo?.formatted || 'No date'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            variant={'clean'}
            className={`
              h-full w-full flex items-center justify-center gap-2 px-2 py-1 rounded text-sm
              transition-all duration-200 min-w-[100px]
              hover:bg-[#333333] cursor-pointer
              ${isLoading ? 'opacity-50' : ''}
              ${!value ? 'text-gray-500' : dateInfo?.className || 'text-gray-300'}
            `}
          >
            <Calendar className="w-4 h-4" />
            <span>{dateInfo?.formatted || 'Set date'}</span>
            {value && (
              <X
                className="w-3 h-3 hover:text-red-400 transition-colors"
                onClick={handleClearDate}
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="dialog-dropdown" sideOffset={4}>
          <div className="flex">
            {/* Quick Select Buttons */}
            <div className="flex flex-col gap-1 px-2 border-r border-gray-500 min-w-[120px]">
              <Button
                variant="ghost"
                onClick={() => handleQuickSelect(0)}
                size="default"
                disabled={isLoading}
                className="justify-start text-white hover:bg-[#404040] h-8"
              >
                Today
              </Button>

              <Button
                variant="ghost"
                onClick={() => handleQuickSelect(1)}
                size="default"
                disabled={isLoading}
                className="justify-start text-white hover:bg-[#404040] h-8"
              >
                Tomorrow
              </Button>

              <Button
                variant="ghost"
                size="default"
                onClick={() => handleQuickSelect(7)}
                disabled={isLoading}
                className="justify-start text-white hover:bg-[#404040] h-8"
              >
                Next week
              </Button>

              <Button
                variant="ghost"
                size="default"
                onClick={() => handleQuickSelect(30)}
                disabled={isLoading}
                className="justify-start text-white hover:bg-[#404040] h-8"
              >
                Next month
              </Button>

              {value && (
                <>
                  <div className="border-t border-gray-500 my-2" />
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => handleDateChange(null)}
                    disabled={isLoading}
                    className="justify-start text-red-400 hover:bg-red-900/20 h-8"
                  >
                    <X className="w-4 h-4" />
                    Clear date
                  </Button>
                </>
              )}
            </div>

            <div className="p-3">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && handleDateChange(date)}
                disabled={isLoading}
                className="rounded-md"
                captionLayout="dropdown"
                classNames={{
                  months_dropdown: 'text-black',
                  years_dropdown: 'text-black'
                }}
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
