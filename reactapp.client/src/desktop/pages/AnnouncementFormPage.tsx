import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { announcementService } from '../services/announcementService';
import { masterService } from '../services/masterService';
import type {
  AnnouncementDto,
  CreateAnnouncementRequestDto,
  UpdateAnnouncementRequestDto,
  AnnouncementCategoryType,
  TargetAudienceType,
} from '../types/announcement';
import type { ChildDto, ClassDto } from '../types/master';
import { announcementCategoriesDesktop } from '../types/announcement';

/**
 * お知らせ作成/編集ページ
 * 新規作成モードと編集モードの両方に対応
 */
export function AnnouncementFormPage() {
  const navigate = useNavigate();
  const { announcementId } = useParams<{ announcementId?: string }>();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const isEditMode = !!announcementId;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);

  // フォーム入力値の状態
  const [formData, setFormData] = useState<CreateAnnouncementRequestDto | UpdateAnnouncementRequestDto>({
    title: '',
    content: '',
    category: 'general',
    targetAudience: 'all',
  });

  // 配信タイプ（即時/予約/下書き）
  const [deliveryType, setDeliveryType] = useState<'immediate' | 'scheduled' | 'draft'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  // オートコンプリート用のstate
  const [childSearchText, setChildSearchText] = useState('');
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [filteredChildren, setFilteredChildren] = useState<ChildDto[]>([]);

  // 編集モードの場合、既存データを読み込む
  useEffect(() => {
    loadChildren();
    loadClasses();

    if (isEditMode && announcementId) {
      loadAnnouncementData(parseInt(announcementId));
    }
  }, [isEditMode, announcementId]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#childSearch') && !target.closest('.child-dropdown')) {
        setShowChildDropdown(false);
      }
    };

    if (showChildDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChildDropdown]);

  const loadChildren = async () => {
    try {
      const childrenData = await masterService.getChildren();
      setChildren(childrenData);
    } catch (error) {
      console.error('園児取得エラー:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await masterService.getClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('クラス取得エラー:', error);
    }
  };


  const loadAnnouncementData = async (id: number) => {
    try {
      setIsLoading(true);

      if (isDemoMode) {
        // デモモードの場合は簡略化されたデータ
        setFormData({
          title: 'サンプルお知らせ',
          content: 'お知らせの詳細内容がここに入ります。',
          category: 'general',
          targetAudience: 'all',
        });
      } else {
        const data = await announcementService.getAnnouncementById(id);
        setFormData({
          title: data.title,
          content: data.content,
          category: data.category,
          targetAudience: data.targetAudience,
          targetClassId: data.targetClassId,
          targetChildId: data.targetChildId,
        });

        // 個別配信の場合は園児名をセット
        if (data.targetAudience === 'individual' && data.targetChildName) {
          setChildSearchText(`${data.targetChildName}${data.targetClassName ? ` (${data.targetClassName})` : ''}`);
        }

        if (data.scheduledAt && !data.publishedAt) {
          setDeliveryType('scheduled');
          const scheduled = new Date(data.scheduledAt);
          setScheduledDate(scheduled.toISOString().split('T')[0]);
          setScheduledTime(scheduled.toTimeString().slice(0, 5));
        } else if (data.publishedAt) {
          setDeliveryType('immediate');
        } else {
          setDeliveryType('draft');
        }
      }
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
      setErrors({ general: 'お知らせ情報の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (category: AnnouncementCategoryType) => {
    setFormData(prev => ({ ...prev, category }));
    if (errors.category) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
  };

  const handleTargetAudienceChange = (targetAudience: TargetAudienceType) => {
    setFormData(prev => ({
      ...prev,
      targetAudience,
      targetClassId: undefined,
      targetChildId: undefined,
    }));
    // 個別選択時の検索テキストをクリア
    setChildSearchText('');
    setFilteredChildren([]);
    setShowChildDropdown(false);
  };

  // 園児名の検索テキスト変更ハンドラー
  const handleChildSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setChildSearchText(searchValue);

    if (searchValue.trim() === '') {
      setFilteredChildren([]);
      setShowChildDropdown(false);
      setFormData(prev => ({ ...prev, targetChildId: undefined }));
      return;
    }

    // 名前で絞り込み（部分一致）
    const filtered = children.filter(child =>
      child.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredChildren(filtered);
    setShowChildDropdown(filtered.length > 0);
  };

  // 園児選択ハンドラー
  const handleChildSelect = (child: ChildDto) => {
    setFormData(prev => ({ ...prev, targetChildId: child.childId }));
    setChildSearchText(`${child.name} (${child.className})`);
    setShowChildDropdown(false);

    // エラークリア
    if (errors.targetChildId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.targetChildId;
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.content.trim()) {
      newErrors.content = '本文は必須です';
    }

    if (formData.targetAudience === 'class' && !formData.targetClassId) {
      newErrors.targetClassId = '対象クラスを選択してください';
    }

    if (formData.targetAudience === 'individual' && !formData.targetChildId) {
      newErrors.targetChildId = '対象園児を選択してください';
    }

    if (deliveryType === 'scheduled') {
      if (!scheduledDate) {
        newErrors.scheduledDate = '配信日を指定してください';
      }
      if (!scheduledTime) {
        newErrors.scheduledTime = '配信時刻を指定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      // 配信日時の設定
      let requestData = { ...formData };

      if (deliveryType === 'scheduled') {
        requestData.scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
      }

      if (isEditMode && announcementId) {
        if (isDemoMode) {
          console.log('デモモード: お知らせ更新', requestData);
        } else {
          await announcementService.updateAnnouncement(parseInt(announcementId), requestData);
        }
      } else {
        if (isDemoMode) {
          console.log('デモモード: お知らせ作成', requestData);
        } else {
          const created = await announcementService.createAnnouncement(requestData);

          // 即時配信の場合は作成後すぐに配信
          if (deliveryType === 'immediate') {
            await announcementService.publishAnnouncement(created.announcementId);
          }
        }
      }

      navigate(`/desktop/announcements${isDemoMode ? '?demo=true' : ''}`);
    } catch (error: any) {
      console.error('お知らせ保存エラー:', error);

      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            apiErrors[key.toLowerCase()] = messages[0];
          }
        });
        setErrors(apiErrors);
      } else {
        setErrors({ general: 'お知らせの保存に失敗しました' });
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditMode ? 'お知らせ編集' : 'お知らせ新規作成'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'お知らせの情報を編集します' : '新しいお知らせを作成します'}
          </p>
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
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md border border-gray-200">
          <div className="p-6 space-y-6">
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
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                  errors.title ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="お知らせのタイトルを入力"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* 本文 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                本文 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={8}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                  errors.content ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="お知らせの詳細内容を入力"
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(announcementCategoriesDesktop).map(([key, category]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key as AnnouncementCategoryType)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
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

            {/* 対象範囲 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                対象範囲 <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handleTargetAudienceChange('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    formData.targetAudience === 'all'
                      ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  全体
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetAudienceChange('class')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    formData.targetAudience === 'class'
                      ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  クラス別
                </button>
                <button
                  type="button"
                  onClick={() => handleTargetAudienceChange('individual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    formData.targetAudience === 'individual'
                      ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  個別
                </button>
              </div>

              {/* クラス選択 */}
              {formData.targetAudience === 'class' && (
                <div>
                  <label htmlFor="targetClassId" className="block text-sm font-medium text-gray-700 mb-2">
                    対象クラス <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="targetClassId"
                    name="targetClassId"
                    value={formData.targetClassId ?? ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        targetClassId: e.target.value || undefined,
                      }))
                    }
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.targetClassId ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">クラスを選択してください</option>
                    {classes.map((classItem) => (
                      <option key={classItem.classId} value={classItem.classId}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                  {errors.targetClassId && <p className="mt-1 text-sm text-red-600">{errors.targetClassId}</p>}
                </div>
              )}

              {/* 園児選択（オートコンプリート） */}
              {formData.targetAudience === 'individual' && (
                <div className="relative">
                  <label htmlFor="childSearch" className="block text-sm font-medium text-gray-700 mb-2">
                    対象園児 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="childSearch"
                    value={childSearchText}
                    onChange={handleChildSearchChange}
                    onFocus={() => {
                      if (filteredChildren.length > 0) {
                        setShowChildDropdown(true);
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.targetChildId ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="園児名を入力してください"
                    autoComplete="off"
                  />
                  {errors.targetChildId && <p className="mt-1 text-sm text-red-600">{errors.targetChildId}</p>}

                  {/* オートコンプリートドロップダウン */}
                  {showChildDropdown && filteredChildren.length > 0 && (
                    <div className="child-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredChildren.map((child) => (
                        <button
                          key={child.childId}
                          type="button"
                          onClick={() => handleChildSelect(child)}
                          className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="font-medium text-gray-800">{child.name}</span>
                          <span className="text-gray-500 ml-2">({child.className})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 配信設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">配信設定</label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('immediate')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    deliveryType === 'immediate'
                      ? 'bg-green-500 text-white border-green-500 ring-2 ring-green-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  即時配信
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('scheduled')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    deliveryType === 'scheduled'
                      ? 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  予約配信
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('draft')}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
                    deliveryType === 'draft'
                      ? 'bg-gray-500 text-white border-gray-500 ring-2 ring-gray-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  下書き保存
                </button>
              </div>

              {/* 予約配信の日時設定 */}
              {deliveryType === 'scheduled' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                      配信日 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      id="scheduledDate"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                        errors.scheduledDate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>}
                  </div>
                  <div>
                    <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                      配信時刻 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="time"
                      id="scheduledTime"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                        errors.scheduledTime ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.scheduledTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/desktop/announcements${isDemoMode ? '?demo=true' : ''}`)}
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
