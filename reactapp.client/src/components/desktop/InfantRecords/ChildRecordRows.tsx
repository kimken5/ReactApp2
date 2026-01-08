import React from 'react';
import type { ChildWeeklyRecord, EditingCell } from '../../../types/infantRecords';
import {
  formatDateKey,
  formatTemperature,
  formatMealAmount,
  formatMoodState,
  formatSleep,
  formatUrineAmount,
  formatBowelCondition,
  formatDiaperChangeCount
} from '../../../utils/infantRecordFormatters';
import DropdownCell from './DropdownCell';
import {
  MEAL_AMOUNT_OPTIONS,
  MOOD_OPTIONS,
  URINE_AMOUNT_OPTIONS,
  DIAPER_CHANGE_OPTIONS
} from './dropdownOptions';

interface ChildRecordRowsProps {
  child: ChildWeeklyRecord;
  dateRange: Date[];
  onCellClick: (editingCell: EditingCell) => void;
  onDropdownChange: (params: {
    childId: number;
    date: string;
    recordType: string;
    value: string;
    subType?: string;
  }) => Promise<void>;
}

const ChildRecordRows: React.FC<ChildRecordRowsProps> = ({
  child,
  dateRange,
  onCellClick,
  onDropdownChange
}) => {
  // 園児の行数を計算（rowspan用）
  const homeRowCount = 2; // 体温、様子
  const morningRowCount = 3; // 体温、おやつ、機嫌
  const afternoonRowCount = 5; // 機嫌、昼食、昼寝、体温、おやつ
  const toiletingRowCount = 3; // おしっこ、うんち、おむつ交換
  const totalRowCount = homeRowCount + morningRowCount + afternoonRowCount + toiletingRowCount;

  // 本日の日付を取得（時刻を0:00:00にリセット）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 日付が未来かどうかを判定
  const isFutureDate = (date: Date): boolean => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  // 日付が今日かどうかを判定
  const isToday = (date: Date): boolean => {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  // セルのクラス名を生成
  const getCellClassName = (baseClass: string, date: Date): string => {
    const classes = [baseClass];
    if (isToday(date)) classes.push('today');
    if (isFutureDate(date)) classes.push('future-date');
    return classes.join(' ');
  };

  return (
    <>
      {/* 家庭セクション */}
      {/* 体温 (家庭) - 編集不可 */}
      <tr className="row-data">
        <td className="child-name-cell" rowSpan={totalRowCount}>
          {child.firstName}
        </td>
        <td className="category-cell parent-category" rowSpan={homeRowCount}>
          家庭
        </td>
        <td className="item-label">体温</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const temp = child.dailyRecords[dateKey]?.home?.temperature;
          const cellClasses = getCellClassName('data-cell parent-input readonly', date);
          return (
            <td
              key={dateKey}
              className={cellClasses}
              style={{ cursor: 'not-allowed', backgroundColor: isToday(date) ? undefined : '#f9fafb' }}
            >
              {formatTemperature(temp)}
            </td>
          );
        })}
      </tr>

      {/* 様子 (家庭) */}
      <tr className="row-data">
        <td className="item-label">様子</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const note = child.dailyRecords[dateKey]?.home?.parentNote;
          const cellClasses = getCellClassName('data-cell parent-input readonly note-cell', date);
          return (
            <td
              key={dateKey}
              className={cellClasses}
            >
              {note?.text || ''}
            </td>
          );
        })}
      </tr>

      {/* 午前セクション */}
      {/* 体温 (午前) */}
      <tr className="row-data">
        <td className="category-cell staff-category" rowSpan={morningRowCount}>
          午前
        </td>
        <td className="item-label">体温</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const temp = child.dailyRecords[dateKey]?.morning?.temperature;
          const isFuture = isFutureDate(date);
          return (
            <td
              key={dateKey}
              className={getCellClassName('data-cell staff-input editable', date)}
              onClick={!isFuture ? () => onCellClick({
                childId: child.childId,
                childName: child.firstName,
                date: dateKey,
                recordType: 'temperature',
                measurementType: 'morning',
                currentValue: temp,
                recordId: temp?.id
              }) : undefined}
              style={isFuture ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              {formatTemperature(temp)}
            </td>
          );
        })}
      </tr>

      {/* おやつ (午前) - ドロップダウン */}
      <tr className="row-data">
        <td className="item-label">おやつ</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const snack = child.dailyRecords[dateKey]?.morning?.snack;
          return (
            <DropdownCell
              key={dateKey}
              value={snack?.amount || ''}
              options={MEAL_AMOUNT_OPTIONS}
              displayText={formatMealAmount(snack)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'meal',
                value: newValue,
                subType: 'morning-snack'
              })}
            />
          );
        })}
      </tr>

      {/* 機嫌 (午前) - ドロップダウン */}
      <tr className="row-data">
        <td className="item-label">機嫌</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const mood = child.dailyRecords[dateKey]?.morning?.mood;
          return (
            <DropdownCell
              key={dateKey}
              value={mood?.state || ''}
              options={MOOD_OPTIONS}
              displayText={formatMoodState(mood)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'mood',
                value: newValue,
                subType: 'morning'
              })}
            />
          );
        })}
      </tr>

      {/* 午後セクション */}
      {/* 昼食 - ドロップダウン */}
      <tr className="row-data">
        <td className="category-cell staff-category" rowSpan={afternoonRowCount}>
          午後
        </td>
        <td className="item-label">昼食</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const lunch = child.dailyRecords[dateKey]?.afternoon?.lunch;
          return (
            <DropdownCell
              key={dateKey}
              value={lunch?.amount || ''}
              options={MEAL_AMOUNT_OPTIONS}
              displayText={formatMealAmount(lunch)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'meal',
                value: newValue,
                subType: 'lunch'
              })}
            />
          );
        })}
      </tr>

      {/* 昼寝 */}
      <tr className="row-data">
        <td className="item-label">昼寝</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const nap = child.dailyRecords[dateKey]?.afternoon?.nap;
          const isFuture = isFutureDate(date);
          return (
            <td
              key={dateKey}
              className={getCellClassName('data-cell staff-input editable', date)}
              onClick={!isFuture ? () => onCellClick({
                childId: child.childId,
                childName: child.firstName,
                date: dateKey,
                recordType: 'sleep',
                currentValue: nap,
                recordId: nap?.id
              }) : undefined}
              style={isFuture ? { cursor: 'not-allowed', opacity: 0.5 } : { whiteSpace: 'pre-line' }}
            >
              {formatSleep(nap)}
            </td>
          );
        })}
      </tr>

      {/* 体温 (午後) */}
      <tr className="row-data">
        <td className="item-label">体温</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const temp = child.dailyRecords[dateKey]?.afternoon?.temperature;
          const isFuture = isFutureDate(date);
          return (
            <td
              key={dateKey}
              className={getCellClassName('data-cell staff-input editable', date)}
              onClick={!isFuture ? () => onCellClick({
                childId: child.childId,
                childName: child.firstName,
                date: dateKey,
                recordType: 'temperature',
                measurementType: 'afternoon',
                currentValue: temp,
                recordId: temp?.id
              }) : undefined}
              style={isFuture ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              {formatTemperature(temp)}
            </td>
          );
        })}
      </tr>

      {/* おやつ (午後) - ドロップダウン */}
      <tr className="row-data">
        <td className="item-label">おやつ</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const snack = child.dailyRecords[dateKey]?.afternoon?.snack;
          return (
            <DropdownCell
              key={dateKey}
              value={snack?.amount || ''}
              options={MEAL_AMOUNT_OPTIONS}
              displayText={formatMealAmount(snack)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'meal',
                value: newValue,
                subType: 'afternoon-snack'
              })}
            />
          );
        })}
      </tr>

      {/* 機嫌 (午後) - ドロップダウン */}
      <tr className="row-data">
        <td className="item-label">機嫌</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const mood = child.dailyRecords[dateKey]?.afternoon?.mood;
          return (
            <DropdownCell
              key={dateKey}
              value={mood?.state || ''}
              options={MOOD_OPTIONS}
              displayText={formatMoodState(mood)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'mood',
                value: newValue,
                subType: 'afternoon'
              })}
            />
          );
        })}
      </tr>

      {/* 排泄セクション */}
      {/* おしっこ - ドロップダウン */}
      <tr className="row-data">
        <td className="category-cell staff-category" rowSpan={toiletingRowCount}>
          排泄
        </td>
        <td className="item-label">おしっこ</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const toileting = child.dailyRecords[dateKey]?.toileting;
          return (
            <DropdownCell
              key={dateKey}
              value={toileting?.urineAmount?.toString() || ''}
              options={URINE_AMOUNT_OPTIONS}
              displayText={formatUrineAmount(toileting?.urineAmount)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'toileting',
                value: newValue,
                subType: 'urine'
              })}
            />
          );
        })}
      </tr>

      {/* うんち */}
      <tr className="row-data">
        <td className="item-label">うんち</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const toileting = child.dailyRecords[dateKey]?.toileting;
          const isFuture = isFutureDate(date);
          return (
            <td
              key={dateKey}
              className={getCellClassName('data-cell staff-input editable', date)}
              onClick={!isFuture ? () => onCellClick({
                childId: child.childId,
                childName: child.firstName,
                date: dateKey,
                recordType: 'toileting',
                toiletingSubType: 'bowel',
                currentValue: toileting,
                recordId: toileting?.id
              }) : undefined}
              style={isFuture ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              {formatBowelCondition(toileting?.bowelCondition, toileting?.bowelColor)}
            </td>
          );
        })}
      </tr>

      {/* おむつ交換 - ドロップダウン */}
      <tr className="row-data">
        <td className="item-label">おむつ交換</td>
        {dateRange.map(date => {
          const dateKey = formatDateKey(date);
          const toileting = child.dailyRecords[dateKey]?.toileting;
          return (
            <DropdownCell
              key={dateKey}
              value={toileting?.diaperChangeCount?.toString() || ''}
              options={DIAPER_CHANGE_OPTIONS}
              displayText={formatDiaperChangeCount(toileting?.diaperChangeCount)}
              className={isToday(date) ? 'today' : isFutureDate(date) ? 'future-date' : ''}
              disabled={isFutureDate(date)}
              onChange={(newValue) => onDropdownChange({
                childId: child.childId,
                date: dateKey,
                recordType: 'toileting',
                value: newValue,
                subType: 'diaper'
              })}
            />
          );
        })}
      </tr>
    </>
  );
};

export default ChildRecordRows;
