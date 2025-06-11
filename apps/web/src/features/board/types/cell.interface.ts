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
