import { useState, useEffect } from 'react';
import type {
  InfantTemperatureDto,
  CreateInfantTemperatureDto,
  UpdateInfantTemperatureDto,
  ChildInfo,
  MeasurementType,
  MeasurementLocation,
} from '../../types/infantRecord';
import {
  measurementTypeLabels,
  measurementLocationLabels,
} from '../../types/infantRecord';

/**
 * 乳児体温記録 作成・編集モーダル
 */

interface InfantTemperatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInfantTemperatureDto | UpdateInfantTemperatureDto) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: InfantTemperatureDto | null;
  children: ChildInfo[];
  recordDate: string;
}

interface FormData {
  childId: number;
  measurementType: MeasurementType;
  measuredTime: string;
  temperature: number;
  measurementLocation: MeasurementLocation;
  notes: string;
  isAbnormal: boolean;
}

interface FormErrors {
  childId?: string;
  measurementType?: string;
  measuredTime?: string;
  temperature?: string;
  measurementLocation?: string;
}

export function InfantTemperatureModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData,
  children,
  recordDate,
}: InfantTemperatureModalProps) {
  const [formData, setFormData] = useState<FormData>({
    childId: 0,
    measurementType: 'Morning',
    measuredTime: '',
    temperature: 36.5,
    measurementLocation: 'Armpit',
    notes: '',
    isAbnormal: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        childId: initialData.childId,
        measurementType: initialData.measurementType,
        measuredTime: initialData.measuredTime,
        temperature: initialData.temperature,
        measurementLocation: initialData.measurementLocation,
        notes: initialData.notes || '',
        isAbnormal: initialData.isAbnormal,
      });
    } else if (mode === 'create') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        childId: children.length > 0 ? children[0].childId : 0,
        measurementType: 'Morning',
        measuredTime: currentTime,
        temperature: 36.5,
        measurementLocation: 'Armpit',
        notes: '',
        isAbnormal: false,
      });
    }
  }, [mode, initialData, children]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.childId || formData.childId === 0) {
      newErrors.childId = '園児を選択してください';
    }

    if (!formData.measurementType) {
      newErrors.measurementType = '測定種別を選択してください';
    }

    if (!formData.measuredTime) {
      newErrors.measuredTime = '測定時刻を入力してください';
    }

    if (formData.temperature < 30.0 || formData.temperature > 45.0) {
      newErrors.temperature = '体温は30.0〜45.0℃の範囲で入力してください';
    }

    if (!formData.measurementLocation) {
      newErrors.measurementLocation = '測定箇所を選択してください';
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
      const [hours, minutes] = formData.measuredTime.split(':');
      const measuredAt = new Date(recordDate);
      measuredAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (mode === 'create') {
        const createData: CreateInfantTemperatureDto = {
          childId: formData.childId,
          recordDate: new Date(recordDate),
          measurementType: formData.measurementType,
          measuredAt,
          temperature: formData.temperature,
          measurementLocation: formData.measurementLocation,
          notes: formData.notes || undefined,
          isAbnormal: formData.isAbnormal,
        };
        console.log('=== Sending temperature record (create) ===');
        console.log('createData:', JSON.stringify(createData, null, 2));
        await onSave(createData);
      } else {
        const updateData: UpdateInfantTemperatureDto = {
          childId: formData.childId,
          recordDate: new Date(recordDate),
          measurementType: initialData!.measurementType, // 識別用（変更不可）
          measuredAt,
          temperature: formData.temperature,
          measurementLocation: formData.measurementLocation,
          notes: formData.notes || undefined,
          isAbnormal: formData.isAbnormal,
        };
        console.log('=== Sending temperature record (update) ===');
        console.log('updateData:', JSON.stringify(updateData, null, 2));
        await onSave(updateData);
      }
      onClose();
    } catch (error) {
      console.error('体温記録の保存に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const measurementTypes: MeasurementType[] = ['Morning', 'Afternoon'];
  const measurementLocations: MeasurementLocation[] = ['Armpit', 'Ear', 'Forehead'];

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
              {mode === 'create' ? '体温記録追加' : '体温記録編集'}
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
            <div className="space-y-4">
              {/* 園児選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  園児 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.childId}
                  onChange={(e) => handleInputChange('childId', parseInt(e.target.value))}
                  disabled={mode === 'edit'}
                  className={`w-full px-3 py-2 border ${
                    errors.childId ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value={0}>園児を選択してください</option>
                  {children.map((child) => (
                    <option key={child.childId} value={child.childId}>
                      {child.childName} ({Math.floor(child.ageMonths / 12)}歳{child.ageMonths % 12}ヶ月)
                    </option>
                  ))}
                </select>
                {errors.childId && <p className="mt-1 text-sm text-red-500">{errors.childId}</p>}
              </div>

              {/* 測定種別 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  測定種別 <span className="text-red-500">*</span>
                  {mode === 'edit' && <span className="ml-2 text-xs text-gray-500">(編集時は変更不可)</span>}
                </label>
                <select
                  value={formData.measurementType}
                  onChange={(e) => handleInputChange('measurementType', e.target.value as MeasurementType)}
                  disabled={mode === 'edit'}
                  className={`w-full px-3 py-2 border ${
                    errors.measurementType ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  {measurementTypes.map((type) => (
                    <option key={type} value={type}>
                      {measurementTypeLabels[type]}
                    </option>
                  ))}
                </select>
                {errors.measurementType && <p className="mt-1 text-sm text-red-500">{errors.measurementType}</p>}
              </div>

              {/* 測定時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  測定時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.measuredTime}
                  onChange={(e) => handleInputChange('measuredTime', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.measuredTime ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.measuredTime && <p className="mt-1 text-sm text-red-500">{errors.measuredTime}</p>}
              </div>

              {/* 体温 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  体温（℃） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={30.0}
                  max={45.0}
                  step={0.1}
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border ${
                    errors.temperature ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="36.5"
                />
                {errors.temperature && <p className="mt-1 text-sm text-red-500">{errors.temperature}</p>}
                <p className="mt-1 text-xs text-gray-500">30.0〜45.0℃の範囲で入力してください</p>
              </div>

              {/* 測定箇所 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  測定箇所 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.measurementLocation}
                  onChange={(e) => handleInputChange('measurementLocation', e.target.value as MeasurementLocation)}
                  className={`w-full px-3 py-2 border ${
                    errors.measurementLocation ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {measurementLocations.map((location) => (
                    <option key={location} value={location}>
                      {measurementLocationLabels[location]}
                    </option>
                  ))}
                </select>
                {errors.measurementLocation && <p className="mt-1 text-sm text-red-500">{errors.measurementLocation}</p>}
              </div>

              {/* 異常体温フラグ */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAbnormal}
                    onChange={(e) => handleInputChange('isAbnormal', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">異常体温として記録</span>
                </label>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="体調の様子など"
                />
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 mt-6 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
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
