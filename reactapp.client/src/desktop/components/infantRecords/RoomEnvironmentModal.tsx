import { useState, useEffect } from 'react';
import type {
  RoomEnvironmentDto,
  CreateRoomEnvironmentDto,
  UpdateRoomEnvironmentDto,
} from '../../types/infantRecord';
import { MdThermostat, MdWbSunny } from 'react-icons/md';

/**
 * 室温・湿度記録 作成・編集モーダル
 * クラス全体の環境記録（園児別ではない）
 */

interface RoomEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoomEnvironmentDto | UpdateRoomEnvironmentDto) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: RoomEnvironmentDto | null;
  classId: string;
  className: string;
  recordDate: string;
}

interface FormData {
  recordTime: string;
  temperature: number;
  humidity: number;
  notes: string;
}

interface FormErrors {
  recordTime?: string;
  temperature?: string;
  humidity?: string;
}

export function RoomEnvironmentModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData,
  classId,
  className,
  recordDate,
}: RoomEnvironmentModalProps) {
  const [formData, setFormData] = useState<FormData>({
    recordTime: '',
    temperature: 24.0,
    humidity: 55.0,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // ISO datetime から時刻部分を抽出 (YYYY-MM-DDTHH:mm:ss -> HH:mm)
      const recordedAt = new Date(initialData.recordedAt);
      const timeString = `${String(recordedAt.getHours()).padStart(2, '0')}:${String(recordedAt.getMinutes()).padStart(2, '0')}`;

      setFormData({
        recordTime: timeString,
        temperature: initialData.temperature,
        humidity: initialData.humidity,
        notes: initialData.notes || '',
      });
    } else if (mode === 'create') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        recordTime: currentTime,
        temperature: 24.0,
        humidity: 55.0,
        notes: '',
      });
    }
  }, [mode, initialData]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.recordTime) {
      newErrors.recordTime = '記録時刻を入力してください';
    }

    if (formData.temperature < 10 || formData.temperature > 35) {
      newErrors.temperature = '室温は10〜35℃の範囲で入力してください';
    }

    if (formData.humidity < 0 || formData.humidity > 100) {
      newErrors.humidity = '湿度は0〜100%の範囲で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // recordDate (YYYY-MM-DD) + recordTime (HH:mm) を ISO 8601 datetime に変換
      const recordedAtStr = `${recordDate}T${formData.recordTime}:00`;

      const saveData: CreateRoomEnvironmentDto | UpdateRoomEnvironmentDto = {
        classId,
        recordDate,
        recordedAt: recordedAtStr,
        temperature: formData.temperature,
        humidity: formData.humidity,
        notes: formData.notes || undefined,
      };

      console.log('=== Sending room environment data ===');
      console.log('saveData:', JSON.stringify(saveData, null, 2));

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error('室温・湿度記録の保存に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 温湿度の適正範囲チェック
  const isTemperatureNormal = formData.temperature >= 20 && formData.temperature <= 26;
  const isHumidityNormal = formData.humidity >= 40 && formData.humidity <= 60;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[60] transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'create' ? '室温・湿度記録追加' : '室温・湿度記録編集'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* クラス情報表示 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">対象クラス:</span> {className}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">記録日:</span>{' '}
                {new Date(recordDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </p>
            </div>

            <div className="space-y-4">
              {/* 記録時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  記録時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.recordTime}
                  onChange={(e) => handleInputChange('recordTime', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.recordTime ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.recordTime && <p className="mt-1 text-sm text-red-500">{errors.recordTime}</p>}
                <p className="mt-1 text-xs text-gray-500">午睡開始時など記録した時刻を入力</p>
              </div>

              {/* 室温 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MdThermostat className="inline text-red-500 mr-1" size={18} />
                  室温（℃） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={10}
                  max={35}
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${
                    errors.temperature ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="24.0"
                />
                {errors.temperature && <p className="mt-1 text-sm text-red-500">{errors.temperature}</p>}
                {!errors.temperature && (
                  <p className={`mt-1 text-xs ${isTemperatureNormal ? 'text-green-600' : 'text-orange-600'}`}>
                    {isTemperatureNormal ? '✓ 適正範囲（20〜26℃）' : '⚠ 推奨範囲外（20〜26℃が適正）'}
                  </p>
                )}
              </div>

              {/* 湿度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MdWbSunny className="inline text-blue-500 mr-1" size={18} />
                  湿度（%） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border ${
                    errors.humidity ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="55"
                />
                {errors.humidity && <p className="mt-1 text-sm text-red-500">{errors.humidity}</p>}
                {!errors.humidity && (
                  <p className={`mt-1 text-xs ${isHumidityNormal ? 'text-green-600' : 'text-orange-600'}`}>
                    {isHumidityNormal ? '✓ 適正範囲（40〜60%）' : '⚠ 推奨範囲外（40〜60%が適正）'}
                  </p>
                )}
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="暖房ON、換気実施、加湿器稼働 など"
                />
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 mt-6 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-md text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition-all duration-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md font-medium transition-all duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  '保存する'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
