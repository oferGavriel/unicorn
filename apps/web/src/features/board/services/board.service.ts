/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '@/store/api';

import {
  IBoard,
  IBoardList,
  ICreateBoardRequest,
  IUpdateBoardRequest
} from '../types/board.interface';
import {
  ICreateRowRequest,
  IDeleteRowRequest,
  IRow,
  IUpdateRowRequest
} from '../types/row.interface';
import {
  ICreateTableRequest,
  IDeleteTableRequest,
  ITable,
  IUpdateTableRequest
} from '../types/table.interface';

export const boardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBoards: build.query<IBoardList[], void>({
      query: () => '/boards/',
      providesTags: ['Board']
    }),
    getBoardById: build.query<IBoard, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Board', id }]
    }),
    createBoard: build.mutation<IBoard, ICreateBoardRequest>({
      query: (body) => ({
        url: '/boards/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Board'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newBoard } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
              draft.push({
                ...newBoard,
                members: newBoard.members.map((user: any) => user.id)
              });
            })
          );
        } catch (error) {
          console.error('Failed to create board:', error);
        }
      }
    }),
    updateBoard: build.mutation<IBoard, IUpdateBoardRequest>({
      query: ({ id, ...body }) => ({
        url: `/boards/${id}`,
        method: 'PATCH',
        body
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResultBoards = dispatch(
          boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
            const board = draft.find((b) => b.id === id);
            if (board) {
              Object.assign(board, patch);
            }
          })
        );

        const patchResultBoard = dispatch(
          boardApi.util.updateQueryData('getBoardById', id, (draft) => {
            Object.assign(draft, patch);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResultBoards.undo();
          patchResultBoard.undo();
        }
      }
    }),
    deleteBoard: build.mutation<void, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE'
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
            return draft.filter((b) => b.id !== id);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
    addBoardMember: build.mutation<void, { boardId: string; userId: string }>({
      query: ({ boardId, userId }) => ({
        url: `/boards/${boardId}/members`,
        method: 'POST',
        body: { userId }
      })
    }),
    createTable: build.mutation<ITable, ICreateTableRequest>({
      query: ({ boardId, ...body }) => ({
        url: `/boards/${boardId}/tables`,
        method: 'POST',
        body
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newTable } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', _arg.boardId, (draft) => {
              if (!draft.tables) {
                draft.tables = [];
              }
              draft.tables.push(newTable);
            })
          );
        } catch (error) {
          console.error('Failed to create table:', error);
        }
      }
    }),
    updateTable: build.mutation<ITable, IUpdateTableRequest>({
      query: ({ boardId, tableId, ...body }) => ({
        url: `/boards/${boardId}/tables/${tableId}`,
        method: 'PATCH',
        body
      }),
      async onQueryStarted({ boardId, tableId, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            if (table) {
              Object.assign(table, patch);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
    deleteTable: build.mutation<void, IDeleteTableRequest>({
      query: ({ boardId, tableId }) => ({
        url: `/boards/${boardId}/tables/${tableId}`,
        method: 'DELETE'
      }),
      async onQueryStarted({ boardId, tableId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (draft.tables) {
              draft.tables = draft.tables.filter((t) => t.id !== tableId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
    createRow: build.mutation<IRow, ICreateRowRequest>({
      query: ({ tableId, ...body }) => ({
        url: `/tables/${tableId}/rows/`,
        method: 'POST',
        body
      }),
      async onQueryStarted({ boardId, tableId }, { dispatch, queryFulfilled }) {
        try {
          const { data: newRow } = await queryFulfilled;

          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              if (table) {
                if (!table.rows) {
                  table.rows = [];
                }
                table.rows.push(newRow);
              }
            })
          );
        } catch (error) {
          console.error('Failed to create row:', error);
          throw error;
        }
      }
    }),
    updateRow: build.mutation<IRow, IUpdateRowRequest>({
      query: ({ tableId, rowId, ...body }) => ({
        url: `/tables/${tableId}/rows/${rowId}`,
        method: 'PATCH',
        body
      }),
      async onQueryStarted(
        { boardId, tableId, rowId, ...patch },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            const row = table?.rows?.find((r) => r.id === rowId);
            if (row) {
              Object.assign(row, patch);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patchResult.undo();
          console.error('Failed to update row:', error);
          throw error;
        }
      }
    }),
    deleteRow: build.mutation<void, IDeleteRowRequest>({
      query: ({ tableId, rowId }) => ({
        url: `/tables/${tableId}/rows/${rowId}`,
        method: 'DELETE'
      }),
      async onQueryStarted({ tableId, rowId }, { dispatch, queryFulfilled, getState }) {
        const patchResults: any[] = [];

        const state = getState() as any;
        const boardQueries = boardApi.util.selectCachedArgsForQuery(
          state,
          'getBoardById'
        );

        boardQueries.forEach((boardId) => {
          const patchResult = dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              if (table?.rows) {
                table.rows = table.rows.filter((r) => r.id !== rowId);
              }
            })
          );
          patchResults.push(patchResult);
        });

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((result) => result.undo());
        }
      }
    })
  })
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useAddBoardMemberMutation,

  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,

  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation
} = boardApi;
