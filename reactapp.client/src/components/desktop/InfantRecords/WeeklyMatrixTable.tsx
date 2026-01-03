import React from 'react';
import type { ChildWeeklyRecord, EditingCell } from '../../../types/infantRecords';
import { generateDateRange, formatDateHeader, formatDateKey } from '../../../utils/infantRecordFormatters';
import ChildRecordRows from './ChildRecordRows';
import './WeeklyMatrixTable.css';

interface WeeklyMatrixTableProps {
  weekStartDate: Date;
  children: ChildWeeklyRecord[];
  onCellClick: (editingCell: EditingCell) => void;
  onDropdownChange: (params: {
    childId: number;
    date: string;
    recordType: string;
    value: string;
    subType?: string;
  }) => Promise<void>;
}

const WeeklyMatrixTable: React.FC<WeeklyMatrixTableProps> = ({
  weekStartDate,
  children,
  onCellClick,
  onDropdownChange
}) => {
  const dateRange = generateDateRange(weekStartDate);

  return (
    <div className="table-container">
      <table className="infant-weekly-matrix">
        <thead>
          <tr>
            <th className="col-child-name">園児名</th>
            <th className="col-category">項目</th>
            <th className="col-item">詳細</th>
            {dateRange.map(date => (
              <th key={formatDateKey(date)} className="col-date">
                {formatDateHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children.map(child => (
            <ChildRecordRows
              key={child.childId}
              child={child}
              dateRange={dateRange}
              onCellClick={onCellClick}
              onDropdownChange={onDropdownChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyMatrixTable;
