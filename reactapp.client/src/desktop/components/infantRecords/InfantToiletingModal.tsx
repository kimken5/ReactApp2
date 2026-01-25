import { useState, useEffect } from 'react';
import type {
  InfantToiletingDto,
  CreateInfantToiletingDto,
  UpdateInfantToiletingDto,
  ChildInfo,
  BowelCondition,
} from '../../types/infantRecord';
import { bowelConditionLabels } from '../../types/infantRecord';

/**
 * 乳児排泄記録 作成・編集モーダル
 */

interface InfantToiletingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInfantToiletingDto | UpdateInfantToiletingDto) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: InfantToiletingDto | null;
  children: ChildInfo[];
  recordDate: string;
}

interface FormData {
  childId: number;
  urineCount: number;
  bowelCount: number;
  bowelCondition: BowelCondition | '';
  notes: string;
}

interface FormErrors {
  childId?: string;
  urineCount?: string;
  bowelCount?: string;
}

export function InfantToiletingModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData,
  children,
  recordDate,
}: InfantToiletingModalProps) {
  const [formData, setFormData] = useState<FormData>({
    childId: 0,
    urineCount: 0,
    bowelCount: 0,
    bowelCondition: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        childId: initialData.childId,
        urineCount: initialData.urineCount,
        bowelCount: initialData.bowelCount,
        bowelCondition: initialData.bowelCondition || '',
        notes: initialData.notes || '',
      });
    } else if (mode === 'create') {
      setFormData({
        childId: children.length > 0 ? children[0].childId : 0,
        urineCount: 0,
        bowelCount: 0,
        bowelCondition: '',
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

    if (formData.urineCount < 0) {
      newErrors.urineCount = 'おしっこ回数は0以上で入力してください';
    }

    if (formData.bowelCount < 0) {
      newErrors.bowelCount = 'うんち回数は0以上で入力してください';
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
      const saveData = {
        childId: formData.childId,
        recordDate,
        urineCount: formData.urineCount,
        bowelCount: formData.bowelCount,
        bowelCondition: formData.bowelCondition || undefined,
        notes: formData.notes || undefined,
      };

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error('排泄記録の保存に失敗しました:', error);
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
              {mode === 'create' ? '排泄記録追加' : '排泄記録編集'}
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

              {/* おしっこ・うんち回数 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    おしっこ回数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.urineCount}
                    onChange={(e) => handleInputChange('urineCount', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border ${
                      errors.urineCount ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="0"
                  />
                  {errors.urineCount && <p className="mt-1 text-sm text-red-500">{errors.urineCount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    うんち回数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.bowelCount}
                    onChange={(e) => handleInputChange('bowelCount', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border ${
                      errors.bowelCount ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="0"
                  />
                  {errors.bowelCount && <p className="mt-1 text-sm text-red-500">{errors.bowelCount}</p>}
                </div>
              </div>

              {/* 便の状態 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">便の状態</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(bowelConditionLabels) as BowelCondition[]).map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => handleInputChange('bowelCondition', condition)}
                      className={`px-3 py-2 rounded-lg text-sm border font-medium transition ${
                        formData.bowelCondition === condition
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {bowelConditionLabels[condition]}
                    </button>
                  ))}
                </div>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="色、量、その他気になる点など"
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
