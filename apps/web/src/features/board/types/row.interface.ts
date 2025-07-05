import { IAuthUser } from '@/features/auth';
import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';

export interface IRow {
  id: string;
  tableId: string;
  name: string;
  status: StatusEnum;
  owners: IAuthUser[];
  priority: PriorityEnum;
  dueDate?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateRowRequest {
  boardId: string;
  tableId: string;
  name: string;
  position?: number;
}

export interface IUpdateRowRequest {
  boardId: string;
  tableId: string;
  rowId: string;
  name?: string;
  owners?: string[];
  status?: StatusEnum;
  priority?: PriorityEnum;
  dueDate?: string;
  position?: number;
}

export interface IDeleteRowRequest {
  boardId: string;
  tableId: string;
  rowId: string;
}

export interface IAddRowOwnerRequest {
  boardId: string;
  tableId: string;
  rowId: string;
  ownerId: string;
}

export interface IRemoveRowOwnerRequest {
  boardId: string;
  tableId: string;
  rowId: string;
  ownerId: string;
}
