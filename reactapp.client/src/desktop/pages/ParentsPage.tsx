import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ParentDto, ParentFilterDto, ClassDto } from '../types/master';
import { ParentEditModal } from '../components/parents/ParentEditModal';

/**
 * 電話番号を XXX-XXXX-XXXX 形式にフォーマット
 * 11桁の数字の場合のみフォーマットを適用
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // ハイフンや空白を除去
  const cleaned = phoneNumber.replace(/[-\s]/g, '');

  // 11桁の数字の場合のみフォーマット
  if (/^\d{11}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }

  // それ以外はそのまま返す
  return phoneNumber;
};

// デモデータ
const DEMO_PARENTS: ParentDto[] = [
  {
    id: 1,
    name: '田中 太郎',
    phoneNumber: '090-1234-5678',
    email: 'tanaka.taro@example.com',
    relationship: '父',
    isActive: true,
    lastLoginAt: '2025-10-20T09:30:00',
    children: [
      { nurseryId: 'sakura', childId: 'child001', name: '田中 花子', className: 'さくら組' },
      { nurseryId: 'sakura', childId: 'child002', name: '田中 次郎', className: 'ひまわり組' },
    ],
  },
  {
    id: 2,
    name: '佐藤 美咲',
    phoneNumber: '090-2345-6789',
    email: 'sato.misaki@example.com',
    relationship: '母',
    isActive: true,
    lastLoginAt: '2025-10-25T14:20:00',
    children: [
      { nurseryId: 'sakura', childId: 'child003', name: '佐藤 健太', className: 'たんぽぽ組' },
    ],
  },
  {
    id: 3,
    name: '鈴木 一郎',
    phoneNumber: '090-3456-7890',
    email: 'suzuki.ichiro@example.com',
    relationship: '父',
    isActive: true,
    lastLoginAt: '2025-10-24T18:45:00',
    children: [
      { nurseryId: 'sakura', childId: 'child004', name: '鈴木 愛美', className: 'さくら組' },
    ],
  },
  {
    id: 4,
    name: '高橋 由美',
    phoneNumber: '090-4567-8901',
    email: 'takahashi.yumi@example.com',
    relationship: '母',
    isActive: true,
    lastLoginAt: '2025-10-26T07:15:00',
    children: [
      { nurseryId: 'sakura', childId: 'child005', name: '高橋 翔太', className: 'ひまわり組' },
      { nurseryId: 'sakura', childId: 'child006', name: '高橋 美羽', className: 'たんぽぽ組' },
    ],
  },
  {
    id: 5,
    name: '伊藤 健二',
    phoneNumber: '090-5678-9012',
    email: 'ito.kenji@example.com',
    relationship: '父',
    isActive: true,
    lastLoginAt: '2025-10-23T12:00:00',
    children: [
      { nurseryId: 'sakura', childId: 'child007', name: '伊藤 優奈', className: 'さくら組' },
    ],
  },
  {
    id: 6,
    name: '渡辺 真由美',
    phoneNumber: '090-6789-0123',
    email: 'watanabe.mayumi@example.com',
    relationship: '母',
    isActive: true,
    lastLoginAt: '2025-10-22T16:30:00',
    children: [
      { nurseryId: 'sakura', childId: 'child008', name: '渡辺 大輝', className: 'ひまわり組' },
    ],
  },
  {
    id: 7,
    name: '山本 隆',
    phoneNumber: '090-7890-1234',
    email: 'yamamoto.takashi@example.com',
    relationship: '祖父',
    isActive: true,
    lastLoginAt: '2025-10-21T10:00:00',
    children: [
      { nurseryId: 'sakura', childId: 'child009', name: '山本 結衣', className: 'たんぽぽ組' },
    ],
  },
  {
    id: 8,
    name: '中村 恵子',
    phoneNumber: '090-8901-2345',
    email: 'nakamura.keiko@example.com',
    relationship: '祖母',
    isActive: true,
    lastLoginAt: '2025-10-19T08:45:00',
    children: [
      { nurseryId: 'sakura', childId: 'child010', name: '中村 陽斗', className: 'さくら組' },
    ],
  },
  {
    id: 9,
    name: '小林 修',
    phoneNumber: '090-9012-3456',
    email: 'kobayashi.osamu@example.com',
    relationship: '父',
    isActive: true,
    lastLoginAt: '2025-10-20T13:20:00',
    children: [
      { nurseryId: 'sakura', childId: 'child011', name: '小林 彩花', className: 'ひまわり組' },
    ],
  },
  {
    id: 10,
    name: '加藤 美穂',
    phoneNumber: '090-0123-4567',
    email: 'kato.miho@example.com',
    relationship: '母',
    isActive: true,
    lastLoginAt: '2025-10-18T15:10:00',
    children: [
      { nurseryId: 'sakura', childId: 'child012', name: '加藤 蓮', className: 'たんぽぽ組' },
    ],
  },
  {
    id: 11,
    name: '吉田 誠',
    phoneNumber: '090-1111-2222',
    email: 'yoshida.makoto@example.com',
    relationship: '父',
    isActive: false,
    lastLoginAt: '2025-09-15T11:00:00',
    children: [
      { nurseryId: 'sakura', childId: 'child013', name: '吉田 桜', className: 'さくら組' },
    ],
  },
  {
    id: 12,
    name: '山田 千春',
    phoneNumber: '090-2222-3333',
    email: 'yamada.chiharu@example.com',
    relationship: '母',
    isActive: true,
    lastLoginAt: '2025-10-26T06:30:00',
    children: [
      { nurseryId: 'sakura', childId: 'child014', name: '山田 悠斗', className: 'ひまわり組' },
      { nurseryId: 'sakura', childId: 'child015', name: '山田 莉子', className: 'さくら組' },
    ],
  },
];

/**
 * 保護者一覧ページ
 * フィルタ、検索、編集、削除機能を提供
 */
