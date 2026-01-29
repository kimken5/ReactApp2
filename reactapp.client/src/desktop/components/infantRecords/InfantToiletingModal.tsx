import { useState, useEffect } from 'react';
import type {
  InfantToiletingDto,
  CreateInfantToiletingDto,
  UpdateInfantToiletingDto,
  ChildInfo,
} from '../../types/infantRecord';

/**
 * 乳児おむつ記録 作成・編集モーダル
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

type RecordType = 'urine' | 'stool' | 'both';
type Amount = 'Little' | 'Normal' | 'Lot';
type BowelCondition = 'Normal' | 'Soft' | 'Diarrhea' | 'Hard' | 'Bloody';

interface FormData {
  childId: number;
  toiletingTime: string; // HH:mm format
  recordType: RecordType;
  urineAmount: Amount;
  bowelAmount: Amount;
  bowelCondition: BowelCondition;
}

interface FormErrors {
  childId?: string;
  toiletingTime?: string;
}

const amountLabels: Record<Amount, string> = {
  Little: '少量',
  Normal: '普通',
  Lot: '多量',
};

const bowelConditionLabels: Record<BowelCondition, string> = {
  Normal: '正常',
  Soft: '軟便',
  Diarrhea: '下痢',
  Hard: '硬い',
  Bloody: '血便',
};

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
    toiletingTime: '',
    recordType: 'urine',
    urineAmount: 'Normal',
    bowelAmount: 'Normal',
    bowelCondition: 'Normal',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初期化
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Extract time from DateTime
      const time = new Date(initialData.toiletingTime).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Determine record type
      let recordType: RecordType = 'urine';
      if (initialData.hasUrine && initialData.hasStool) {
        recordType = 'both';
      } else if (initialData.hasStool) {
        recordType = 'stool';
      }

      setFormData({
        childId: initialData.childId,
        toiletingTime: time,
        recordType,
        urineAmount: (initialData.urineAmount as Amount) || 'Normal',
        bowelAmount: (initialData.bowelAmount as Amount) || 'Normal',
        bowelCondition: (initialData.bowelCondition as BowelCondition) || 'Normal',
      });
    } else if (mode === 'create') {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData({
        childId: children.length > 0 ? children[0].childId : 0,
        toiletingTime: currentTime,
        recordType: 'urine',
        urineAmount: 'Normal',
        bowelAmount: 'Normal',
        bowelCondition: 'Normal',
      });
    }
  }, [mode, initialData, children]);

  const handleInputChange = (field: keyof FormData, value: string | number | RecordType | Amount | BowelCondition) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 現在時刻設定
  const setCurrentTime = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    handleInputChange('toiletingTime', currentTime);
  };

  // 5分前設定
  const setFiveMinutesAgo = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    handleInputChange('toiletingTime', time);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.childId || formData.childId === 0) {
      newErrors.childId = '園児を選択してください';
    }

    if (!formData.toiletingTime) {
      newErrors.toiletingTime = '時刻を入力してください';
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
      // Create DateTime from recordDate and toiletingTime
      const [hours, minutes] = formData.toiletingTime.split(':').map(Number);
      const toiletingDateTime = new Date(recordDate);
      toiletingDateTime.setHours(hours, minutes, 0, 0);

      const saveData = {
        childId: formData.childId,
        recordDate: new Date(recordDate),
        toiletingTime: toiletingDateTime,
        hasUrine: formData.recordType === 'urine' || formData.recordType === 'both',
        urineAmount: formData.recordType === 'urine' || formData.recordType === 'both' ? formData.urineAmount : undefined,
        hasStool: formData.recordType === 'stool' || formData.recordType === 'both',
        bowelAmount: formData.recordType === 'stool' || formData.recordType === 'both' ? formData.bowelAmount : undefined,
        bowelCondition: formData.recordType === 'stool' || formData.recordType === 'both' ? formData.bowelCondition : undefined,
      };

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error('おむつ記録の保存に失敗しました:', error);
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
              {mode === 'create' ? 'おむつ記録追加' : 'おむつ記録編集'}
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
            <div className="space-y-5">
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

              {/* 時刻 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  時刻 <span className="text-red-500">*</span>
                  {mode === 'edit' && <span className="ml-2 text-xs text-gray-500">(編集時は変更不可)</span>}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={formData.toiletingTime}
                    onChange={(e) => handleInputChange('toiletingTime', e.target.value)}
                    disabled={mode === 'edit'}
                    className={`flex-1 px-3 py-2 border ${
                      errors.toiletingTime ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  {mode === 'create' && (
                    <>
                      <button
                        type="button"
                        onClick={setCurrentTime}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                      >
                        今
                      </button>
                      <button
                        type="button"
                        onClick={setFiveMinutesAgo}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                      >
                        5分前
                      </button>
                    </>
                  )}
                </div>
                {errors.toiletingTime && <p className="mt-1 text-sm text-red-500">{errors.toiletingTime}</p>}
              </div>

              {/* 記録タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  記録タイプ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('recordType', 'urine')}
                    className={`px-4 py-2.5 rounded-lg text-sm border font-medium transition ${
                      formData.recordType === 'urine'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    おしっこのみ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('recordType', 'stool')}
                    className={`px-4 py-2.5 rounded-lg text-sm border font-medium transition ${
                      formData.recordType === 'stool'
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    うんちのみ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('recordType', 'both')}
                    className={`px-4 py-2.5 rounded-lg text-sm border font-medium transition ${
                      formData.recordType === 'both'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    両方
                  </button>
                </div>
              </div>

              {/* おしっこ量 */}
              {(formData.recordType === 'urine' || formData.recordType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">おしっこ量</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(amountLabels) as Amount[]).map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleInputChange('urineAmount', amount)}
                        className={`px-3 py-2 rounded-lg text-sm border font-medium transition ${
                          formData.urineAmount === amount
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {amountLabels[amount]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* うんち量 */}
              {(formData.recordType === 'stool' || formData.recordType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">うんち量</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(amountLabels) as Amount[]).map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleInputChange('bowelAmount', amount)}
                        className={`px-3 py-2 rounded-lg text-sm border font-medium transition ${
                          formData.bowelAmount === amount
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {amountLabels[amount]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* うんち種類 */}
              {(formData.recordType === 'stool' || formData.recordType === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">うんち種類</label>
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
              )}
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
