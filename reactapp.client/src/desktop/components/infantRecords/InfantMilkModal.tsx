import { useState, useEffect } from 'react';
import type {
  InfantMilkDto,
  CreateInfantMilkDto,
  UpdateInfantMilkDto,
  ChildInfo,
} from '../../types/infantRecord';

/**
 * 乳児ミルク記録 作成・編集モーダル
 */

interface InfantMilkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInfantMilkDto | UpdateInfantMilkDto) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: InfantMilkDto | null;
  children: ChildInfo[];
  recordDate: string;
}

interface FormData {
  childId: number;
  milkTime: string;
  amountMl: number;
  notes: string;
}

interface FormErrors {
  childId?: string;
  milkTime?: string;
  amountMl?: string;
}

export function InfantMilkModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData,
  children,
  recordDate,
}: InfantMilkModalProps) {
  const [formData, setFormData] = useState<FormData>({
    childId: 0,
    milkTime: '',
    amountMl: 100,
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        childId: initialData.childId,
        milkTime: initialData.milkTime,
        amountMl: initialData.amountMl,
        notes: initialData.notes || '',
      });
    } else if (mode === 'create') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        childId: children.length > 0 ? children[0].childId : 0,
        milkTime: currentTime,
        amountMl: 100,
        notes: '',
      });
    }
  }, [mode, initialData, children]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
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

    if (!formData.milkTime) {
      newErrors.milkTime = 'ミルク時刻を入力してください';
    }

    if (formData.amountMl < 10 || formData.amountMl > 300) {
      newErrors.amountMl = 'ミルク量は10〜300mLの範囲で入力してください';
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
      if (mode === 'create') {
        const createData: CreateInfantMilkDto = {
          childId: formData.childId,
          recordDate,
          milkTime: formData.milkTime,
          amountMl: formData.amountMl,
          notes: formData.notes || undefined,
        };
        console.log('=== Sending milk record (create) ===');
        console.log('createData:', JSON.stringify(createData, null, 2));
        await onSave(createData);
      } else {
        const updateData: UpdateInfantMilkDto = {
          childId: formData.childId,
          recordDate,
          milkTime: initialData!.milkTime, // 変更前の時刻（識別用）
          newMilkTime: formData.milkTime !== initialData!.milkTime ? formData.milkTime : undefined,
          amountMl: formData.amountMl,
          notes: formData.notes || undefined,
        };
        console.log('=== Sending milk record (update) ===');
        console.log('updateData:', JSON.stringify(updateData, null, 2));
        await onSave(updateData);
      }
      onClose();
    } catch (error) {
      console.error('ミルク記録の保存に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {mode === 'create' ? 'ミルク記録追加' : 'ミルク記録編集'}
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

              {/* ミルク時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ミルク時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.milkTime}
                  onChange={(e) => handleInputChange('milkTime', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.milkTime ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.milkTime && <p className="mt-1 text-sm text-red-500">{errors.milkTime}</p>}
              </div>

              {/* ミルク量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ミルク量（mL） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  step={10}
                  value={formData.amountMl}
                  onChange={(e) => handleInputChange('amountMl', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border ${
                    errors.amountMl ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="100"
                />
                {errors.amountMl && <p className="mt-1 text-sm text-red-500">{errors.amountMl}</p>}
                <p className="mt-1 text-xs text-gray-500">10〜300mLの範囲で入力してください</p>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="よく飲んだ、途中で眠った など"
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
