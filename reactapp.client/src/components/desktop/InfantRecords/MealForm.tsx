import React, { useState, useEffect } from 'react';
import type { MealRecord } from '../../../types/infantRecords';

interface MealFormProps {
  value: MealRecord;
  onChange: (value: MealRecord) => void;
  mealType?: 'snack' | 'lunch';
}

const MealForm: React.FC<MealFormProps> = ({
  value,
  onChange,
  mealType
}) => {
  const [amount, setAmount] = useState<string>(value?.amount || '');

  useEffect(() => {
    setAmount(value?.amount || '');
  }, [value]);

  const options = [
    { value: 'All', label: '完食' },
    { value: 'Most', label: 'ほぼ完食' },
    { value: 'Half', label: '半分' },
    { value: 'Little', label: '少し' },
    { value: 'None', label: 'なし' }
  ];

  const handleChange = (newAmount: string) => {
    setAmount(newAmount);
    onChange({
      ...value,
      amount: newAmount
    });
  };

  const getMealLabel = (): string => {
    const labels = {
      snack: 'おやつ',
      lunch: '昼食'
    };
    return mealType ? labels[mealType] : '食事';
  };

  return (
    <div className="space-y-4">
      {mealType && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-gray-700">種類: </span>
          <strong className="text-blue-900">{getMealLabel()}</strong>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">摂取量</label>
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleChange(opt.value)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                amount === opt.value
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

export default MealForm;
