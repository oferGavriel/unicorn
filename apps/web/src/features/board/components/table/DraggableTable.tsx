import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { ITable } from '../../types/table.interface';
import BoardTable from './BoardTable';

interface DraggableTableProps {
  table: ITable;
  boardId: string;
  onAddRow: (tableId: string, taskName: string) => Promise<void>;
}

const DraggableTable: React.FC<DraggableTableProps> = ({ table, boardId, onAddRow }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: table.id,
      data: {
        type: 'table',
        table
      }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div
        className={`transition-all duration-200 ${isDragging ? 'scale-95 shadow-2xl' : ''}`}
      >
        <BoardTable
          table={table}
          boardId={boardId}
          onAddRow={onAddRow}
          dragAttributes={attributes}
          dragListeners={listeners}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
};

export default DraggableTable;
