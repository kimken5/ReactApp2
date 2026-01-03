import React, { useState, useEffect } from 'react';
import type { EditingCell } from '../../../types/infantRecords';
import TemperatureForm from './TemperatureForm';
import MealForm from './MealForm';
import MoodForm from './MoodForm';
import SleepForm from './SleepForm';
import ToiletingForm from './ToiletingForm';

interface EditModalProps {
  isOpen: boolean;
  editingCell: EditingCell | null;
  onSave: (value: any) => Promise<void>;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  editingCell,
  onSave,
  onClose
}) => {
  const [value, setValue] = useState<any>(editingCell?.currentValue || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // editingCellが変更されたらvalueを更新
  useEffect(() => {
    if (editingCell?.currentValue) {
      setValue(editingCell.currentValue);
    }
  }, [editingCell]);

  if (!isOpen || !editingCell) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(value);
      onClose();
    } catch (err: any) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const renderForm = () => {
    switch (editingCell.recordType) {
      case 'temperature':
        return (
          <TemperatureForm
            value={value}
            onChange={setValue}
            measurementType={editingCell.measurementType}
          />
        );
      case 'meal':
        return (
          <MealForm
            value={value}
            onChange={setValue}
            mealType={editingCell.mealType}
          />
        );
      case 'mood':
        return (
          <MoodForm
            value={value}
            onChange={setValue}
            moodTime={editingCell.moodTime}
          />
        );
      case 'sleep':
        return (
          <SleepForm
            value={value}
            onChange={setValue}
          />
        );
      case 'toileting':
        return (
          <ToiletingForm
            value={value}
            onChange={setValue}
            subType={editingCell.toiletingSubType}
          />
        );
      default:
        return <div>不明な記録タイプです</div>;
    }
  };

  const getModalTitle = (): string => {
    const typeLabels: Record<string, string> = {
      temperature: '体温',
      meal: '食事',
      mood: '機嫌',
      sleep: '昼寝',
      toileting: '排泄'
    };

    return `${typeLabels[editingCell.recordType] || '記録'}の編集`;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{getModalTitle()}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {editingCell.childName} - {formatDate(editingCell.date)}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* フォーム */}
            {renderForm()}
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditModal;
