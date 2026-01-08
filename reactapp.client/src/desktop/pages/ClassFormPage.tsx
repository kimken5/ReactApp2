import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ClassDto, CreateClassRequestDto, UpdateClassRequestDto } from '../types/master';

/**
 * クラス作成/編集ページ
 * 新規作成モードと編集モードの両方に対応
 */
export function ClassFormPage() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId?: string }>();
  const isEditMode = !!classId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingClass, setExistingClass] = useState<ClassDto | null>(null);

  // フォーム入力値の状態（作成用）
  const [createFormData, setCreateFormData] = useState<CreateClassRequestDto>({
    classId: '',
    name: '',
    ageGroupMin: 0,
    ageGroupMax: 5,
    maxCapacity: 20,
  });

  // フォーム入力値の状態（更新用）
  const [updateFormData, setUpdateFormData] = useState<UpdateClassRequestDto>({
    name: '',
    ageGroupMin: 0,
    ageGroupMax: 5,
    maxCapacity: 20,
    isActive: true,
  });

  // 編集モードの場合、既存データを読み込む
  useEffect(() => {
    if (isEditMode && classId) {
      loadClassData(classId);
    }
  }, [isEditMode, classId]);

  const loadClassData = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await masterService.getClass(id);
      setExistingClass(data);
      setUpdateFormData({
        name: data.name,
        ageGroupMin: data.ageGroupMin,
        ageGroupMax: data.ageGroupMax,
        maxCapacity: data.maxCapacity,
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('クラス情報の取得に失敗しました:', error);
      setErrors({ general: 'クラス情報の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 作成フォーム入力値変更ハンドラ
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'ageGroupMin' || name === 'ageGroupMax' || name === 'maxCapacity') {
      const numValue = parseInt(value, 10) || 0;
      setCreateFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 更新フォーム入力値変更ハンドラ
  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const type = 'type' in e.target ? e.target.type : undefined;
    const checked = 'checked' in e.target ? e.target.checked : undefined;

    if (type === 'checkbox' && checked !== undefined) {
      setUpdateFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'ageGroupMin' || name === 'ageGroupMax' || name === 'maxCapacity') {
      const numValue = parseInt(value, 10) || 0;
      setUpdateFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setUpdateFormData(prev => ({ ...prev, [name]: value }));
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // バリデーション（作成）
  const validateCreate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createFormData.classId.trim()) {
      newErrors.classId = 'クラスIDは必須です';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(createFormData.classId)) {
      newErrors.classId = 'クラスIDは英数字、ハイフン、アンダースコアのみ使用できます';
    }

    if (!createFormData.name.trim()) {
      newErrors.name = 'クラス名は必須です';
    }

    if (createFormData.ageGroupMin < 0 || createFormData.ageGroupMin > 10) {
      newErrors.ageGroupMin = '最小年齢は0～10の範囲で指定してください';
    }

    if (createFormData.ageGroupMax < 0 || createFormData.ageGroupMax > 10) {
      newErrors.ageGroupMax = '最大年齢は0～10の範囲で指定してください';
    }

    if (createFormData.ageGroupMin > createFormData.ageGroupMax) {
      newErrors.ageGroupMax = '最大年齢は最小年齢以上にしてください';
    }

    if (createFormData.maxCapacity < 1 || createFormData.maxCapacity > 100) {
      newErrors.maxCapacity = '定員は1～100の範囲で指定してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // バリデーション（更新）
  const validateUpdate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!updateFormData.name.trim()) {
      newErrors.name = 'クラス名は必須です';
    }

    if (updateFormData.ageGroupMin < 0 || updateFormData.ageGroupMin > 10) {
      newErrors.ageGroupMin = '最小年齢は0～10の範囲で指定してください';
    }

    if (updateFormData.ageGroupMax < 0 || updateFormData.ageGroupMax > 10) {
      newErrors.ageGroupMax = '最大年齢は0～10の範囲で指定してください';
    }

    if (updateFormData.ageGroupMin > updateFormData.ageGroupMax) {
      newErrors.ageGroupMax = '最大年齢は最小年齢以上にしてください';
    }

    if (updateFormData.maxCapacity < 1 || updateFormData.maxCapacity > 100) {
      newErrors.maxCapacity = '定員は1～100の範囲で指定してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    const isValid = isEditMode ? validateUpdate() : validateCreate();
    if (!isValid) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      if (isEditMode && classId) {
        // 更新
        await masterService.updateClass(classId, updateFormData);
      } else {
        // 作成
        await masterService.createClass(createFormData);
      }

      navigate('/desktop/classes');
    } catch (error: any) {
      console.error('クラスの保存に失敗しました:', error);

      // エラーメッセージを詳細に表示
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            apiErrors[key.toLowerCase()] = messages[0];
          }
        });
        setErrors(apiErrors);
      } else {
        setErrors({ general: 'クラスの保存に失敗しました' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formData = isEditMode ? updateFormData : createFormData;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'クラス編集' : 'クラス新規作成'}
          </h1>
        </div>

        {/* 全体エラーメッセージ */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errors.general}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md overflow-hidden">
          <div className="p-6 space-y-6">
            {/* クラスID（作成時のみ） */}
            {!isEditMode && (
              <div>
                <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                  クラスID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="classId"
                  name="classId"
                  value={createFormData.classId}
                  onChange={handleCreateChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                    errors.classId ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="例: sakura-1"
                />
                <p className="mt-1 text-xs text-gray-500">英数字、ハイフン、アンダースコアのみ使用可能</p>
                {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId}</p>}
              </div>
            )}

            {/* クラスID表示（編集時） */}
            {isEditMode && existingClass && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">クラスID</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                  {existingClass.classId}
                </div>
                <p className="mt-1 text-xs text-gray-500">クラスIDは変更できません</p>
              </div>
            )}

            {/* クラス名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                クラス名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="例: さくら組"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* 対象年齢 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ageGroupMin" className="block text-sm font-medium text-gray-700 mb-2">
                  最小年齢 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  id="ageGroupMin"
                  name="ageGroupMin"
                  value={formData.ageGroupMin}
                  onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                  min="0"
                  max="10"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                    errors.ageGroupMin ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.ageGroupMin && <p className="mt-1 text-sm text-red-600">{errors.ageGroupMin}</p>}
              </div>

              <div>
                <label htmlFor="ageGroupMax" className="block text-sm font-medium text-gray-700 mb-2">
                  最大年齢 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  id="ageGroupMax"
                  name="ageGroupMax"
                  value={formData.ageGroupMax}
                  onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                  min="0"
                  max="10"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                    errors.ageGroupMax ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.ageGroupMax && <p className="mt-1 text-sm text-red-600">{errors.ageGroupMax}</p>}
              </div>
            </div>

            {/* 定員 */}
            <div>
              <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                定員 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="maxCapacity"
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                min="1"
                max="100"
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                  errors.maxCapacity ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.maxCapacity && <p className="mt-1 text-sm text-red-600">{errors.maxCapacity}</p>}
            </div>

            {/* 有効/無効（編集時のみ） */}
            {isEditMode && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={updateFormData.isActive}
                  onChange={handleUpdateChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  有効なクラス
                </label>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/desktop/classes')}
              className="px-6 py-2 border border-gray-200 rounded-md text-gray-700 font-medium hover:shadow-md transition-all duration-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isSaving ? (
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
    </DashboardLayout>
  );
}
