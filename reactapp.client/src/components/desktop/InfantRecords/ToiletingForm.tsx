import React, { useState, useEffect } from 'react';
import type { ToiletingRecord, ToiletingSubType } from '../../../types/infantRecords';

interface ToiletingFormProps {
  value: ToiletingRecord;
  onChange: (value: ToiletingRecord) => void;
  subType?: ToiletingSubType;
}

const ToiletingForm: React.FC<ToiletingFormProps> = ({
  value,
  onChange,
  subType
}) => {
  const [urineAmount, setUrineAmount] = useState<string>(value?.urineAmount || '');
  const [bowelCondition, setBowelCondition] = useState<string>(value?.bowelCondition || '');
  const [bowelColor, setBowelColor] = useState<string>(value?.bowelColor || '');
  const [diaperCount, setDiaperCount] = useState<number>(value?.diaperChangeCount || 0);

  useEffect(() => {
    console.log('🔍 ToiletingForm value changed:', value);
    setUrineAmount(value?.urineAmount || '');
    setBowelCondition(value?.bowelCondition || '');
    setBowelColor(value?.bowelColor || '');
    setDiaperCount(value?.diaperChangeCount || 0);
  }, [value]);

  const handleUrineChange = (newAmount: string) => {
    setUrineAmount(newAmount);
    onChange({
      ...value,
      urineAmount: newAmount
    });
  };

  const handleBowelConditionChange = (newCondition: string) => {
    setBowelCondition(newCondition);
    onChange({
      ...value,
      bowelCondition: newCondition,
      bowelColor: bowelColor
    });
  };

  const handleBowelColorChange = (newColor: string) => {
    setBowelColor(newColor);
    onChange({
      ...value,
      bowelCondition: bowelCondition,
      bowelColor: newColor
    });
  };

  const handleDiaperCountChange = (newCount: number) => {
    setDiaperCount(newCount);
    onChange({
      ...value,
      diaperChangeCount: newCount
    });
  };

  const renderUrineForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">おしっこの量</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleUrineChange('Little')}
            className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
              urineAmount === 'Little'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            少量
          </button>
          <button
            type="button"
            onClick={() => handleUrineChange('Normal')}
            className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
              urineAmount === 'Normal'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            普通
          </button>
          <button
            type="button"
            onClick={() => handleUrineChange('Lot')}
            className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
              urineAmount === 'Lot'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            多量
          </button>
        </div>
      </div>
    </div>
  );

  const renderBowelForm = () => (
    <div className="space-y-6">
      {/* 便の状態 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">便の状態</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'Normal', label: '普通' },
            { value: 'Soft', label: '軟便' },
            { value: 'Diarrhea', label: '下痢' },
            { value: 'Hard', label: '硬め' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleBowelConditionChange(option.value)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                bowelCondition === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 便の色 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">便の色</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'Normal', label: '普通', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
            { value: 'Green', label: '緑色', color: 'bg-green-100 border-green-300 text-green-800' },
            { value: 'White', label: '白色', color: 'bg-gray-100 border-gray-300 text-gray-800' },
            { value: 'Black', label: '黒色', color: 'bg-gray-800 border-gray-900 text-white' },
            { value: 'Bloody', label: '血便', color: 'bg-red-100 border-red-300 text-red-800' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleBowelColorChange(option.value)}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                bowelColor === option.value
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

  const renderDiaperForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">おむつ交換回数</label>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map(count => (
            <button
              key={count}
              type="button"
              onClick={() => handleDiaperCountChange(count)}
              className={`px-3 py-3 rounded-lg border-2 font-medium transition ${
                diaperCount === count
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">回数を選択してください</p>
      </div>
    </div>
  );

  if (subType === 'urine') {
    return renderUrineForm();
  }

  if (subType === 'bowel') {
    return renderBowelForm();
  }

  if (subType === 'diaper') {
    return renderDiaperForm();
  }

  // subTypeが指定されていない場合は全て表示
  return (
    <div className="space-y-8">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-4">おしっこ</h3>
        {renderUrineForm()}
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-4">うんち</h3>
        {renderBowelForm()}
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-900 mb-4">おむつ交換</h3>
        {renderDiaperForm()}
      </div>
    </div>
  );
};

export default ToiletingForm;
