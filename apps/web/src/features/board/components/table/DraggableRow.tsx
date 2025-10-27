import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Row } from '@tanstack/react-table';
import React from 'react';

import { CellTypeEnum } from '../../types';
import { IRow } from '../../types/row.interface';
import { RowMenuDialog } from '../RowMenuDialog';

interface DraggableRowProps {
  row: Row<IRow>;
  tableId: string;
  boardId: string;
  onDuplicate: (rowId: string) => void;
  onDelete: (rowId: string, rowName: string) => void;
  isDeleting?: boolean;
}

const DraggableRow: React.FC<DraggableRowProps> = ({
  row,
  tableId,
  boardId,
  onDuplicate,
  onDelete,
  isDeleting = false
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: row.id,
      data: {
        type: 'row',
        row: row.original,
        tableId,
        boardId
      }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex transition-colors hover:bg-[#2a2a2a] group/row min-h-[36px] items-center relative
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 bg-[#2a2a2a] shadow-lg scale-105 cursor-grabbing' : ''}
      `}
      {...listeners}
      {...attributes}
    >
      {/* Row Menu */}
      <div
        className="absolute -left-10 group-hover/row:opacity-100 opacity-0 transition-opacity duration-200 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <RowMenuDialog
          onDuplicate={() => onDuplicate(row.original.id)}
          onDelete={() => onDelete(row.original.id, row.original.name || 'this row')}
          isDeleting={isDeleting}
        />
      </div>

      {/* Row Cells */}
      {row.getVisibleCells().map((cell) => {
        const isIndicator = cell.column.id === CellTypeEnum.INDICATOR;
        const isSpacer = cell.column.id === CellTypeEnum.SPACER;
        const isTextCell = cell.column.id === 'name'; // Assuming 'name' is the text column

        return (
          <div
            key={cell.id}
            className={`board-table-body-cell h-9 ${isSpacer ? 'flex-1' : ''}`}
            style={{
              width: isIndicator ? '6px' : `${cell.column.getSize()}px`
            }}
            {...(isTextCell
              ? {
                  onPointerDown: (e) => e.stopPropagation(),
                  onMouseDown: (e) => e.stopPropagation(),
                  onClick: (e) => e.stopPropagation()
                }
              : {})}
          >
            <div className={'h-full w-full'}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DraggableRow;
