import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';

import { IRow } from '../../types/row.interface';
import { CellTypeEnum, TableColumn } from '../../types/table.interface';
import {
  DateCell,
  IndicatorCell,
  PriorityCell,
  ReadOnlyCell,
  SpacerCell,
  StatusCell,
  TextCell,
  UsersCell
} from './cells';

type UpdateRowMutationTrigger = (arg: {
  tableId: string;
  rowId: string;
  boardId: string;
  [key: string]: unknown;
}) => {
  unwrap(): Promise<IRow>;
};

type newValueType = string | string[] | StatusEnum | PriorityEnum | Date | number | null;

const isString = (value: unknown): value is string => {
  return typeof value === 'string' || value === null || value === undefined;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isStatusEnum = (value: unknown): value is StatusEnum => {
  return (
    typeof value === 'string' && Object.values(StatusEnum).includes(value as StatusEnum)
  );
};

const isPriorityEnum = (value: unknown): value is PriorityEnum => {
  return (
    typeof value === 'string' &&
    Object.values(PriorityEnum).includes(value as PriorityEnum)
  );
};

export function createTableColumns(
  boardId: string,
  columnDefs: TableColumn[],
  tableColor: string,
  updateRowMutation: UpdateRowMutationTrigger
): ColumnDef<IRow>[] {
  return columnDefs.map((colDef) => ({
    id: colDef.id,
    accessorKey: colDef.accessorKey,
    header: ({ column }) => {
      if (colDef.type === CellTypeEnum.INDICATOR) {
        return <IndicatorCell tableColor={tableColor} position="header" />;
      }

      if (colDef.type === CellTypeEnum.SPACER) {
        return <div className="w-full h-full" />;
      }

      return (
        <div className="flex items-center">
          <span>{colDef.header}</span>
          {colDef.sortable && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-4 w-4 p-0"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
    cell: ({ row, column }): React.ReactNode => {
      if (colDef.type === CellTypeEnum.INDICATOR) {
        return <IndicatorCell tableColor={tableColor} position="body" />;
      }

      if (colDef.type === CellTypeEnum.SPACER) {
        return <SpacerCell />;
      }
      const value = row.getValue(column.id);

      const baseOnUpdate = async (newValue: newValueType) => {
        try {
          await updateRowMutation({
            tableId: row.original.tableId,
            rowId: row.original.id,
            boardId: boardId,
            [colDef.accessorKey]: newValue
          }).unwrap();
        } catch (error) {
          console.error('Failed to update row:', error);
          throw error;
        }
      };

      switch (colDef.type) {
        case 'text': {
          if (!isString(value)) {
            console.warn('Expected string for text cell, got:', typeof value);
          }
          const cellProps = {
            value: (value as string) || '',
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <TextCell {...cellProps} />;
        }

        case 'status': {
          if (!isStatusEnum(value)) {
            console.warn('Expected StatusEnum for status cell, got:', value);
          }
          const cellProps = {
            value: (value as StatusEnum) || StatusEnum.NOT_STARTED,
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <StatusCell {...cellProps} />;
        }

        case 'priority': {
          if (!isPriorityEnum(value)) {
            console.warn('Expected PriorityEnum for priority cell, got:', value);
          }
          const cellProps = {
            value: (value as PriorityEnum) || PriorityEnum.MEDIUM,
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <PriorityCell {...cellProps} />;
        }

        case 'date': {
          if (value !== null && value !== undefined && !isString(value)) {
            console.warn('Expected string or null for date cell, got:', typeof value);
          }
          const cellProps = {
            value: (value as string) || null,
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <DateCell {...cellProps} />;
        }

        case 'users': {
          if (!isStringArray(value) && value !== null && value !== undefined) {
            console.warn('Expected string array for users cell, got:', typeof value);
          }
          const cellProps = {
            value: (value as string[]) || [],
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <UsersCell {...cellProps} />;
        }

        case 'readonly': {
          const cellProps = {
            value: value as string | number | Date,
            row: row.original,
            column: colDef,
            onUpdate: baseOnUpdate
          };
          return <ReadOnlyCell {...cellProps} />;
        }

        default:
          return <span className="text-gray-400">{String(value) || '-'}</span>;
      }
    },
    size: colDef.width,
    enableSorting: colDef.sortable
  }));
}
