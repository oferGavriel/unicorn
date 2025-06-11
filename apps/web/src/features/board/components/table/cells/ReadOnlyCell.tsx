import React from 'react';

import { BaseCellProps } from '../../../types/cell.interface';

type ReadOnlyCellProps = BaseCellProps<string | number | Date>;

export const ReadOnlyCell: React.FC<ReadOnlyCellProps> = ({ value, column }) => {
  const formatValue = () => {
    if (!value) {
      return '-';
    }

    // Handle date formatting
    if (column.accessorKey.includes('Date') || column.accessorKey.includes('At')) {
      try {
        const date = new Date(value);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
          return 'Just now';
        } else if (diffInMinutes < 60) {
          return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
          // 24 hours
          const hours = Math.floor(diffInMinutes / 60);
          return `${hours}h ago`;
        } else if (diffInMinutes < 10080) {
          // 7 days
          const days = Math.floor(diffInMinutes / 1440);
          return `${days}d ago`;
        } else {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
          });
        }
      } catch {
        return String(value);
      }
    }

    // Handle number formatting
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    // Handle string values
    return String(value);
  };

  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-400">
      {formatValue()}
    </div>
  );
};
