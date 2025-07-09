import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useCallback, useState } from 'react';

import { useUpdateRowPositionMutation } from '../services/board.service';
import { IRow } from '../types/row.interface';

interface UseRowDragAndDropProps {
  boardId: string;
  tableId: string;
  rows: IRow[];
}

export const useRowDragAndDrop = ({ boardId, tableId, rows }: UseRowDragAndDropProps) => {
  const [updateRowPosition] = useUpdateRowPositionMutation();
  const [activeRow, setActiveRow] = useState<IRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent): void => {
      if (event.active.data.current?.type === 'row') {
        const draggedRow = rows.find((row) => row.id === event.active.id);
        setActiveRow(draggedRow || null);
      }
    },
    [rows]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent): Promise<void> => {
      const { active, over } = event;
      setActiveRow(null);

      if (!over || active.id === over.id) {
        return;
      }
      if (active.data.current?.type !== 'row' || over.data.current?.type !== 'row') {
        return;
      }

      const targetIndex = rows.findIndex((row) => row.id === over.id);
      const newPosition = targetIndex + 1;

      try {
        await updateRowPosition({
          boardId,
          tableId,
          rowId: active.id as string,
          newPosition
        }).unwrap();
      } catch (error) {
        console.error('Failed to update row position:', error);
      }
    },
    [boardId, tableId, rows, updateRowPosition]
  );

  return {
    sensors,
    activeRow,
    handleDragStart,
    handleDragEnd
  };
};
