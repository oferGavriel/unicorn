import React, { ReactElement, useMemo } from 'react';

import { PriorityEnum, StatusEnum } from '@/shared/shared.enum';

import { IRow, PRIORITY_CONFIG, STATUS_CONFIG } from '../../types';

export interface SummaryRowProps {
  rows: IRow[];
}

export const SummaryRow: React.FC<SummaryRowProps> = ({ rows }): ReactElement => {
  const statusBreakdown = useMemo(() => {
    if (rows.length === 0) {
      return [];
    }

    const statusCounts = rows.reduce(
      (acc, row) => {
        const status = row.status || StatusEnum.NOT_STARTED;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<StatusEnum, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status as StatusEnum,
      count,
      percentage: Math.round((count / rows.length) * 100)
    }));
  }, [rows]);

  const priorityBreakdown = useMemo(() => {
    if (rows.length === 0) {
      return [];
    }

    const priorityCounts = rows.reduce(
      (acc, row) => {
        const priority = row.priority || PriorityEnum.MEDIUM;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<PriorityEnum, number>
    );

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority as PriorityEnum,
      count,
      percentage: Math.round((count / rows.length) * 100)
    }));
  }, [rows]);

  return (
    <div className="flex h-9">
      <div className="w-[306px] bg-[#111111]"></div>

      <div className="flex bg-[#2a2a2a] flex-1 border-b border-table-border rounded-bl-lg">
        <div className="w-[150px] border-l border-table-border rounded-bl-lg " />

        <div className="w-[134px] flex items-center px-2 py-1 border-x border-table-border">
          {statusBreakdown.map(({ status, percentage }) => (
            <div
              key={status}
              className={`summary-box ${STATUS_CONFIG[status].bgColor}`}
              style={{ width: `${percentage}%`, minWidth: '20px' }}
              title={`${STATUS_CONFIG[status].label}: ${percentage}%`}
            />
          ))}
        </div>

        <div className="w-[150px]" />

        <div className="w-[134px] flex items-center px-2 py-1 border-x border-table-border">
          {priorityBreakdown.map(({ priority, percentage }) => (
            <div
              key={priority}
              className={`summary-box ${PRIORITY_CONFIG[priority].bgColor}`}
              style={{ width: `${percentage}%`, minWidth: '20px' }}
              title={`${PRIORITY_CONFIG[priority].label}: ${percentage}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
