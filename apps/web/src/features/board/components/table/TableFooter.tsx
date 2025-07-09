import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components';
import { EditableText } from '@/shared/components/EditableText';

import { ITable } from '../../types';
import { IndicatorCell } from './cells';
import { SummaryRow } from './SummaryRow';

export interface TableFooterProps {
  table: ITable;
  isAddingTask: boolean;
  setIsAddingTask: (value: boolean) => void;
  onAddTask: (taskName: string) => Promise<void>;
}

const TableFooter: React.FC<TableFooterProps> = ({
  table,
  isAddingTask,
  setIsAddingTask,
  onAddTask
}) => {
  return (
    <>
      <div className="flex h-9 bg-board-table-color">
        <div className="w-[6px] flex-shrink-0">
          <IndicatorCell tableColor={table.color} position="add-row" />
        </div>

        <div className="w-full border-b border-gray-600 flex items-center">
          <div className="mx-[6px]">
            {isAddingTask ? (
              <div className="flex items-center gap-2 w-full  h-full">
                <EditableText
                  value=""
                  onSave={onAddTask}
                  className="text-gray-400 w-full max-w-80 py-2 h-full"
                  inputClassName="text-gray-400 bg-transparent outline-none max-w-72"
                  placeholder="Enter task name..."
                  validateEmpty={true}
                  autoEdit={true}
                  onCancel={() => setIsAddingTask(false)}
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                className="flex justify-start w-64 h-6 gap-1 ml-6 text-gray-400 outline-1 hover:text-white hover:outline"
                size="sm"
                onClick={() => setIsAddingTask(true)}
              >
                <Plus size={12} />
                Add task
              </Button>
            )}
          </div>
        </div>
      </div>

      <SummaryRow rows={table.rows} />
    </>
  );
};

export default TableFooter;
