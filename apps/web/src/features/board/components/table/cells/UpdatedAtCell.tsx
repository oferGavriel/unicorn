import React, { useMemo } from 'react';

import { formatDate } from '@/utils/utils.service';

import { BaseCellProps } from '../../../types/cell.interface';

type UpdatedAtCellProps = BaseCellProps<string | number | Date>;

export const UpdatedAtCell: React.FC<UpdatedAtCellProps> = ({ value }) => {
  const display = useMemo(() => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : formatDate(date);
  }, [value]);

  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-400">
      {display}
    </div>
  );
};
