import { IRow } from './row.interface';

export const TABLE_COLORS = [
  '#037f4c', // GREEN
  '#00c875', // LIGHT GREEN
  '#9cd326', // LIME GREEN
  '#cab641', // YELLOW GREEN
  '#ffcb00', // GOLD
  '#784bd1', // PURPLE
  '#9370db', // VIOLET
  '#007eb5', // BLUE
  '#579bfc', // LIGHT BLUE
  '#66ccff', // SKY BLUE
  '#bb3354', // RED
  '#df2f4a', // PINK RED
  '#ff007f', // HOT PINK
  '#ff5ac4', // FUCHSIA
  '#ff642e', // ORANGE RED
  '#fdab3d', // ORANGE
  '#c4c4c4', // GRAY
  '#757575' // DARK GRAY
] as const;

export interface ITable {
  id: string;
  boardId: string;
  name: string;
  description?: string;
  color: TableColor;
  position: number;
  createdAt: string;
  updatedAt: string;
  rows: IRow[];
}

export interface ICreateTableRequest {
  boardId: string;
  name: string;
  description?: string;
  color?: TableColor;
  position?: number;
}

export interface IUpdateTableRequest {
  boardId: string;
  tableId: string;
  name?: string;
  description?: string;
  color?: TableColor;
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

export const getRandomTableColor = (existingTables: ITable[] = []): TableColor => {
  const usedColors = new Set(existingTables.map((table) => table.color));
  const availableColors = TABLE_COLORS.filter((color) => !usedColors.has(color));

  const colorsToChooseFrom = availableColors.length > 0 ? availableColors : TABLE_COLORS;
  const randomIndex = Math.floor(Math.random() * colorsToChooseFrom.length);
  return colorsToChooseFrom[randomIndex];
};

export type TableColor = (typeof TABLE_COLORS)[number];
