import { Calendar, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BaseCellProps } from '../../../types/cell.interface';

type DateCellProps = BaseCellProps<string | null>;

export const DateCell: React.FC<DateCellProps> = ({ value, onUpdate, column }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const datePickerRef = useRef<HTMLDivElement>(null);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) {
      return null;
    }

    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return { formatted: 'Today', className: 'text-green-400' };
      }

      if (date.toDateString() === tomorrow.toDateString()) {
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
    async (newDate: string) => {
      if (!column.editable) {
        return;
      }

      setIsLoading(true);
      setIsOpen(false);

      try {
        await onUpdate(newDate || null);
        setSelectedDate(newDate);
      } catch (error) {
        console.error('Failed to update date:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate, column.editable]
  );

  const handleClearDate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!column.editable) {
        return;
      }

      setIsLoading(true);
      try {
        await onUpdate(null);
        setSelectedDate('');
      } catch (error) {
        console.error('Failed to clear date:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate, column.editable]
  );

  const handleToggle = useCallback(() => {
    if (column.editable) {
      setIsOpen((prev) => !prev);
    }
  }, [column.editable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const dateInfo = formatDate(value);

  return (
    <div className="relative h-full" ref={datePickerRef}>
      <button
        onClick={handleToggle}
        disabled={isLoading || !column.editable}
        className={`
          h-full w-full flex items-center justify-center gap-2 px-2 py-1 rounded text-sm
          transition-all duration-200 min-w-[100px]
          ${column.editable ? 'hover:bg-[#333333] cursor-pointer' : 'cursor-default'}
          ${isLoading ? 'opacity-50' : ''}
          ${!value ? 'text-gray-500' : dateInfo?.className || 'text-gray-300'}
        `}
      >
        <Calendar className="w-4 h-4" />
        <span>{dateInfo?.formatted || 'Set date'}</span>
        {value && column.editable && (
          <X
            className="w-3 h-3 hover:text-red-400 transition-colors"
            onClick={handleClearDate}
          />
        )}
      </button>

      {isOpen && column.editable && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Date Picker */}
          <div className="absolute top-full left-0 mt-1 bg-[#333333] border border-gray-600 rounded-md shadow-lg z-20 p-3">
            <input
              type="date"
              value={
                selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''
              }
              onChange={(e) => {
                const newDate = e.target.value;
                if (newDate) {
                  handleDateChange(new Date(newDate).toISOString());
                }
              }}
              className="bg-[#2a2a2a] border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            {/* Quick date options */}
            <div className="mt-2 space-y-1">
              {[
                { label: 'Today', value: new Date().toISOString() },
                {
                  label: 'Tomorrow',
                  value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  label: 'Next week',
                  value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              ].map(({ label, value: dateValue }) => (
                <button
                  key={label}
                  onClick={() => handleDateChange(dateValue)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-[#404040] rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
