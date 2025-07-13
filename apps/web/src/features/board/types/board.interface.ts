import { ITable } from './table.interface';

export interface IBoard {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
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
  memberIds: string[];
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
