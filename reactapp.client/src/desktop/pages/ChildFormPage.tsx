import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type {
  ChildDto,
  CreateChildRequestDto,
  UpdateChildRequestDto,
  ClassDto,
  ParentDto,
} from '../types/master';

/**
 * 園児作成・編集ページ
 * 新規作成モードと編集モードの両対応
 */
export function ChildFormPage() {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const isEditMode = !!childId;

  const [child, setChild] = useState<ChildDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [parents, setParents] = useState<ParentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    bloodType: '',
    medicalNotes: '',
    specialInstructions: '',
    parentIds: [] as number[],
    graduationDate: '',
    graduationStatus: '',
    withdrawalReason: '',
    isActive: true,
  });

  // オートコンプリート用状態
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [childId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // クラス一覧と保護者一覧を並列取得
      const [classesData, parentsData] = await Promise.all([
        masterService.getClasses({ isActive: true }),
        masterService.getParents(),
      ]);

      setClasses(classesData);
      setParents(parentsData);

      // 編集モードの場合は園児データを取得
      if (isEditMode && childId) {
        const childData = await masterService.getChild(parseInt(childId, 10));
        setChild(childData);
        setFormData({
          name: childData.name,
          dateOfBirth: childData.dateOfBirth.split('T')[0],
          gender: childData.gender,
          classId: childData.classId || '',
          bloodType: childData.bloodType || '',
          medicalNotes: childData.medicalNotes || '',
          specialInstructions: childData.specialInstructions || '',
          parentIds: childData.parents.map(p => p.id),
          graduationDate: childData.graduationDate?.split('T')[0] || '',
          graduationStatus: childData.graduationStatus || '',
          withdrawalReason: childData.withdrawalReason || '',
          isActive: childData.isActive,
        });
      }
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

  // 保護者選択変更ハンドラ
  const handleParentToggle = (parentId: number) => {
    setFormData(prev => {
      const parentIds = prev.parentIds.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...prev.parentIds, parentId];
      return { ...prev, parentIds };
    });
  };

  // オートコンプリート: 保護者を追加
  const handleAddParent = (parent: ParentDto) => {
    setFormData(prev => ({
      ...prev,
      parentIds: [...prev.parentIds, parent.id]
    }));
    setParentSearchQuery('');
    setShowParentSuggestions(false);
  };

  // オートコンプリート: 保護者を削除
  const handleRemoveParent = (parentId: number) => {
    setFormData(prev => ({
      ...prev,
      parentIds: prev.parentIds.filter(id => id !== parentId)
    }));
  };

  // フィルタされた保護者候補を取得
  const getFilteredParents = () => {
    if (!parentSearchQuery.trim()) return [];
    const query = parentSearchQuery.toLowerCase();
    return parents.filter(parent => {
      if (formData.parentIds.includes(parent.id)) return false;
      const name = parent.name || '';
      return name.toLowerCase().includes(query);
    }).slice(0, 10);
  };

  // 選択済み保護者を取得
  const getSelectedParents = () => {
    return parents.filter(parent => formData.parentIds.includes(parent.id));
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '氏名は必須です';
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

    if (!isEditMode && formData.parentIds.length === 0) {
      newErrors.parentIds = '保護者を1人以上選択してください';
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

      if (isEditMode && childId) {
        // 編集モード
        const updateRequest: UpdateChildRequestDto = {
          name: formData.name,
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
        };
        await masterService.updateChild(parseInt(childId, 10), updateRequest);
      } else {
        // 新規作成モード
        const createRequest: CreateChildRequestDto = {
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          classId: formData.classId || undefined,
          bloodType: formData.bloodType || undefined,
          medicalNotes: formData.medicalNotes || undefined,
          specialInstructions: formData.specialInstructions || undefined,
          parentIds: formData.parentIds,
        };
        await masterService.createChild(createRequest);
      }

      navigate('/desktop/children');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      setErrors({ general: '保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    navigate('/desktop/children');
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? '園児編集' : '園児新規作成'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? '園児情報を編集します' : '新しい園児を登録します'}
          </p>
        </div>

        {/* エラーメッセージ */}
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
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md border border-gray-200">
          <div className="p-6 space-y-6">
            {/* 基本情報セクション */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 氏名 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    氏名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="例: 山田 太郎"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      <span className="text-gray-700">男</span>
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
                      <span className="text-gray-700">女</span>
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">不明</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="O">O</option>
                    <option value="AB">AB</option>
                  </select>
                </div>

                {/* ID（編集モード時のみ表示） */}
                {isEditMode && childId && (
                  <div>
                    <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                      ID
                    </label>
                    <input
                      type="text"
                      id="childId"
                      name="childId"
                      value={String(childId).padStart(6, '0')}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 医療・特記事項セクション */}
            <div>
              <div className="space-y-4">
                {/* 医療メモ */}
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="アレルギー、既往症などを入力してください"
                  />
                </div>

                {/* 特記事項 */}
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="保育上の注意点などを入力してください"
                  />
                </div>
              </div>
            </div>

            {/* 保護者選択セクション（新規作成時のみ） */}
            {!isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  保護者選択 <span className="text-red-600">*</span>
                </h2>

                {/* オートコンプリート検索 */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    保護者を追加
                  </label>
                  <input
                    type="text"
                    value={parentSearchQuery}
                    onChange={(e) => {
                      setParentSearchQuery(e.target.value);
                      setShowParentSuggestions(true);
                    }}
                    onFocus={() => setShowParentSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowParentSuggestions(false), 200)}
                    placeholder="保護者名を入力..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  />

                  {/* 候補リスト */}
                  {showParentSuggestions && parentSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredParents().length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          該当する保護者が見つかりません
                        </div>
                      ) : (
                        getFilteredParents().map((parent) => (
                          <button
                            key={parent.id}
                            type="button"
                            onClick={() => handleAddParent(parent)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{parent.name || '名前未登録'}</div>
                            <div className="text-sm text-gray-600">{parent.phoneNumber}</div>
                            {parent.email && <div className="text-sm text-gray-600">{parent.email}</div>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 選択済み保護者一覧 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選択済み保護者 ({getSelectedParents().length}人)
                  </label>
                  {getSelectedParents().length === 0 ? (
                    <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
                      保護者が選択されていません
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getSelectedParents().map((parent) => (
                        <div
                          key={parent.id}
                          className="flex items-start justify-between p-4 border border-gray-200 rounded-md bg-white"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{parent.name || '名前未登録'}</div>
                            <div className="text-sm text-gray-600">{parent.phoneNumber}</div>
                            {parent.email && <div className="text-sm text-gray-600">{parent.email}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParent(parent.id)}
                            className="ml-4 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition border border-red-200"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {errors.parentIds && (
                  <p className="mt-2 text-sm text-red-600">{errors.parentIds}</p>
                )}
              </div>
            )}

            {/* 卒園・退園情報セクション（編集時のみ） */}
            {isEditMode && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 卒園日 */}
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    />
                  </div>

                  {/* 卒園ステータス */}
                  <div>
                    <label htmlFor="graduationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                      卒園ステータス
                    </label>
                    <select
                      id="graduationStatus"
                      name="graduationStatus"
                      value={formData.graduationStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    >
                      <option value="">未設定</option>
                      <option value="Active">在籍中</option>
                      <option value="Graduated">卒園済み</option>
                      <option value="Withdrawn">退園</option>
                    </select>
                  </div>

                  {/* 退園理由 */}
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                      placeholder="退園理由を入力してください"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター（保存・キャンセルボタン） */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:shadow-md transition-all duration-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                isSaving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg'
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
