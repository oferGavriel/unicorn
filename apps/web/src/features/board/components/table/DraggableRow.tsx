import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Row } from '@tanstack/react-table';
import { GripVertical } from 'lucide-react';
import React, { type PropsWithChildren } from 'react';

import { IRow } from '../../types/row.interface';

interface DraggableRowProps extends PropsWithChildren {
  row: Row<IRow>;
  tableId: string;
}

const DraggableRow: React.FC<DraggableRowProps> = ({ row, tableId, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.id,
      data: {
        type: 'row',
        row: row.original,
        tableId
      }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        transition-colors hover:bg-[#2a2a2a] group
        ${isDragging ? 'opacity-50 bg-[#2a2a2a]' : ''}
      `}
      {...attributes}
    >
      {/* Drag Handle */}
      <td className="w-8 px-2 py-3">
        <div
          className="flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
      </td>
      {children}
    </tr>
  );
};

export default DraggableRow;
