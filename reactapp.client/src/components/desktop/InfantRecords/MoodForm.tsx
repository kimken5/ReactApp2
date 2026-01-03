import React, { useState, useEffect } from 'react';
import type { MoodRecord } from '../../../types/infantRecords';

interface MoodFormProps {
  value: MoodRecord;
  onChange: (value: MoodRecord) => void;
  moodTime?: 'morning' | 'afternoon';
}

const MoodForm: React.FC<MoodFormProps> = ({
  value,
  onChange,
  moodTime
}) => {
  const [state, setState] = useState<string>(value?.state || '');

  useEffect(() => {
    setState(value?.state || '');
  }, [value]);

  const options = [
    { value: 'VeryGood', label: 'とても良い' },
    { value: 'Good', label: '良い' },
    { value: 'Normal', label: '普通' },
    { value: 'Bad', label: '悪い' },
    { value: 'Crying', label: '泣いている' }
  ];

  const handleChange = (newState: string) => {
    setState(newState);
    onChange({
      ...value,
      state: newState
    });
  };

  const getTimeLabel = (): string => {
    const labels = {
      morning: '午前',
      afternoon: '午後'
    };
    return moodTime ? labels[moodTime] : '';
  };

  return (
    <div className="space-y-4">
      {moodTime && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-gray-700">時間帯: </span>
          <strong className="text-blue-900">{getTimeLabel()}</strong>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">機嫌の状態</label>
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                state === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodForm;
