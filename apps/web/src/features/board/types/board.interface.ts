import { IAuthUser } from '@/features/auth/types/auth.interface';

import { ITable } from './table.interface';

export interface IBoard {
  id: string;
  name: string;
  description?: string;
  members: IAuthUser[];
  tables?: ITable[];
  order: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBoardList {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateBoardRequest {
  id: string;
  name?: string;
  description?: string;
  order?: number;
}

export interface ICreateBoardRequest {
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface IBoardResponse {
  board: IBoard;
}
