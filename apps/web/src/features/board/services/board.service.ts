import { toast } from 'sonner';

import { IAuthUser } from '@/features/auth';
import { api, getErrorMessage } from '@/store/api';

import {
  IBoard,
  IBoardList,
  ICreateBoardRequest,
  IUpdateBoardRequest
} from '../types/board.interface';
import {
  IAddRowOwnerRequest,
  ICreateRowRequest,
  IDeleteRowRequest,
  IRemoveRowOwnerRequest,
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
                members: newBoard.members.map((user: IAuthUser) => user.id)
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
    duplicateBoard: build.mutation<IBoardList, string>({
      query: (id) => ({
        url: `/boards/${id}/duplicate`,
        method: 'POST'
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newBoard } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
              draft.push({
                ...newBoard
              });
            })
          );
        } catch (error) {
          console.error('Failed to duplicate board:', error);
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
        url: `/boards/${boardId}/tables/`,
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
    duplicateTable: build.mutation<ITable, { boardId: string; tableId: string }>({
      query: ({ boardId, tableId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/duplicate`,
        method: 'POST'
      }),
      async onQueryStarted({ boardId }, { dispatch, queryFulfilled }) {
        try {
          const { data: newTable } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              if (!draft.tables) {
                draft.tables = [];
              }
              draft.tables.push(newTable);
            })
          );
        } catch (error) {
          console.error('Failed to duplicate table:', error);
        }
      }
    }),
    createRow: build.mutation<IRow, ICreateRowRequest>({
      query: ({ boardId, tableId, ...body }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/`,
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
      query: ({ boardId, tableId, rowId, ...body }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}`,
        method: 'PATCH',
        body
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { boardId, tableId, rowId, ...patch } = _arg;
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
          const { data: updatedRow } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              const row = table?.rows?.find((r) => r.id === rowId);
              if (row) {
                Object.assign(row, updatedRow);
              }
            })
          );
        } catch (error) {
          patchResult.undo();
          console.log('got error:', error);
          console.log('got message', getErrorMessage(error));
          toast.error(getErrorMessage(error), {
            action: {
              label: 'Retry',
              onClick: () => dispatch(boardApi.endpoints.updateRow.initiate(_arg))
            }
          });
        }
      }
    }),
    deleteRow: build.mutation<void, IDeleteRowRequest>({
      query: ({ boardId, tableId, rowId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}`,
        method: 'DELETE'
      }),
      async onQueryStarted({ boardId, tableId, rowId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            if (table && table.rows) {
              table.rows = table.rows.filter((r) => r.id !== rowId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch (error) {
          patchResult.undo();
          console.error('Failed to delete row:', error);
        }
      }
    }),
    addRowOwner: build.mutation<IAuthUser, IAddRowOwnerRequest>({
      query: ({ boardId, tableId, rowId, ownerId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/owners/${ownerId}`,
        method: 'POST'
      }),
      async onQueryStarted(
        { boardId, tableId, rowId, ownerId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            const row = table?.rows?.find((r) => r.id === rowId);
            if (row) {
              const ownerExists = row.owners.some((owner) => owner.id === ownerId);
              if (!ownerExists) {
                const placeholder = {
                  id: ownerId,
                  firstName: 'Loading...',
                  lastName: '',
                  email: '',
                  avatarUrl: 'placeholder'
                };
                row.owners.push(placeholder);
              }
            }
          })
        );
        try {
          const { data: newOwner } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              const row = table?.rows?.find((r) => r.id === rowId);
              if (row) {
                const index = row.owners.findIndex((owner) => owner.id === ownerId);
                if (index !== -1) {
                  row.owners[index] = newOwner;
                }
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      }
    }),
    removeRowOwner: build.mutation<void, IRemoveRowOwnerRequest>({
      query: ({ boardId, tableId, rowId, ownerId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/owners/${ownerId}`,
        method: 'DELETE'
      }),
      async onQueryStarted(
        { boardId, tableId, rowId, ownerId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            const row = table?.rows?.find((r) => r.id === rowId);
            if (row) {
              row.owners = row.owners.filter((owner) => owner.id !== ownerId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
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
  useDuplicateBoardMutation,
  useAddBoardMemberMutation,

  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useDuplicateTableMutation,

  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
  useAddRowOwnerMutation,
  useRemoveRowOwnerMutation
} = boardApi;
