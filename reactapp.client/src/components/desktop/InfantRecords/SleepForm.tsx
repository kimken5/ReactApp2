import React, { useState, useEffect, useMemo } from 'react';
import type { SleepRecord } from '../../../types/infantRecords';

interface SleepFormProps {
  value: SleepRecord;
  onChange: (value: SleepRecord) => void;
}

const SleepForm: React.FC<SleepFormProps> = ({
  value,
  onChange
}) => {
  // 初期値の解析: "12:30" → hour: "12", minute: "30"
  const parseTime = (timeStr?: string) => {
    if (!timeStr) return { hour: '', minute: '' };
    const [h, m] = timeStr.split(':');
    return { hour: h, minute: m };
  };

  const startParsed = parseTime(value?.start);
  const endParsed = parseTime(value?.end);

  const [startHour, setStartHour] = useState<string>(startParsed.hour);
  const [startMinute, setStartMinute] = useState<string>(startParsed.minute);
  const [endHour, setEndHour] = useState<string>(endParsed.hour);
  const [endMinute, setEndMinute] = useState<string>(endParsed.minute);

  useEffect(() => {
    const startParsed = parseTime(value?.start);
    const endParsed = parseTime(value?.end);
    setStartHour(startParsed.hour);
    setStartMinute(startParsed.minute);
    setEndHour(endParsed.hour);
    setEndMinute(endParsed.minute);
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '10', '20', '30', '40', '50'];

  const formatTime = (hour: string, minute: string): string => {
    if (!hour || !minute) return '';
    return `${hour}:${minute}`;
  };

  const duration = useMemo(() => {
    const startTime = formatTime(startHour, startMinute);
    const endTime = formatTime(endHour, endMinute);

    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }, [startHour, startMinute, endHour, endMinute]);

  const handleChange = (type: 'start' | 'end', part: 'hour' | 'minute', val: string) => {
    if (type === 'start') {
      if (part === 'hour') setStartHour(val);
      else setStartMinute(val);
    } else {
      if (part === 'hour') setEndHour(val);
      else setEndMinute(val);
    }

    // 親コンポーネントに通知
    const newStart = type === 'start'
      ? formatTime(part === 'hour' ? val : startHour, part === 'minute' ? val : startMinute)
      : formatTime(startHour, startMinute);
    const newEnd = type === 'end'
      ? formatTime(part === 'hour' ? val : endHour, part === 'minute' ? val : endMinute)
      : formatTime(endHour, endMinute);

    onChange({
      ...value,
      start: newStart,
      end: newEnd,
      duration: duration
    });
  };

  return (
    <div className="space-y-6">
      {/* 開始時刻 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">開始時刻</label>
        <div className="flex items-center gap-2">
          <select
            value={startHour}
            onChange={(e) => handleChange('start', 'hour', e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="">--</option>
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="text-2xl font-bold text-gray-400">:</span>
          <select
            value={startMinute}
            onChange={(e) => handleChange('start', 'minute', e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="">--</option>
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 終了時刻 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">終了時刻</label>
        <div className="flex items-center gap-2">
          <select
            value={endHour}
            onChange={(e) => handleChange('end', 'hour', e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="">--</option>
            {hours.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="text-2xl font-bold text-gray-400">:</span>
          <select
            value={endMinute}
            onChange={(e) => handleChange('end', 'minute', e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="">--</option>
            {minutes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 睡眠時間表示 */}
      <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">睡眠時間</span>
          <strong className="text-lg text-green-900">
            {duration > 0 ? `${duration}分` : '--'}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default SleepForm;
