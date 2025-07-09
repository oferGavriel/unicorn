// Create: src/features/board/hooks/useRowOperations.ts
import { useCallback, useState } from 'react';

import { boardApi } from '../services/board.service';

interface UseRowOperationsProps {
  boardId: string;
  tableId: string;
}

interface DeleteRowData {
  rowId: string;
  rowName: string;
}

export const useRowOperations = ({ boardId, tableId }: UseRowOperationsProps) => {
  const [deleteRowData, setDeleteRowData] = useState<DeleteRowData | null>(null);

  const [duplicateRow] = boardApi.useDuplicateRowMutation();
  const [deleteRow, { isLoading: isDeletingRow }] = boardApi.useDeleteRowMutation();

  const handleDuplicateRow = useCallback(
    async (rowId: string) => {
      try {
        await duplicateRow({
          boardId,
          tableId,
          rowId
        }).unwrap();
      } catch (error) {
        console.error('Failed to duplicate row:', error);
      }
    },
    [duplicateRow, boardId, tableId]
  );

  const handleDeleteRow = useCallback((rowId: string, rowName: string) => {
    setDeleteRowData({ rowId, rowName });
  }, []);

  const confirmDeleteRow = useCallback(async () => {
    if (!deleteRowData) {
      return;
    }

    try {
      await deleteRow({
        boardId,
        tableId,
        rowId: deleteRowData.rowId
      }).unwrap();
      setDeleteRowData(null);
    } catch (error) {
      console.error('Failed to delete row:', error);
      // Keep dialog open on error
    }
  }, [deleteRow, boardId, tableId, deleteRowData]);

  const cancelDeleteRow = useCallback(() => {
    setDeleteRowData(null);
  }, []);

  return {
    deleteRowData,
    isDeletingRow,
    handleDuplicateRow,
    handleDeleteRow,
    confirmDeleteRow,
    cancelDeleteRow
  };
};
