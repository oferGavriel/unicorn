import { flexRender, type Table as TanStackTable } from '@tanstack/react-table';
import React from 'react';

import { CellTypeEnum } from '../../types';
import { IRow } from '../../types/row.interface';

interface TableHeaderProps {
  table: TanStackTable<IRow>;
}

const TableHeader: React.FC<TableHeaderProps> = ({ table }) => {
  return (
    <div className="bg-board-table-color text-gray-400">
      {table.getHeaderGroups().map((headerGroup) => (
        <div key={headerGroup.id} className="flex">
          {headerGroup.headers.map((header) => {
            const isIndicator = header.id === CellTypeEnum.INDICATOR;
            const isSpacer = header.id === CellTypeEnum.SPACER;

            return (
              <div
                key={header.id}
                className={`board-table-header-cell font-medium text-xs tracking-wider h-9
                  ${!isIndicator ? 'px-4 py-3' : ''}
                  ${isSpacer ? 'flex-1' : ''} `}
                style={{
                  width: isIndicator ? '6px' : header.getSize()
                }}
              >
                {header.isPlaceholder ? null : (
                  <div
                    className={`${isIndicator ? 'h-full' : 'flex items-center justify-center space-x-2 h-full cursor-default'}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default TableHeader;
