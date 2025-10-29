import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { dailyReportService } from '../services/dailyReportService';
import { masterService } from '../services/masterService';
import type {
  DailyReportDto,
  CreateDailyReportRequestDto,
  UpdateDailyReportRequestDto,
} from '../types/dailyReport';
import type { ChildDto, StaffDto } from '../types/master';

/**
 * 日報作成/編集ページ
 * 新規作成モードと編集モードの両方に対応
 */
export function DailyReportFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [existingReport, setExistingReport] = useState<DailyReportDto | null>(null);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [staff, setStaff] = useState<StaffDto[]>([]);

  // フォーム入力値の状態（作成用）
  const [createFormData, setCreateFormData] = useState<CreateDailyReportRequestDto>({
    childId: 0,
    staffId: 0,
    reportDate: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    content: '',
    tags: [],
    photos: [],
    status: 'draft',
  });

  // フォーム入力値の状態（更新用）
  const [updateFormData, setUpdateFormData] = useState<UpdateDailyReportRequestDto>({
    reportDate: new Date().toISOString().split('T')[0],
    category: '',
    title: '',
    content: '',
    tags: [],
    photos: [],
    status: 'draft',
  });

  // 動的入力用の一時値
  const [tagInput, setTagInput] = useState('');
  const [photoInput, setPhotoInput] = useState('');

  // 読み取り専用モードのチェック
  const isReadOnly = isEditMode && existingReport && (existingReport.status === 'published' || existingReport.status === 'archived');

  // マスタデータ読み込み
  useEffect(() => {
    loadMasterData();
  }, []);

  // 編集モードの場合、既存データを読み込む
  useEffect(() => {
    if (isEditMode && id) {
      loadReportData(Number(id));
    }
  }, [isEditMode, id]);

  const loadMasterData = async () => {
    try {
      const [childrenData, staffData] = await Promise.all([
        masterService.getChildren({ isActive: true }),
        masterService.getStaff({ isActive: true }),
      ]);
      setChildren(childrenData);
      setStaff(staffData);
    } catch (error) {
      console.error('マスタデータの取得に失敗しました:', error);
      setErrors({ general: 'マスタデータの取得に失敗しました' });
    }
  };

  const loadReportData = async (reportId: number) => {
    try {
      setIsLoading(true);
      const data = await dailyReportService.getDailyReportById(reportId);
      setExistingReport(data);
      setUpdateFormData({
        reportDate: data.reportDate.split('T')[0],
        category: data.category,
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        photos: data.photos || [],
        status: data.status,
      });
    } catch (error) {
      console.error('日報情報の取得に失敗しました:', error);
      setErrors({ general: '日報情報の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 作成フォーム入力値変更ハンドラ
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'childId' || name === 'staffId') {
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
  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setUpdateFormData(prev => ({ ...prev, [name]: value }));

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // タグ追加
  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const formData = isEditMode ? updateFormData : createFormData;
    const tags = formData.tags || [];

    if (tags.includes(tagInput.trim())) {
      setErrors(prev => ({ ...prev, tags: 'このタグは既に追加されています' }));
      return;
    }

    if (isEditMode) {
      setUpdateFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
    } else {
      setCreateFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
    }

    setTagInput('');
    if (errors.tags) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tags;
        return newErrors;
      });
    }
  };

  // タグ削除
  const handleRemoveTag = (index: number) => {
    if (isEditMode) {
      setUpdateFormData(prev => ({
        ...prev,
        tags: (prev.tags || []).filter((_, i) => i !== index),
      }));
    } else {
      setCreateFormData(prev => ({
        ...prev,
        tags: (prev.tags || []).filter((_, i) => i !== index),
      }));
    }
  };

  // 写真追加
  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;

    const formData = isEditMode ? updateFormData : createFormData;
    const photos = formData.photos || [];

    if (photos.includes(photoInput.trim())) {
      setErrors(prev => ({ ...prev, photos: 'この写真URLは既に追加されています' }));
      return;
    }

    if (isEditMode) {
      setUpdateFormData(prev => ({ ...prev, photos: [...(prev.photos || []), photoInput.trim()] }));
    } else {
      setCreateFormData(prev => ({ ...prev, photos: [...(prev.photos || []), photoInput.trim()] }));
    }

    setPhotoInput('');
    if (errors.photos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photos;
        return newErrors;
      });
    }
  };

  // 写真削除
  const handleRemovePhoto = (index: number) => {
    if (isEditMode) {
      setUpdateFormData(prev => ({
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index),
      }));
    } else {
      setCreateFormData(prev => ({
        ...prev,
        photos: (prev.photos || []).filter((_, i) => i !== index),
      }));
    }
  };

  // バリデーション（作成）
  const validateCreate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createFormData.childId || createFormData.childId === 0) {
      newErrors.childId = '園児を選択してください';
    }

    if (!createFormData.staffId || createFormData.staffId === 0) {
      newErrors.staffId = '職員を選択してください';
    }

    if (!createFormData.reportDate) {
      newErrors.reportDate = '日報日付は必須です';
    } else {
      const reportDate = new Date(createFormData.reportDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate > today) {
        newErrors.reportDate = '日報日付に未来の日付は指定できません';
      }
    }

    if (!createFormData.category) {
      newErrors.category = 'カテゴリを選択してください';
    }

    if (!createFormData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (createFormData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!createFormData.content.trim()) {
      newErrors.content = '内容は必須です';
    } else if (createFormData.content.length > 1000) {
      newErrors.content = '内容は1000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // バリデーション（更新）
  const validateUpdate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!updateFormData.reportDate) {
      newErrors.reportDate = '日報日付は必須です';
    } else {
      const reportDate = new Date(updateFormData.reportDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate > today) {
        newErrors.reportDate = '日報日付に未来の日付は指定できません';
      }
    }

    if (!updateFormData.category) {
      newErrors.category = 'カテゴリを選択してください';
    }

    if (!updateFormData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (updateFormData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!updateFormData.content.trim()) {
      newErrors.content = '内容は必須です';
    } else if (updateFormData.content.length > 1000) {
      newErrors.content = '内容は1000文字以内で入力してください';
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

      if (isEditMode && id) {
        // 更新
        await dailyReportService.updateDailyReport(Number(id), updateFormData);
        setSuccessMessage('日報を更新しました');
      } else {
        // 作成
        await dailyReportService.createDailyReport(createFormData);
        setSuccessMessage('日報を作成しました');
      }

      // 成功メッセージを3秒後に自動消去してリダイレクト
      setTimeout(() => {
        navigate('/desktop/dailyreports');
      }, 3000);
    } catch (error: any) {
      console.error('日報の保存に失敗しました:', error);

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
        setErrors({ general: '日報の保存に失敗しました' });
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formData = isEditMode ? updateFormData : createFormData;
  const categories = ['食事', '睡眠', '排泄', '遊び', '健康', 'その他'];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? '日報編集' : '日報新規作成'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? `日報「${existingReport?.title}」の情報を編集します`
              : '新しい日報を作成します'}
          </p>
        </div>

        {/* 読み取り専用メッセージ */}
        {isReadOnly && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            この日報は公開済みまたはアーカイブされているため、編集できません
          </div>
        )}

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

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
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md border border-gray-200">
          <div className="p-6 space-y-6">
            {/* 園児選択（作成時のみ） */}
            {!isEditMode && (
              <div>
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                  園児 <span className="text-red-600">*</span>
                </label>
                <select
                  id="childId"
                  name="childId"
                  value={createFormData.childId}
                  onChange={handleCreateChange}
                  disabled={isReadOnly || false}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    errors.childId ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value={0}>選択してください</option>
                  {children.map(child => (
                    <option key={child.childId} value={child.childId}>
                      {child.name}
                    </option>
                  ))}
                </select>
                {errors.childId && <p className="mt-1 text-sm text-red-600">{errors.childId}</p>}
              </div>
            )}

            {/* 園児表示（編集時） */}
            {isEditMode && existingReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">園児</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {existingReport.childName} ({existingReport.className || '未所属'})
                </div>
              </div>
            )}

            {/* 職員選択（作成時のみ） */}
            {!isEditMode && (
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                  職員 <span className="text-red-600">*</span>
                </label>
                <select
                  id="staffId"
                  name="staffId"
                  value={createFormData.staffId}
                  onChange={handleCreateChange}
                  disabled={isReadOnly || false}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    errors.staffId ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value={0}>選択してください</option>
                  {staff.map(s => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.staffId && <p className="mt-1 text-sm text-red-600">{errors.staffId}</p>}
              </div>
            )}

            {/* 職員表示（編集時） */}
            {isEditMode && existingReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">職員</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {existingReport.staffName}
                </div>
              </div>
            )}

            {/* 日報日付 */}
            <div>
              <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-2">
                日報日付 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="reportDate"
                name="reportDate"
                value={formData.reportDate}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.reportDate ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {errors.reportDate && <p className="mt-1 text-sm text-red-600">{errors.reportDate}</p>}
            </div>

            {/* カテゴリ */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ <span className="text-red-600">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              >
                <option value="">選択してください</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                maxLength={200}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="例: 今日の給食の様子"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200文字</p>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* 内容 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                内容 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                maxLength={1000}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="日報の内容を入力してください"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.content.length}/1000文字</p>
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            </div>

            {/* タグ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タグ（任意）</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  disabled={isReadOnly || false}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="タグを入力してEnterキーまたは追加ボタンを押す"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isReadOnly || false}
                  className={`px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition ${
                    isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  追加
                </button>
              </div>
              {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {tag}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* 写真 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">写真（任意）</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={photoInput}
                  onChange={e => setPhotoInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddPhoto())}
                  disabled={isReadOnly || false}
                  className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="写真URLを入力してEnterキーまたは追加ボタンを押す"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={isReadOnly || false}
                  className={`px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition ${
                    isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  追加
                </button>
              </div>
              {errors.photos && <p className="mt-1 text-sm text-red-600">{errors.photos}</p>}
              <div className="space-y-2 mt-2">
                {(formData.photos || []).map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">{photo}</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ステータス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                    disabled={isReadOnly || false}
                    className={`w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-400 ${
                      isReadOnly ? 'cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-700">下書き</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                    disabled={isReadOnly || false}
                    className={`w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-400 ${
                      isReadOnly ? 'cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-700">公開済み</span>
                </label>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/desktop/dailyreports')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition"
            >
              キャンセル
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
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
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