export function ParentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [parents, setParents] = useState<ParentDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集モーダル状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParentId, setEditingParentId] = useState<number | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<{
    classId?: string;
    childGraduationStatus?: string;
    searchKeyword?: string;
  }>({
    classId: undefined,
    childGraduationStatus: undefined, // デフォルトは「全て」に変更（園児と紐づきのない保護者も表示）
    searchKeyword: undefined,
  });

  // 初期データ読み込み
  useEffect(() => {
    loadClasses();
  }, [isDemoMode]);

  // データ読み込み
  useEffect(() => {
    loadParents();
  }, [filter.classId, filter.childGraduationStatus, isDemoMode]);

  const loadClasses = async () => {
    try {
      if (isDemoMode) {
        // デモモード: ダミーのクラスデータ
        setClasses([
          { classId: 'sakura', name: 'さくら組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
          { classId: 'himawari', name: 'ひまわり組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
          { classId: 'tanpopo', name: 'たんぽぽ組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        ]);
      } else {
        const classesData = await masterService.getClasses({ isActive: true });
        setClasses(classesData);
      }
    } catch (err) {
      console.error('クラス一覧の取得に失敗しました:', err);
    }
  };

  const loadParents = async () => {
    console.log('loadParents called with filter:', filter);
    try {
      setIsLoading(true);
      setError(null);

      if (isDemoMode) {
        // デモモード: フィルタを適用してデモデータを返す
        await new Promise(resolve => setTimeout(resolve, 300));
        let filteredData = [...DEMO_PARENTS];

        // 園児ステータスでフィルタ（園児のGraduationStatusを確認）
        if (filter.childGraduationStatus) {
          // 注意: デモデータには園児のGraduationStatusが含まれていないため、
          // 実際の実装では全て表示する
          // 本番環境では、children配列の各園児のstatusをチェックする必要がある
        }

        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filteredData = filteredData.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.phoneNumber.includes(keyword) ||
            (p.email && p.email.toLowerCase().includes(keyword))
          );
        }

        setParents(filteredData);
      } else {
        const data = await masterService.getParents(filter);
        console.log('保護者データ取得:', data.length, '件');
        setParents(data);
      }
    } catch (err) {
      console.error('保護者一覧の取得に失敗しました:', err);
      setError('保護者一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタ変更ハンドラ
  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // 検索キーワード変更ハンドラ
  const handleSearchKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilter(prev => ({ ...prev, searchKeyword: value || undefined }));
    // 検索キーワードの変更では自動検索しない
  };

  const handleSearchKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isDemoMode) {
        loadParents();
      }
    }
  };

  // フィルタリセット
  const handleResetFilter = async () => {
    const resetFilter = {
      classId: undefined,
      childGraduationStatus: undefined, // リセット時も「全て」に変更（園児と紐づきのない保護者も表示）
      searchKeyword: undefined,
    };
    setFilter(resetFilter);

    // リセット後、すぐに検索を実行
    if (!isDemoMode) {
      try {
        setIsLoading(true);
        setError(null);

        const data = await masterService.getParents(resetFilter);
        setParents(data);
      } catch (error: any) {
        console.error('保護者一覧の取得に失敗しました:', error);
        setError('保護者一覧の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 削除処理
  const handleDelete = async (parentId: number, parentName: string) => {
    if (!confirm(`保護者「${parentName || '(名前未登録)'}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await masterService.deleteParent(parentId);
      loadParents();
    } catch (err) {
      console.error('削除に失敗しました:', err);
      alert('削除に失敗しました');
    }
  };

  // 編集モーダル開く
  const handleEdit = (parentId: number) => {
    setEditingParentId(parentId);
    setIsEditModalOpen(true);
  };

  // 編集モーダル閉じる
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingParentId(null);
  };

  // 編集成功
  const handleEditSuccess = () => {
    console.log('handleEditSuccess called');
    setIsEditModalOpen(false);
    setEditingParentId(null);
    console.log('Calling loadParents...');
    loadParents();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">保護者管理</h1>
            <p className="text-gray-600 mt-2">保護者情報の登録・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/parents/create')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        </div>

        {/* フィルタセクション */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* クラスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">クラス</label>
              <select
                value={filter.classId || ''}
                onChange={(e) => handleFilterChange('classId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              >
                <option value="">すべて</option>
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 園児ステータスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">園児ステータス</label>
              <select
                value={filter.childGraduationStatus || ''}
                onChange={(e) => handleFilterChange('childGraduationStatus', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              >
                <option value="">全て</option>
                <option value="Active">在籍中</option>
                <option value="Graduated">卒園済み</option>
                <option value="Withdrawn">退園</option>
              </select>
            </div>
          </div>

          {/* 検索バー */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={filter.searchKeyword || ''}
                onChange={handleSearchKeywordChange}
                onKeyDown={handleSearchKeywordKeyDown}
                placeholder="氏名、電話番号、メールアドレスで検索（ENTERキーで検索）..."
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              />
            </div>
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              フィルタをリセット
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md shadow-md">
            {error}
          </div>
        )}

        {/* 保護者一覧テーブル */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        氏名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        電話番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        関連園児
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          保護者が見つかりませんでした
                        </td>
                      </tr>
                    ) : (
                      parents.map((parent) => (
                        <tr key={parent.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parent.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatPhoneNumber(parent.phoneNumber)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {parent.children.length > 0 ? (
                              <div className="max-w-xs">
                                {parent.children.map((child, idx) => (
                                  <span key={`${child.nurseryId}-${child.childId}`} className="inline-block mr-2 mb-1">
                                    {child.name}
                                    {child.className && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({child.className})
                                      </span>
                                    )}
                                    {idx < parent.children.length - 1 && ','}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">園児未登録</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {parent.lastLoginAt
                              ? (() => {
                                  const date = new Date(parent.lastLoginAt);
                                  const yy = String(date.getFullYear()).slice(-2);
                                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                                  const dd = String(date.getDate()).padStart(2, '0');
                                  const hh = String(date.getHours()).padStart(2, '0');
                                  const min = String(date.getMinutes()).padStart(2, '0');
                                  return `${yy}/${mm}/${dd} ${hh}:${min}`;
                                })()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {String(parent.id).padStart(6, '0')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-1">
                              {/* 編集ボタン */}
                              <button
                                onClick={() => handleEdit(parent.id)}
                                className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                                title="編集"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  編集
                                </span>
                              </button>

                              {/* 削除ボタン */}
                              <button
                                onClick={() => handleDelete(parent.id, parent.name || '')}
                                className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                                title="削除"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  削除
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* 件数表示 */}
        {!isLoading && (
          <div className="text-sm text-gray-600 text-center">
            全 {parents.length} 件の保護者
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editingParentId && (
        <ParentEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          parentId={editingParentId}
        />
      )}
    </DashboardLayout>
  );
}
