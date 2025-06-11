import { TableColorEnum } from '@/shared/shared.enum';

import { IRow } from './row.interface';

export interface ITable {
  id: string;
  boardId: string;
  name: string;
  description?: string;
  color: TableColorEnum;
  position: number;
  createdAt: string;
  updatedAt: string;
  rows: IRow[];
}

export interface ICreateTableRequest {
  boardId: string;
  name: string;
  description?: string;
  color?: TableColorEnum;
  position?: number;
}

export interface IUpdateTableRequest {
  boardId: string;
  tableId: string;
  name?: string;
  description?: string;
  color?: TableColorEnum;
  position?: number;
}

export interface IDeleteTableRequest {
  boardId: string;
  tableId: string;
}

export enum AccessorKeyEnum {
  NAME = 'name',
  OWNERS = 'owners',
  STATUS = 'status',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  UPDATED_AT = 'updatedAt',
  INDICATOR = 'indicator',
  SPACER = 'spacer'
}

export enum CellTypeEnum {
  TEXT = 'text',
  STATUS = 'status',
  PRIORITY = 'priority',
  DATE = 'date',
  USERS = 'users',
  READONLY = 'readonly',
  INDICATOR = 'indicator',
  SPACER = 'spacer'
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: AccessorKeyEnum;
  type: CellTypeEnum;
  width?: number;
  sortable?: boolean;
  editable?: boolean;
}

export const TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'indicator',
    accessorKey: AccessorKeyEnum.INDICATOR,
    header: '',
    type: CellTypeEnum.INDICATOR,
    width: 2,
    sortable: false
  },
  {
    id: 'name',
    header: 'Task',
    accessorKey: AccessorKeyEnum.NAME,
    type: CellTypeEnum.TEXT,
    width: 300,
    sortable: true,
    editable: true
  },
  {
    id: 'owners',
    header: 'Owner',
    accessorKey: AccessorKeyEnum.OWNERS,
    type: CellTypeEnum.USERS,
    width: 150,
    sortable: false,
    editable: true
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: AccessorKeyEnum.STATUS,
    type: CellTypeEnum.STATUS,
    width: 134,
    sortable: true,
    editable: true
  },
  {
    id: 'dueDate',
    header: 'Due date',
    accessorKey: AccessorKeyEnum.DUE_DATE,
    type: CellTypeEnum.DATE,
    width: 150,
    sortable: true,
    editable: true
  },
  {
    id: 'priority',
    header: 'Priority',
    accessorKey: AccessorKeyEnum.PRIORITY,
    type: CellTypeEnum.PRIORITY,
    width: 134,
    sortable: true,
    editable: true
  },
  {
    id: 'updatedAt',
    header: 'Last updated',
    accessorKey: AccessorKeyEnum.UPDATED_AT,
    type: CellTypeEnum.READONLY,
    width: 150,
    sortable: true,
    editable: false
  },
  {
    id: 'spacer',
    accessorKey: AccessorKeyEnum.SPACER,
    header: '',
    type: CellTypeEnum.SPACER,
    width: 0,
    sortable: false
  }
];

export const TABLE_COLORS = [
  '#ff5733', // RED
  '#ff8c00', // ORANGE
  '#ffd700', // YELLOW
  '#32cd32', // GREEN
  '#1e90ff', // BLUE
  '#9370db', // PURPLE
  '#ff69b4', // PINK
  '#00ced1', // CYAN
  '#00ff00', // LIME
  '#ff00ff', // MAGENTA
  '#8b4513', // BROWN
  '#808080', // GRAY
  '#000000', // BLACK
  '#ffffff', // WHITE
  '#6b7280' // DEFAULT
] as const;

export type TableColor = (typeof TABLE_COLORS)[number];
