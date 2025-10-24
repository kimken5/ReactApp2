import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ParentDto, ParentFilterDto } from '../types/master';

/**
 * 保護者一覧ページ
 * フィルタ、検索、編集、削除機能を提供
 */
export function ParentsPage() {
  const navigate = useNavigate();

  const [parents, setParents] = useState<ParentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<ParentFilterDto>({
    classId: undefined,
    isActive: true,
    searchKeyword: undefined,
  });

  // データ読み込み
  useEffect(() => {
    loadParents();
  }, [filter]);

  const loadParents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await masterService.getParents(filter);
      setParents(data);
    } catch (err) {
      console.error('保護者一覧の取得に失敗しました:', err);
      setError('保護者一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタ変更ハンドラ
  const handleFilterChange = (key: keyof ParentFilterDto, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // 検索実行
  const handleSearch = (keyword: string) => {
    setFilter(prev => ({ ...prev, searchKeyword: keyword || undefined }));
  };

  // フィルタリセット
  const handleResetFilter = () => {
    setFilter({
      classId: undefined,
      isActive: true,
      searchKeyword: undefined,
    });
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
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        </div>

        {/* フィルタセクション */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* クラスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">クラス</label>
              <input
                type="text"
                value={filter.classId || ''}
                onChange={(e) => handleFilterChange('classId', e.target.value || undefined)}
                placeholder="例: sakura, himawari"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* ステータスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={filter.isActive === undefined ? '' : filter.isActive.toString()}
                onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全て</option>
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>
          </div>

          {/* 検索バー */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={filter.searchKeyword || ''}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="氏名、電話番号、メールアドレスで検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              フィルタリセット
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ローディング */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 保護者一覧テーブル */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        保護者ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        氏名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        電話番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        関連園児
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          保護者が見つかりませんでした
                        </td>
                      </tr>
                    ) : (
                      parents.map((parent) => (
                        <tr key={parent.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {parent.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parent.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {parent.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {parent.email || '-'}
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
                              ? new Date(parent.lastLoginAt).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                parent.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {parent.isActive ? '有効' : '無効'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/desktop/parents/edit/${parent.id}`)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDelete(parent.id, parent.name || '')}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 件数表示 */}
            <div className="text-sm text-gray-600 text-center">
              全 {parents.length} 件の保護者
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
