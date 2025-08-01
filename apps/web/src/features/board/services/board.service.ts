import { IAuthUser } from '@/features/auth';
import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';
import { api } from '@/store/api';
import { showErrorToast, showSuccessToast } from '@/store/errorHandler';

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
  IUpdateTableRequest,
  TableColor
} from '../types/table.interface';
import { generateTempId } from '../utils/board.utils';

const updatePositions = <T extends { position: number }>(items: T[]): T[] => {
  return items.map((item, index) => ({
    ...item,
    position: index + 1
  }));
};

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
              if (!draft) {
                draft = [];
              }

              draft.push({
                ...newBoard
              });
            })
          );
          showSuccessToast(`Board "${newBoard.name}" created successfully`);
        } catch (error) {
          showErrorToast(error, 'create board');
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
          showSuccessToast('Board updated successfully');
        } catch (error) {
          patchResults.forEach((result) => result.undo());
          showErrorToast(error, 'update board');
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
          showSuccessToast('Board deleted successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'delete board');
        }
      }
    }),

    duplicateBoard: build.mutation<IBoardList, string>({
      query: (id) => ({
        url: `/boards/${id}/duplicate`,
        method: 'POST'
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: newBoard } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoards', undefined, (draft) => {
              draft.push(newBoard);
            })
          );
          showSuccessToast('Board duplicated successfully');
        } catch (error) {
          showErrorToast(error, 'duplicate board');
        }
      }
    }),

    addBoardMember: build.mutation<string, { boardId: string; userId: string }>({
      query: ({ boardId, userId }) => ({
        url: `/boards/${boardId}/members`,
        method: 'POST',
        body: { userId }
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'BoardMembers', id: boardId }
      ],
      async onQueryStarted({ boardId, userId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              if (!draft.memberIds) {
                draft.memberIds = [];
              }
              if (!draft.memberIds.includes(userId)) {
                draft.memberIds.push(userId);
              }
            })
          );

          showSuccessToast('Member added successfully');
        } catch (error) {
          showErrorToast(error, 'add board member');
        }
      }
    }),

    removeBoardMember: build.mutation<void, { boardId: string; userId: string }>({
      query: ({ boardId, userId }) => ({
        url: `/boards/${boardId}/members/${userId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_result, _error, { boardId }) => [
        { type: 'Board', id: boardId },
        { type: 'BoardMembers', id: boardId }
      ],
      async onQueryStarted({ boardId, userId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (draft.memberIds) {
              draft.memberIds = draft.memberIds.filter((id) => id !== userId);
            }
          })
        );

        try {
          await queryFulfilled;
          showSuccessToast('Member removed successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'remove board member');
        }
      }
    }),

    getBoardMembers: build.query<IAuthUser[], string>({
      query: (boardId) => `/boards/${boardId}/members`,
      providesTags: (_result, _error, boardId) => [
        { type: 'Board', id: boardId },
        { type: 'BoardMembers', id: boardId }
      ],
      async onQueryStarted(boardId, { dispatch, queryFulfilled }) {
        try {
          const { data: members } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              draft.memberIds = members.map((user: IAuthUser) => user.id);
            })
          );
        } catch (error) {
          console.log('Failed to fetch board members:', error);
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
      async onQueryStarted({ boardId, ...tableData }, { dispatch, queryFulfilled }) {
        const tempId = generateTempId('table');

        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (!draft.tables) {
              draft.tables = [];
            }

            const newTable: ITable = {
              id: tempId,
              name: tableData.name,
              color: tableData.color as TableColor,
              position: draft.tables.length + 1,
              rows: [],
              boardId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            draft.tables.push(newTable);
          })
        );

        try {
          const { data: newTable } = await queryFulfilled;
          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              if (!draft.tables) {
                return;
              }

              const tempIndex = draft.tables.findIndex((t) => t.id === tempId);

              if (tempIndex !== -1) {
                draft.tables[tempIndex] = newTable;
              } else {
                console.warn('temp table not found, adding real table');
                draft.tables.push(newTable);
              }
            })
          );
          showSuccessToast('Table created successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'create table');
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
          showErrorToast(error, 'update table');
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
          showSuccessToast('Table deleted successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'delete table');
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
              draft.tables.sort((a, b) => a.position - b.position);
            })
          );

          showSuccessToast('Table duplicated successfully');
        } catch (error) {
          showErrorToast(error, 'duplicate table');
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
          showErrorToast(error, 'reorder table');
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
      async onQueryStarted(
        { boardId, tableId, ...rowData },
        { dispatch, queryFulfilled }
      ) {
        const tempId = generateTempId('row');

        // Optimistic update
        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            const table = draft.tables?.find((t) => t.id === tableId);
            if (table) {
              if (!table.rows) {
                table.rows = [];
              }

              const newRow: IRow = {
                id: tempId,
                name: rowData.name,
                position: table.rows.length + 1,
                tableId,
                status: StatusEnum.NOT_STARTED,
                priority: PriorityEnum.MEDIUM,
                owners: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              table.rows.push(newRow);
            }
          })
        );

        try {
          const { data: newRow } = await queryFulfilled;

          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              const tempIndex = table?.rows?.findIndex((r) => r.id === tempId) || -1;

              if (table?.rows && tempIndex !== -1) {
                table.rows[tempIndex] = newRow;
              }
            })
          );
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'create row');
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
          showErrorToast(error, 'update row');
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
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'delete row');
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
      async onQueryStarted({ boardId, tableId, rowId }, { dispatch, queryFulfilled }) {
        try {
          const { data: newRow } = await queryFulfilled;

          dispatch(
            boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
              const table = draft.tables?.find((t) => t.id === tableId);
              if (table) {
                if (!table.rows) {
                  table.rows = [];
                }

                const originalRow = table.rows.find((r) => r.id === rowId);
                const originalPosition = originalRow?.position || table.rows.length;

                const insertIndex = table.rows.findIndex(
                  (r) => r.position > originalPosition
                );

                if (insertIndex === -1) {
                  table.rows.push(newRow);
                } else {
                  table.rows.splice(insertIndex, 0, newRow);
                }

                table.rows.forEach((row, index) => {
                  row.position = index + 1;
                });
              }
            })
          );
          showSuccessToast('Row duplicated successfully');
        } catch (error) {
          showErrorToast(error, 'duplicate row');
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
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { boardId, tableId, rowId, newPosition, targetTableId } = args;
        const isMovingBetweenTables = targetTableId && targetTableId !== tableId;

        const patchResult = dispatch(
          boardApi.util.updateQueryData('getBoardById', boardId, (draft) => {
            if (isMovingBetweenTables) {
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

                  targetTable.rows = updatePositions(targetTable.rows);
                  sourceTable.rows = updatePositions(sourceTable.rows);
                }
              }
            } else {
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
          showErrorToast(error, 'reorder row');
        }
      }
    }),

    addRowOwner: build.mutation<IAuthUser, IAddRowOwnerRequest>({
      query: ({ boardId, tableId, rowId, ownerId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/owners/${ownerId}`,
        method: 'POST'
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { boardId, tableId, rowId, ownerId } = args;

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
          showSuccessToast('Owner added successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'add row owner');
        }
      }
    }),

    removeRowOwner: build.mutation<void, IRemoveRowOwnerRequest>({
      query: ({ boardId, tableId, rowId, ownerId }) => ({
        url: `/boards/${boardId}/tables/${tableId}/rows/${rowId}/owners/${ownerId}`,
        method: 'DELETE'
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { boardId, tableId, rowId, ownerId } = args;

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
          showSuccessToast('Owner removed successfully');
        } catch (error) {
          patchResult.undo();
          showErrorToast(error, 'remove row owner');
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
  useRemoveBoardMemberMutation,
  useGetBoardMembersQuery,
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
