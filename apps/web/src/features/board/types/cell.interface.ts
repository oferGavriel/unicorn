import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';

import { IRow } from './row.interface';
import { TableColumn } from './table.interface';

export interface BaseCellProps<T> {
  value: T;
  row: IRow;
  column: TableColumn;
  onUpdate: (newValue: T) => Promise<void> | void;
}

export interface EditableCellState {
  isEditing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingValue: any;
  isLoading: boolean;
  error?: string;
}

export const STATUS_CONFIG = {
  [StatusEnum.NOT_STARTED]: {
    label: 'Not Started',
    bgColor: 'bg-[#797e93]',
    textColor: 'text-gray-200'
  },
  [StatusEnum.WORKING_ON_IT]: {
    label: 'Working on it',
    bgColor: 'bg-[#fdbc64]',
    textColor: 'text-white'
  },
  [StatusEnum.STUCK]: {
    label: 'Stuck',
    bgColor: 'bg-[#e8697d]',
    textColor: 'text-white'
  },
  [StatusEnum.DONE]: {
    label: 'Done',
    bgColor: 'bg-[#33d391]',
    textColor: 'text-white'
  }
} as const;

export const PRIORITY_CONFIG = {
  [PriorityEnum.LOW]: {
    label: 'Low',
    bgColor: 'bg-[#79affd]',
    textColor: 'text-white'
  },
  [PriorityEnum.MEDIUM]: {
    label: 'Medium',
    bgColor: 'bg-[#777ae5]',
    textColor: 'text-white'
  },
  [PriorityEnum.HIGH]: {
    label: 'High',
    bgColor: 'bg-[#6645a9]',
    textColor: 'text-white'
  },
  [PriorityEnum.CRITICAL]: {
    label: 'Critical',
    bgColor: 'bg-[#4b247f]',
    textColor: 'text-white'
  }
} as const;
