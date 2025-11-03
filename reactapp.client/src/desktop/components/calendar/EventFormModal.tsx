import { useState, useEffect } from 'react';
import type { CalendarEventDto, CreateEventRequestDto, UpdateEventRequestDto, EventCategoryType } from '../../types/calendar';
import type { ClassDto } from '../../types/master';
import { eventCategoriesDesktop } from '../../types/calendar';

/**
 * イベント作成・編集モーダル
 */

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventRequestDto | UpdateEventRequestDto) => Promise<void>;
  event?: CalendarEventDto | null;
  classes: ClassDto[];
  mode: 'create' | 'edit';
}

interface FormData {
  title: string;
  category: EventCategoryType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  description: string;
  location: string;
  targetClassId: string;
  targetGrade: string;
}

interface FormErrors {
  title?: string;
  category?: string;
  startDateTime?: string;
  endDateTime?: string;
  targetClassId?: string;
  targetGrade?: string;
}

export function EventFormModal({ isOpen, onClose, onSubmit, event, classes, mode }: EventFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: 'general_announcement',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    isAllDay: false,
    description: '',
    location: '',
    targetClassId: '',
    targetGrade: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合、イベントデータで初期化
  useEffect(() => {
    if (mode === 'edit' && event) {
      const startDateTime = new Date(event.startDateTime);
      const endDateTime = new Date(event.endDateTime);

      setFormData({
        title: event.title,
        category: event.category,
        startDate: event.startDateTime.split('T')[0],
        startTime: event.isAllDay ? '00:00' : event.startDateTime.split('T')[1].substring(0, 5),
        endDate: event.endDateTime.split('T')[0],
        endTime: event.isAllDay ? '23:59' : event.endDateTime.split('T')[1].substring(0, 5),
        isAllDay: event.isAllDay,
        description: event.description || '',
        location: event.location || '',
        targetClassId: event.targetClassId || '',
        targetGrade: event.targetGrade?.toString() || '',
      });
    } else if (mode === 'create') {
      // 作成モードの場合、今日の日付をデフォルトにする
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        category: 'general_announcement',
        startDate: today,
        startTime: '09:00',
        endDate: today,
        endTime: '10:00',
        isAllDay: false,
        description: '',
        location: '',
        targetClassId: '',
        targetGrade: '',
      });
    }
  }, [mode, event]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCategoryChange = (category: EventCategoryType) => {
    setFormData((prev) => ({
      ...prev,
      category,
      // カテゴリ変更時にターゲットをリセット
      targetClassId: '',
      targetGrade: '',
    }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleAllDayToggle = () => {
    const newIsAllDay = !formData.isAllDay;
    setFormData((prev) => ({
      ...prev,
      isAllDay: newIsAllDay,
      startTime: newIsAllDay ? '00:00' : '09:00',
      endTime: newIsAllDay ? '23:59' : '10:00',
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルを入力してください';
    }

    if (!formData.startDate) {
      newErrors.startDateTime = '開始日を選択してください';
    }

    if (!formData.endDate) {
      newErrors.endDateTime = '終了日を選択してください';
    }

    // 開始日時が終了日時より後の場合エラー
    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startDateTime >= endDateTime) {
        newErrors.endDateTime = '終了日時は開始日時より後に設定してください';
      }
    }

    // カテゴリに応じたターゲット検証
    if (formData.category === 'class_activity' && !formData.targetClassId) {
      newErrors.targetClassId = 'クラスを選択してください';
    }

    if (formData.category === 'grade_activity' && !formData.targetGrade) {
      newErrors.targetGrade = '学年を選択してください';
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
      const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
      const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

      const requestData: CreateEventRequestDto | UpdateEventRequestDto = {
        title: formData.title,
        category: formData.category,
        startDateTime,
        endDateTime,
        isAllDay: formData.isAllDay,
        description: formData.description || undefined,
        location: formData.location || undefined,
        targetClassId: formData.targetClassId || undefined,
        targetGrade: formData.targetGrade ? parseInt(formData.targetGrade) : undefined,
      };

      await onSubmit(requestData);
      onClose();
    } catch (error) {
      console.error('イベント保存エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // 学年の選択肢（0歳児～5歳児）
  const gradeOptions = [
    { value: '0', label: '0歳児' },
    { value: '1', label: '1歳児' },
    { value: '2', label: '2歳児' },
    { value: '3', label: '3歳児' },
    { value: '4', label: '4歳児' },
    { value: '5', label: '5歳児' },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'create' ? '新規イベント作成' : 'イベント編集'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="イベントタイトルを入力"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(eventCategoriesDesktop).map(([key, category]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCategoryChange(key as EventCategoryType)}
                      className={`px-3 py-2 rounded-lg text-sm border font-medium transition ${
                        formData.category === key ? 'ring-2 ring-orange-500' : ''
                      }`}
                      style={{
                        backgroundColor: formData.category === key ? category.color : category.bgColor,
                        color: formData.category === key ? 'white' : category.color,
                        borderColor: category.color,
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 全日イベント */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAllDay"
                  checked={formData.isAllDay}
                  onChange={handleAllDayToggle}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
                  終日イベント
                </label>
              </div>

              {/* 日時 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 開始日時 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日時 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      errors.startDateTime ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2`}
                  />
                  {!formData.isAllDay && (
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                  {errors.startDateTime && <p className="mt-1 text-sm text-red-500">{errors.startDateTime}</p>}
                </div>

                {/* 終了日時 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了日時 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      errors.endDateTime ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2`}
                  />
                  {!formData.isAllDay && (
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                  {errors.endDateTime && <p className="mt-1 text-sm text-red-500">{errors.endDateTime}</p>}
                </div>
              </div>

              {/* ターゲットクラス（クラス活動の場合のみ） */}
              {formData.category === 'class_activity' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    対象クラス <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.targetClassId}
                    onChange={(e) => handleInputChange('targetClassId', e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      errors.targetClassId ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  >
                    <option value="">クラスを選択してください</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className} ({cls.gradeLevel})
                      </option>
                    ))}
                  </select>
                  {errors.targetClassId && <p className="mt-1 text-sm text-red-500">{errors.targetClassId}</p>}
                </div>
              )}

              {/* ターゲット学年（学年活動の場合のみ） */}
              {formData.category === 'grade_activity' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    対象学年 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.targetGrade}
                    onChange={(e) => handleInputChange('targetGrade', e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      errors.targetGrade ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  >
                    <option value="">学年を選択してください</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                  {errors.targetGrade && <p className="mt-1 text-sm text-red-500">{errors.targetGrade}</p>}
                </div>
              )}

              {/* 場所 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">場所</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="場所を入力（任意）"
                />
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="イベントの詳細を入力（任意）"
                />
              </div>
            </div>

            {/* アクションボタン */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end space-x-3 -mx-6 -mb-6 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-200 rounded-md text-gray-700 font-medium hover:shadow-md transition-all duration-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
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
                ) : mode === 'create' ? (
                  '作成する'
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
