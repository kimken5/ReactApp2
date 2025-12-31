import { useState, useEffect } from 'react';
import { masterService } from '../../services/masterService';
import { useDesktopAuth } from '../../contexts/DesktopAuthContext';
import type {
  ChildDto,
  UpdateChildRequestDto,
  ClassDto,
} from '../../types/master';

/**
 * 園児編集モーダル
 */

interface ChildEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  childId: number;
}

export function ChildEditModal({ isOpen, onClose, onSuccess, childId }: ChildEditModalProps) {
  const { state } = useDesktopAuth();
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true; // 写真機能の利用可否

  const [child, setChild] = useState<ChildDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォーム状態
  const [formData, setFormData] = useState({
    familyName: '',
    firstName: '',
    familyFurigana: '',
    firstFurigana: '',
    allergy: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    bloodType: '',
    medicalNotes: '',
    specialInstructions: '',
    graduationDate: '',
    graduationStatus: '',
    withdrawalReason: '',
    isActive: true,
    noPhoto: false, // 撮影禁止フラグ
  });

  // モーダルが開いたときにデータを読み込む
  useEffect(() => {
    if (isOpen && childId) {
      loadData();
    }
  }, [isOpen, childId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // クラス一覧と園児データを並列取得
      const [classesData, childData] = await Promise.all([
        masterService.getClasses({ isActive: true }),
        masterService.getChild(childId),
      ]);

      setClasses(classesData);
      setChild(childData);
      setFormData({
        familyName: childData.familyName,
        firstName: childData.firstName,
        familyFurigana: childData.familyFurigana || '',
        firstFurigana: childData.firstFurigana || '',
        allergy: childData.allergy || '',
        dateOfBirth: childData.dateOfBirth.split('T')[0],
        gender: childData.gender,
        classId: childData.classId || '',
        bloodType: childData.bloodType || '',
        medicalNotes: childData.medicalNotes || '',
        specialInstructions: childData.specialInstructions || '',
        graduationDate: childData.graduationDate?.split('T')[0] || '',
        graduationStatus: childData.graduationStatus || '',
        withdrawalReason: childData.withdrawalReason || '',
        isActive: childData.isActive,
        noPhoto: childData.noPhoto || false, // 撮影禁止フラグ
      });
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 入力値変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.familyName.trim()) {
      newErrors.familyName = '姓は必須です';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = '名は必須です';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = '生年月日は必須です';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = '生年月日は今日以前の日付を指定してください';
      }
    }

    if (!formData.gender) {
      newErrors.gender = '性別は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      const updateRequest: UpdateChildRequestDto = {
        familyName: formData.familyName,
        firstName: formData.firstName,
        familyFurigana: formData.familyFurigana || undefined,
        firstFurigana: formData.firstFurigana || undefined,
        allergy: formData.allergy || undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        classId: formData.classId || undefined,
        bloodType: formData.bloodType || undefined,
        medicalNotes: formData.medicalNotes || undefined,
        specialInstructions: formData.specialInstructions || undefined,
        graduationDate: formData.graduationDate || undefined,
        graduationStatus: formData.graduationStatus || undefined,
        withdrawalReason: formData.withdrawalReason || undefined,
        isActive: formData.isActive,
        noPhoto: formData.noPhoto, // 撮影禁止フラグ
      };

      await masterService.updateChild(childId, updateRequest);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('保存に失敗しました:', error);

      let errorMessage = '保存に失敗しました';
      if (error?.response?.data) {
        const responseData = error.response.data;
        if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.title) {
          errorMessage = responseData.title;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800">園児編集</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              </div>
            ) : (
              <>
                {/* エラーメッセージ */}
                {errors.general && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {errors.general}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 基本情報 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 姓 */}
                      <div>
                        <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                          姓 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="familyName"
                          name="familyName"
                          value={formData.familyName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${errors.familyName ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="例: 山田"
                        />
                        {errors.familyName && <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>}
                      </div>

                      {/* 名 */}
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          名 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${errors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="例: 太郎"
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                      </div>

                      {/* 姓（ふりがな） */}
                      <div>
                        <label htmlFor="familyFurigana" className="block text-sm font-medium text-gray-700 mb-2">
                          姓（ふりがな）
                        </label>
                        <input
                          type="text"
                          id="familyFurigana"
                          name="familyFurigana"
                          value={formData.familyFurigana}
                          onChange={handleChange}
                          maxLength={50}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="例: やまだ"
                        />
                      </div>

                      {/* 名（ふりがな） */}
                      <div>
                        <label htmlFor="firstFurigana" className="block text-sm font-medium text-gray-700 mb-2">
                          名（ふりがな）
                        </label>
                        <input
                          type="text"
                          id="firstFurigana"
                          name="firstFurigana"
                          value={formData.firstFurigana}
                          onChange={handleChange}
                          maxLength={50}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="例: たろう"
                        />
                      </div>

                      {/* 生年月日 */}
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                          生年月日 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                      </div>

                      {/* 性別 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          性別 <span className="text-red-600">*</span>
                        </label>
                        <div className="flex gap-6 mt-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Male"
                              checked={formData.gender === 'Male'}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            男
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Female"
                              checked={formData.gender === 'Female'}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            女
                          </label>
                        </div>
                        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                      </div>

                      {/* クラス */}
                      <div>
                        <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                          クラス
                        </label>
                        <select
                          id="classId"
                          name="classId"
                          value={formData.classId}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        >
                          <option value="">未所属</option>
                          {classes.map(cls => (
                            <option key={cls.classId} value={cls.classId}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 血液型 */}
                      <div>
                        <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                          血液型
                        </label>
                        <select
                          id="bloodType"
                          name="bloodType"
                          value={formData.bloodType}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        >
                          <option value="">不明</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="O">O</option>
                          <option value="AB">AB</option>
                        </select>
                      </div>

                      {/* ID */}
                      <div>
                        <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                          ID
                        </label>
                        <input
                          type="text"
                          id="childId"
                          value={String(childId).padStart(6, '0')}
                          disabled
                          className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 医療・特記事項 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">医療・特記事項</h3>
                    <div className="space-y-4">
                      {/* 食物アレルギー */}
                      <div>
                        <label htmlFor="allergy" className="block text-sm font-medium text-gray-700 mb-2">
                          食物アレルギー
                        </label>
                        <input
                          type="text"
                          id="allergy"
                          name="allergy"
                          value={formData.allergy}
                          onChange={handleChange}
                          maxLength={200}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="例: 卵、牛乳・乳製品、小麦"
                        />
                        <p className="mt-1 text-xs text-gray-500">最大200文字まで入力できます</p>
                      </div>

                      <div>
                        <label htmlFor="medicalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                          医療メモ
                        </label>
                        <textarea
                          id="medicalNotes"
                          name="medicalNotes"
                          value={formData.medicalNotes}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="上記以外のアレルギーや持病がある場合は記入してください"
                        />
                      </div>
                      <div>
                        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
                          特記事項
                        </label>
                        <textarea
                          id="specialInstructions"
                          name="specialInstructions"
                          value={formData.specialInstructions}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="保育上の注意点などを入力してください"
                        />
                      </div>

                      {/* 撮影禁止チェックボックス - 写真機能が有効な場合のみ表示 */}
                      {photoFunctionEnabled && (
                        <div className="md:col-span-2">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="flex items-start cursor-pointer">
                              <input
                                type="checkbox"
                                id="noPhoto"
                                name="noPhoto"
                                checked={formData.noPhoto}
                                onChange={handleChange}
                                className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="ml-3">
                                <span className="text-sm font-medium text-gray-700">撮影禁止</span>
                                <span className="block text-xs text-gray-500 mt-1">
                                  チェックを入れると、この園児が写った写真は共有されません。写真アップロード時に警告が表示されます。
                                </span>
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 卒園・退園情報 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">卒園・退園情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700 mb-2">
                          卒園日
                        </label>
                        <input
                          type="date"
                          id="graduationDate"
                          name="graduationDate"
                          value={formData.graduationDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="graduationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                          卒園ステータス
                        </label>
                        <select
                          id="graduationStatus"
                          name="graduationStatus"
                          value={formData.graduationStatus}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        >
                          <option value="">未設定</option>
                          <option value="Active">在籍中</option>
                          <option value="Graduated">卒園済み</option>
                          <option value="Withdrawn">退園</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="withdrawalReason" className="block text-sm font-medium text-gray-700 mb-2">
                          退園理由
                        </label>
                        <textarea
                          id="withdrawalReason"
                          name="withdrawalReason"
                          value={formData.withdrawalReason}
                          onChange={handleChange}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          placeholder="退園理由を入力してください"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer - 固定 */}
          {!isLoading && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                onClick={handleSubmit}
                className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {isSaving ? '保存中...' : '保存する'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
