import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useCallback, useState } from 'react';

import {
  useUpdateTablePositionMutation,
  useUpdateRowPositionMutation
} from '../services/board.service';
import { ITable, IRow } from '../types';

interface Props {
  boardId: string;
  tables: ITable[];
}

interface DragState {
  activeTable: ITable | null;
  activeRow: { row: IRow; tableId: string } | null;
  dropTargetTable: string | null;
}

export const useBoardDragAndDrop = ({ boardId, tables }: Props) => {
  const [updateTablePosition] = useUpdateTablePositionMutation();
  const [updateRowPosition] = useUpdateRowPositionMutation();

  const [dragState, setDragState] = useState<DragState>({
    activeTable: null,
    activeRow: null,
    dropTargetTable: null
  });

  /* sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /* drag-start */
  const handleDragStart = useCallback(
    (e: DragStartEvent) => {
      const data = e.active.data.current;
      if (!data) return;

      if (data.type === 'table') {
        setDragState({
          activeTable: tables.find((t) => t.id === e.active.id) || null,
          activeRow: null,
          dropTargetTable: null
        });
      }

      if (data.type === 'row') {
        setDragState({
          activeTable: null,
          activeRow: { row: data.row as IRow, tableId: data.tableId as string },
          dropTargetTable: null
        });
      }
    },
    [tables]
  );

  /* drag-over */
  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    const activeData = active.data.current;
    const overData = over?.data.current;

    if (!over || activeData?.type !== 'row') {
      setDragState((s) => ({ ...s, dropTargetTable: null }));
      return;
    }

    const overTableId = overData?.type === 'table' ? overData.tableId : overData?.tableId;

    setDragState((s) => ({
      ...s,
      dropTargetTable:
        overTableId && overTableId !== activeData.tableId ? overTableId : null
    }));
  }, []);

  /* drag-end */
  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;
      const activeData = active.data.current;
      const overData = over?.data.current;

      setDragState({ activeTable: null, activeRow: null, dropTargetTable: null });

      if (!over || active.id === over.id || !activeData) return;

      /* table ⇄ table */
      if (activeData.type === 'table' && overData?.type === 'table') {
        const newIdx = tables.findIndex((t) => t.id === overData.tableId);
        if (newIdx === -1) return;
        try {
          await updateTablePosition({
            boardId,
            tableId: active.id as string,
            newPosition: newIdx + 1
          }).unwrap();
        } catch (err) {
          console.error('updateTablePosition failed', err);
        }
        return;
      }

      /* row move (same / other table) */
      if (activeData.type === 'row') {
        const sourceTableId = activeData.tableId;
        let targetTableId = sourceTableId;
        let newPosition = 1;

        if (overData?.type === 'table') {
          targetTableId = overData.tableId;
          const tgtTable = tables.find((t) => t.id === targetTableId);
          newPosition = (tgtTable?.rows?.length || 0) + 1; // bottom
        } else if (overData?.type === 'row') {
          targetTableId = overData.tableId;
          const tgtTable = tables.find((t) => t.id === targetTableId);
          const tgtRow = tgtTable?.rows?.find((r) => r.id === over.id);
          newPosition = tgtRow?.position ?? 1;
        }

        try {
          await updateRowPosition({
            boardId,
            rowId: active.id as string,
            tableId: sourceTableId,
            newPosition,
            targetTableId: targetTableId !== sourceTableId ? targetTableId : undefined
          }).unwrap();
        } catch (err) {
          console.error('updateRowPosition failed', err);
        }
      }
    },
    [boardId, tables, updateRowPosition, updateTablePosition]
  );

  return { sensors, dragState, handleDragStart, handleDragOver, handleDragEnd };
};
