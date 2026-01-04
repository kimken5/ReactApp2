import React, { useState, useEffect } from 'react';
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
  const [sleepQuality, setSleepQuality] = useState<string>(value?.sleepQuality || '');

  useEffect(() => {
    const startParsed = parseTime(value?.start);
    const endParsed = parseTime(value?.end);
    setStartHour(startParsed.hour);
    setStartMinute(startParsed.minute);
    setEndHour(endParsed.hour);
    setEndMinute(endParsed.minute);
    setSleepQuality(value?.sleepQuality || '');
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '10', '20', '30', '40', '50'];

  const formatTime = (hour: string, minute: string): string => {
    if (!hour || !minute) return '';
    return `${hour}:${minute}`;
  };

  const handleChange = (type: 'start' | 'end', part: 'hour' | 'minute', val: string) => {
    let newStartHour = startHour;
    let newStartMinute = startMinute;
    let newEndHour = endHour;
    let newEndMinute = endMinute;

    if (type === 'start') {
      if (part === 'hour') {
        newStartHour = val;
        setStartHour(val);
        // 時間を選択したら自動的に00分を設定
        if (!startMinute && val) {
          newStartMinute = '00';
          setStartMinute('00');
        }
      } else {
        newStartMinute = val;
        setStartMinute(val);
      }
    } else {
      if (part === 'hour') {
        newEndHour = val;
        setEndHour(val);
        // 時間を選択したら自動的に00分を設定
        if (!endMinute && val) {
          newEndMinute = '00';
          setEndMinute('00');
        }
      } else {
        newEndMinute = val;
        setEndMinute(val);
      }
    }

    // 親コンポーネントに通知
    const newStart = formatTime(newStartHour, newStartMinute);
    const newEnd = formatTime(newEndHour, newEndMinute);

    onChange({
      ...value,
      start: newStart,
      end: newEnd,
      sleepQuality: sleepQuality
    });
  };

  const handleSleepQualityChange = (quality: string) => {
    setSleepQuality(quality);
    onChange({
      ...value,
      sleepQuality: quality
    });
  };

  return (
    <div className="space-y-6">
      {/* 時刻入力 - 横並び */}
      <div className="grid grid-cols-2 gap-6">
        {/* 入眠時刻 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">入眠時刻</label>
          <div className="flex items-center gap-2">
            <select
              value={startHour}
              onChange={(e) => handleChange('start', 'hour', e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="">時</option>
              {hours.map(h => (
                <option key={h} value={h}>{h}時</option>
              ))}
            </select>
            <select
              value={startMinute}
              onChange={(e) => handleChange('start', 'minute', e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="">分</option>
              {minutes.map(m => (
                <option key={m} value={m}>{m}分</option>
              ))}
            </select>
          </div>
        </div>

        {/* 起床時刻 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">起床時刻</label>
          <div className="flex items-center gap-2">
            <select
              value={endHour}
              onChange={(e) => handleChange('end', 'hour', e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="">時</option>
              {hours.map(h => (
                <option key={h} value={h}>{h}時</option>
              ))}
            </select>
            <select
              value={endMinute}
              onChange={(e) => handleChange('end', 'minute', e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-md bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="">分</option>
              {minutes.map(m => (
                <option key={m} value={m}>{m}分</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 睡眠の質 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">睡眠の質</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'Deep', label: 'ぐっすり', color: 'bg-green-100 border-green-300 text-green-800' },
            { value: 'Normal', label: '普通', color: 'bg-blue-100 border-blue-300 text-blue-800' },
            { value: 'Light', label: '浅い', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
            { value: 'Restless', label: '寝ない', color: 'bg-red-100 border-red-300 text-red-800' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSleepQualityChange(option.value)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                sleepQuality === option.value
                  ? option.color
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SleepForm;
