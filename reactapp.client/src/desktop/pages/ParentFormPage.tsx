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

  // 園児選択状態（作成時のみ）
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());

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

      // 園児一覧を取得（作成時のみ）
      if (!isEditMode) {
        const childrenData = await masterService.getChildren({ isActive: true });
        setChildren(childrenData);
      }

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

  // 園児選択トグル
  const handleChildToggle = (nurseryId: number, childId: number) => {
    const key = `${nurseryId}-${childId}`;
    setSelectedChildIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 通知設定トグル
  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      setErrors({ general: '保存に失敗しました' });
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-8">
            {/* 基本情報セクション */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                基本情報
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={isEditMode}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="090-1234-5678"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                  {isEditMode && (
                    <p className="mt-1 text-sm text-gray-500">電話番号は編集できません</p>
                  )}
                </div>

                {/* 氏名 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    氏名
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例: 山田 太郎"
                  />
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例: 東京都渋谷区..."
                  />
                </div>
              </div>
            </div>

            {/* 園児選択（作成時のみ） */}
            {!isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  園児選択
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  この保護者に紐付ける園児を選択してください（後から追加・変更可能）
                </p>
                {children.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">選択可能な園児がいません</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {children.map((child) => {
                      const key = `${child.nurseryId}-${child.childId}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildIds.has(key)}
                            onChange={() => handleChildToggle(child.nurseryId, child.childId)}
                            className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{child.name}</div>
                            <div className="text-sm text-gray-500">
                              {child.className || '未配属'} / {child.age}歳
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  選択数: {selectedChildIds.size} 人
                </p>
              </div>
            )}

            {/* 関連園児表示（編集時のみ） */}
            {isEditMode && parent && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  関連園児
                </h2>
                {parent.children.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">関連園児がいません</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {parent.children.map((child) => (
                      <div
                        key={`${child.nurseryId}-${child.childId}`}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{child.name}</div>
                        <div className="text-sm text-gray-600">
                          {child.className || '未配属'} / {child.age}歳
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-sm text-gray-500">
                  園児の紐付け変更は園児管理画面から行ってください
                </p>
              </div>
            )}

            {/* 通知設定（編集時のみ） */}
            {isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  通知設定
                </h2>
                <div className="space-y-4">
                  {/* プッシュ通知 */}
                  <ToggleSwitch
                    label="プッシュ通知有効"
                    description="アプリのプッシュ通知を有効にします"
                    checked={notificationSettings.pushNotificationsEnabled}
                    onChange={() => handleNotificationToggle('pushNotificationsEnabled')}
                  />

                  {/* 欠席確認通知 */}
                  <ToggleSwitch
                    label="欠席確認通知"
                    description="欠席連絡があった際に通知します"
                    checked={notificationSettings.absenceConfirmationEnabled}
                    onChange={() => handleNotificationToggle('absenceConfirmationEnabled')}
                  />

                  {/* 日報通知 */}
                  <ToggleSwitch
                    label="日報通知"
                    description="新しい日報が公開されたときに通知します"
                    checked={notificationSettings.dailyReportEnabled}
                    onChange={() => handleNotificationToggle('dailyReportEnabled')}
                  />

                  {/* イベント通知 */}
                  <ToggleSwitch
                    label="イベント通知"
                    description="イベントの予定や変更を通知します"
                    checked={notificationSettings.eventNotificationEnabled}
                    onChange={() => handleNotificationToggle('eventNotificationEnabled')}
                  />

                  {/* お知らせ通知 */}
                  <ToggleSwitch
                    label="お知らせ通知"
                    description="お知らせが投稿されたときに通知します"
                    checked={notificationSettings.announcementEnabled}
                    onChange={() => handleNotificationToggle('announcementEnabled')}
                  />
                </div>
              </div>
            )}

            {/* 表示設定（編集時のみ） */}
            {isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  表示設定
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* フォントサイズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      フォントサイズ
                    </label>
                    <select
                      value={displaySettings.fontSize}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, fontSize: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                  </div>

                  {/* 言語 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <select
                      value={displaySettings.language}
                      onChange={(e) => setDisplaySettings(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 有効/無効（編集時のみ） */}
            {isEditMode && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  ステータス
                </h2>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">有効にする</span>
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  無効にすると、この保護者はアプリにログインできなくなります
                </p>
              </div>
            )}
          </div>

          {/* フッター（保存・キャンセルボタン） */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium transition ${
                isSaving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700 active:bg-indigo-800'
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
