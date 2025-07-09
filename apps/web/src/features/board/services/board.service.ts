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

// Helper function for consistent error handling
const handleMutationError = (error: unknown, operation: string, retry?: () => void) => {
  const message = getErrorMessage(error);
  console.error(`Failed to ${operation}:`, error);

  const toastOptions = retry ? { action: { label: 'Retry', onClick: retry } } : {};

  toast.error(message, toastOptions);
};

// Helper function to update array positions
const updatePositions = <T extends { position: number }>(items: T[]): T[] => {
  return items.map((item, index) => ({
    ...item,
    position: index + 1
  }));
};

// Helper function to reorder items
const reorderItems = <T extends { id: string; position: number }>(
  items: T[],
  draggedId: string,
  newPosition: number
): T[] => {
  const sortedItems = [...items].sort((a, b) => a.position - b.position);
  const draggedIndex = sortedItems.findIndex((item) => item.id === draggedId);

  if (draggedIndex === -1) {
    return sortedItems;
  }

  const [draggedItem] = sortedItems.splice(draggedIndex, 1);
  const insertIndex = Math.min(newPosition - 1, sortedItems.length);
  sortedItems.splice(insertIndex, 0, draggedItem);

  return updatePositions(sortedItems);
};

export const boardApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Board endpoints
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
          handleMutationError(error, 'create board');
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
        const patchResults = [
          dispatch(
            boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
              const board = draft.find((b) => b.id === id);
              if (board) {
                Object.assign(board, patch);
              }
            })
          ),
          dispatch(
            boardApi.util.updateQueryData('getBoardById', id, (draft) => {
              Object.assign(draft, patch);
            })
          )
        ];

        try {
          await queryFulfilled;
        } catch (error) {
          patchResults.forEach((result) => result.undo());
          handleMutationError(error, 'update board');
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
          toast.success('Board deleted successfully');
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'delete board');
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
              draft.push(newBoard);
            })
          );
          toast.success('Board duplicated successfully');
        } catch (error) {
          handleMutationError(error, 'duplicate board');
        }
      }
    }),

    addBoardMember: build.mutation<void, { boardId: string; userId: string }>({
      query: ({ boardId, userId }) => ({
        url: `/boards/${boardId}/members`,
        method: 'POST',
        body: { userId }
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          toast.success('Member added successfully');
        } catch (error) {
          handleMutationError(error, 'add board member');
        }
      }
    }),

    // Table endpoints
    createTable: build.mutation<ITable, ICreateTableRequest>({
      query: ({ boardId, ...body }) => ({
        url: `/boards/${boardId}/tables/`,
        method: 'POST',
        body
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
          toast.success('Table created successfully');
        } catch (error) {
          handleMutationError(error, 'create table');
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
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'update table');
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
          toast.success('Table deleted successfully');
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'delete table');
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
          toast.success('Table duplicated successfully');
        } catch (error) {
          handleMutationError(error, 'duplicate table');
        }
      }
    }),

    updateTablePosition: build.mutation<
      ITable,
      { boardId: string; tableId: string; newPosition: number }
    >({
      query: ({ boardId, tableId, newPosition }) => ({
        url: `/boards/${boardId}/tables/${tableId}/position`,
        method: 'PATCH',
        body: { newPosition }
      }),
      async onQueryStarted(
        { boardId, tableId, newPosition },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (draft.tables) {
              draft.tables = reorderItems(draft.tables, tableId, newPosition);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'reorder table');
        }
      }
    }),

    // Row endpoints
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
          handleMutationError(error, 'create row');
          throw error; // Re-throw to handle in component
        }
      }
    }),

    updateRow: build.mutation<IRow, IUpdateRowRequest>({
      query: ({ boardId, tableId, rowId, ...body }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}`,
        method: 'PATCH',
        body
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { boardId, tableId, rowId, ...patch } = args;
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
          const retryFn = () => dispatch(boardApi.endpoints.updateRow.initiate(args));
          handleMutationError(error, 'update row', retryFn);
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
            if (table?.rows) {
              table.rows = table.rows.filter((r) => r.id !== rowId);
            }
          })
        );

        try {
          await queryFulfilled;
          toast.success('Row deleted successfully');
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'delete row');
        }
      }
    }),

    duplicateRow: build.mutation<
      IRow,
      { boardId: string; tableId: string; rowId: string }
    >({
      query: ({ boardId, tableId, rowId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/duplicate`,
        method: 'POST'
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
          toast.success('Row duplicated successfully');
        } catch (error) {
          handleMutationError(error, 'duplicate row');
        }
      }
    }),

    updateRowPosition: build.mutation<
      IRow,
      {
        boardId: string;
        tableId: string;
        rowId: string;
        newPosition: number;
        targetTableId?: string;
      }
    >({
      query: ({ boardId, tableId, rowId, newPosition, targetTableId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/position`,
        method: 'PATCH',
        body: {
          newPosition,
          targetTableId
        }
      }),
      async onQueryStarted(
        { boardId, tableId, rowId, newPosition, targetTableId },
        { dispatch, queryFulfilled }
      ) {
        const isMovingBetweenTables = targetTableId && targetTableId !== tableId;

        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (isMovingBetweenTables) {
              // Cross-table move
              const sourceTable = draft.tables?.find((t) => t.id === tableId);
              const targetTable = draft.tables?.find((t) => t.id === targetTableId);

              if (sourceTable?.rows && targetTable) {
                const rowIndex = sourceTable.rows.findIndex((r) => r.id === rowId);
                if (rowIndex !== -1) {
                  const [movedRow] = sourceTable.rows.splice(rowIndex, 1);

                  if (!targetTable.rows) {
                    targetTable.rows = [];
                  }

                  const insertIndex = Math.min(newPosition - 1, targetTable.rows.length);
                  targetTable.rows.splice(insertIndex, 0, {
                    ...movedRow,
                    position: newPosition,
                    tableId: targetTableId
                  });

                  // Update positions
                  targetTable.rows = updatePositions(targetTable.rows);
                  sourceTable.rows = updatePositions(sourceTable.rows);
                }
              }
            } else {
              // Same table reorder
              const table = draft.tables?.find((t) => t.id === tableId);
              if (table?.rows) {
                table.rows = reorderItems(table.rows, rowId, newPosition);
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'reorder row');
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
            if (row && !row.owners.some((owner) => owner.id === ownerId)) {
              row.owners.push({
                id: ownerId,
                firstName: 'Loading...',
                lastName: '',
                email: '',
                avatarUrl: 'placeholder'
              });
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
                const ownerIndex = row.owners.findIndex((owner) => owner.id === ownerId);
                if (ownerIndex !== -1) {
                  row.owners[ownerIndex] = newOwner;
                }
              }
            })
          );
          toast.success('Owner added successfully');
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'add row owner');
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
          toast.success('Owner removed successfully');
        } catch (error) {
          patchResult.undo();
          handleMutationError(error, 'remove row owner');
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
  useUpdateTablePositionMutation,
  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
  useDuplicateRowMutation,
  useUpdateRowPositionMutation,
  useAddRowOwnerMutation,
  useRemoveRowOwnerMutation
} = boardApi;
