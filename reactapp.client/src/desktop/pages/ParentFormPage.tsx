import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type {
  ParentDto,
  CreateParentRequestDto,
  UpdateParentRequestDto,
  ChildDto,
  ChildIdentifier,
} from '../types/master';

/**
 * 保護者作成・編集ページ
 * 新規作成モードと編集モードの両対応
 */
export function ParentFormPage() {
  const navigate = useNavigate();
  const { parentId } = useParams<{ parentId: string }>();
  const isEditMode = !!parentId;

  const [parent, setParent] = useState<ParentDto | null>(null);
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 基本情報フォーム状態
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    email: '',
    address: '',
    isActive: true,
  });

  // 園児選択状態
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());

  // オートコンプリート用状態
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildSuggestions, setShowChildSuggestions] = useState(false);

  // 通知設定状態（編集時のみ）
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotificationsEnabled: false,
    absenceConfirmationEnabled: false,
    dailyReportEnabled: false,
    eventNotificationEnabled: false,
    announcementEnabled: false,
  });

  // 表示設定状態（編集時のみ）
  const [displaySettings, setDisplaySettings] = useState({
    fontSize: 'medium',
    language: 'ja',
  });

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [parentId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 園児一覧を取得
      const childrenData = await masterService.getChildren({ isActive: true });
      setChildren(childrenData);

      // 編集モードの場合は保護者データを取得
      if (isEditMode && parentId) {
        const parentData = await masterService.getParent(parseInt(parentId, 10));
        setParent(parentData);
        setFormData({
          phoneNumber: parentData.phoneNumber,
          name: parentData.name || '',
          email: parentData.email || '',
          address: parentData.address || '',
          isActive: parentData.isActive,
        });
        setNotificationSettings({
          pushNotificationsEnabled: parentData.pushNotificationsEnabled,
          absenceConfirmationEnabled: parentData.absenceConfirmationEnabled,
          dailyReportEnabled: parentData.dailyReportEnabled,
          eventNotificationEnabled: parentData.eventNotificationEnabled,
          announcementEnabled: parentData.announcementEnabled,
        });
        setDisplaySettings({
          fontSize: parentData.fontSize,
          language: parentData.language,
        });

        // 紐付いている園児を selectedChildIds に設定
        const childIds = new Set<string>(
          parentData.children.map(child => `${child.nurseryId}-${child.childId}`)
        );
        setSelectedChildIds(childIds);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'phoneNumber') {
      // 電話番号のハイフン自動挿入
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 3 && cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      } else if (cleaned.length > 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
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

  // オートコンプリート: 園児を追加
  const handleAddChild = (child: ChildDto) => {
    const key = `${child.nurseryId}-${child.childId}`;
    setSelectedChildIds(prev => new Set(prev).add(key));
    setChildSearchQuery('');
    setShowChildSuggestions(false);
  };

  // オートコンプリート: 園児を削除
  const handleRemoveChild = (nurseryId: number, childId: number) => {
    const key = `${nurseryId}-${childId}`;
    setSelectedChildIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // フィルタされた園児候補を取得
  const getFilteredChildren = () => {
    if (!childSearchQuery.trim()) return [];

    const query = childSearchQuery.toLowerCase();
    return children.filter(child => {
      const key = `${child.nurseryId}-${child.childId}`;
      // 既に選択済みの園児は除外
      if (selectedChildIds.has(key)) return false;
      // 名前で検索
      return child.name.toLowerCase().includes(query);
    }).slice(0, 10); // 最大10件まで表示
  };

  // 選択済み園児を取得
  const getSelectedChildren = () => {
    return children.filter(child => {
      const key = `${child.nurseryId}-${child.childId}`;
      return selectedChildIds.has(key);
    });
  };

  // 通知設定トグル
  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 電話番号のバリデーション（作成時・編集時共通）
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^\d{3}-\d{4}-\d{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '電話番号は XXX-XXXX-XXXX の形式で入力してください';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    // 作成時は園児選択が必須ではない（後から紐付け可能）

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

      if (isEditMode && parentId) {
        // 編集モード
        const updateRequest: UpdateParentRequestDto = {
          phoneNumber: formData.phoneNumber || undefined,
          name: formData.name || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          pushNotificationsEnabled: notificationSettings.pushNotificationsEnabled,
          absenceConfirmationEnabled: notificationSettings.absenceConfirmationEnabled,
          dailyReportEnabled: notificationSettings.dailyReportEnabled,
          eventNotificationEnabled: notificationSettings.eventNotificationEnabled,
          announcementEnabled: notificationSettings.announcementEnabled,
          fontSize: displaySettings.fontSize,
          language: displaySettings.language,
          isActive: formData.isActive,
        };
        await masterService.updateParent(parseInt(parentId, 10), updateRequest);
      } else {
        // 新規作成モード
        const childIds: ChildIdentifier[] = Array.from(selectedChildIds).map(key => {
          const [nurseryId, childId] = key.split('-').map(Number);
          return { nurseryId, childId };
        });

        const createRequest: CreateParentRequestDto = {
          phoneNumber: formData.phoneNumber,
          name: formData.name || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          childIds,
        };
        await masterService.createParent(createRequest);
      }

      navigate('/desktop/parents');
    } catch (error) {
      console.error('保存に失敗しました:', error);

      // バックエンドからのエラーメッセージを取得
      let errorMessage = '保存に失敗しました';
      if (error && typeof error === 'object' && 'response' in error) {
        const responseData = (error as any).response?.data;
        // ApiResponse形式のエラーメッセージ (バックエンドのApiError)
        if (responseData?.error?.message) {
          errorMessage = responseData.error.message;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    navigate('/desktop/parents');
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
            {isEditMode ? '保護者編集' : '保護者新規作成'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? '保護者情報を編集します' : '新しい保護者を登録します'}
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
          <div className="p-6 space-y-8">
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
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* 電話番号 */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="090-1234-5678"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* メールアドレス */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="example@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* 住所 */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    住所
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="例: 東京都渋谷区..."
                  />
                </div>

                {/* ID（編集時のみ） */}
                {isEditMode && parent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900 font-mono">
                        {String(parent.id).padStart(6, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 園児選択（作成時） */}
            {!isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  園児選択
                </h2>

                {/* オートコンプリート検索 */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    園児を追加
                  </label>
                  <input
                    type="text"
                    value={childSearchQuery}
                    onChange={(e) => {
                      setChildSearchQuery(e.target.value);
                      setShowChildSuggestions(true);
                    }}
                    onFocus={() => setShowChildSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowChildSuggestions(false), 200)}
                    placeholder="園児名を入力..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  />

                  {/* サジェストリスト */}
                  {showChildSuggestions && childSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredChildren().length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          該当する園児が見つかりません
                        </div>
                      ) : (
                        getFilteredChildren().map((child) => (
                          <button
                            key={`${child.nurseryId}-${child.childId}`}
                            type="button"
                            onClick={() => handleAddChild(child)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.className || '未配属'} / {child.age}歳
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 選択済み園児一覧 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選択済み園児
                  </label>
                  {getSelectedChildren().length === 0 ? (
                    <p className="text-gray-500 text-center py-8 border border-gray-200 rounded-lg">
                      園児が選択されていません
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getSelectedChildren().map((child) => (
                        <div
                          key={`${child.nurseryId}-${child.childId}`}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.className || '未配属'} / {child.age}歳
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.nurseryId, child.childId)}
                            className="ml-2 text-red-600 hover:text-red-800 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    選択数: {getSelectedChildren().length} 人
                  </p>
                </div>
              </div>
            )}

            {/* 園児選択（編集時） */}
            {isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  園児選択
                </h2>

                {/* オートコンプリート検索 */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    園児を追加
                  </label>
                  <input
                    type="text"
                    value={childSearchQuery}
                    onChange={(e) => {
                      setChildSearchQuery(e.target.value);
                      setShowChildSuggestions(true);
                    }}
                    onFocus={() => setShowChildSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowChildSuggestions(false), 200)}
                    placeholder="園児名を入力..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  />

                  {/* サジェストリスト */}
                  {showChildSuggestions && childSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredChildren().length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          該当する園児が見つかりません
                        </div>
                      ) : (
                        getFilteredChildren().map((child) => (
                          <button
                            key={`${child.nurseryId}-${child.childId}`}
                            type="button"
                            onClick={() => handleAddChild(child)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.className || '未配属'} / {child.age}歳
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 選択済み園児一覧 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選択済み園児
                  </label>
                  {getSelectedChildren().length === 0 ? (
                    <p className="text-gray-500 text-center py-8 border border-gray-200 rounded-lg">
                      園児が選択されていません
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getSelectedChildren().map((child) => (
                        <div
                          key={`${child.nurseryId}-${child.childId}`}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.className || '未配属'} / {child.age}歳
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(child.nurseryId, child.childId)}
                            className="ml-2 text-red-600 hover:text-red-800 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    選択数: {getSelectedChildren().length} 人
                  </p>
                </div>
              </div>
            )}

            {/* 通知設定（編集時のみ） */}
            {isEditMode && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* プッシュ通知 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プッシュ通知有効
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {notificationSettings.pushNotificationsEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* 欠席確認通知 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      欠席確認通知
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {notificationSettings.absenceConfirmationEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* 日報通知 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      日報通知
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {notificationSettings.dailyReportEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* イベント通知 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      イベント通知
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {notificationSettings.eventNotificationEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* お知らせ通知 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      お知らせ通知
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {notificationSettings.announcementEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 表示設定（編集時のみ） */}
            {isEditMode && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* フォントサイズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      フォントサイズ
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {displaySettings.fontSize === 'small' ? '小' : displaySettings.fontSize === 'medium' ? '中' : '大'}
                      </span>
                    </div>
                  </div>

                  {/* 言語 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-900">
                        {displaySettings.language === 'ja' ? '日本語' : 'English'}
                      </span>
                    </div>
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

/**
 * トグルスイッチコンポーネント（iOS風デザイン）
 */
interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          checked ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
