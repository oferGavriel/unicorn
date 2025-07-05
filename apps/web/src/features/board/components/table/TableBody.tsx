import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import React from 'react';

import { CellTypeEnum } from '../../types';
import { IRow } from '../../types/row.interface';
// import DraggableRow from './DraggableRow';

interface TableBodyProps {
  table: TanStackTable<IRow>;
}

const TableBody: React.FC<TableBodyProps> = ({ table }) => {
  const rows = table.getRowModel().rows;
  if (rows.length === 0) {
    return <div></div>;
  }

  return (
    <div className="board-table-body">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex transition-colors hover:bg-[#2a2a2a] group min-h-[36px] items-center"
        >
          {row.getVisibleCells().map((cell) => {
            const isIndicator = cell.column.id === CellTypeEnum.INDICATOR;
            const isSpacer = cell.column.id === CellTypeEnum.SPACER;

            return (
              <div
                key={cell.id}
                className={`board-table-body-cell h-9 ${isSpacer ? 'flex-1' : ''}`}
                style={{
                  width: isIndicator ? '6px' : `${cell.column.getSize()}px`
                }}
              >
                <div className={'h-full w-full'}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TableBody;
