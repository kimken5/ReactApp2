import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getEntryExitLogs, deleteEntryExitLog } from '../../services/entryExitService';
import type { EntryExitLogDto } from '../../services/entryExitService';

/**
 * 入退ログ管理画面
 * URL: /desktop/entry-exit-logs
 * 保育園スタッフが入退ログを閲覧・検索・削除する画面
 */

interface FilterState {
  fromDate: string;
  toDate: string;
  parentName: string;
  entryType: '' | 'Entry' | 'Exit';
}

export function EntryExitLogsPage() {
  const [logs, setLogs] = useState<EntryExitLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState<FilterState>({
    fromDate: '',
    toDate: '',
    parentName: '',
    entryType: '',
  });

  // 削除確認ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<EntryExitLogDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // デスクトップ認証トークンを取得
  const getAuthToken = (): string | null => {
    const authData = localStorage.getItem('desktop_auth');
    if (!authData) return null;
    const parsed = JSON.parse(authData);
    return parsed.token || null;
  };

  // ログ一覧を取得
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('認証情報が見つかりません。再ログインしてください。');
        setLoading(false);
        return;
      }

      const params: any = {
        page: currentPage,
        pageSize: pageSize,
      };

      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.parentName) params.parentName = filters.parentName;
      if (filters.entryType) params.entryType = filters.entryType;

      const response = await getEntryExitLogs(token, params);
      setLogs(response.logs);
      setTotalCount(response.totalCount);
    } catch (err: any) {
      console.error('入退ログ取得エラー:', err);
      setError(err.message || '入退ログの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  // フィルター変更時（ページを1にリセット）
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      parentName: '',
      entryType: '',
    });
    setCurrentPage(1);
    setTimeout(() => fetchLogs(), 0);
  };

  // 削除確認ダイアログを開く
  const handleDeleteClick = (log: EntryExitLogDto) => {
    setDeleteTarget(log);
  };

  // 削除確認ダイアログを閉じる
  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  // 削除実行
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError('認証情報が見つかりません');
        return;
      }

      await deleteEntryExitLog(deleteTarget.id, token);

      // 削除成功後、一覧を再取得
      setDeleteTarget(null);
      await fetchLogs();
    } catch (err: any) {
      console.error('削除エラー:', err);
      setError(err.message || '削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    // CSVヘッダー
    const headers = ['日時', '保護者名', '園児名', '入/出', 'ID'];

    // CSVボディ
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('ja-JP'),
      log.parentName,
      log.childNames.join(', '),
      log.entryType === 'Entry' ? '入' : '出',
      log.id.toString(),
    ]);

    // CSV文字列を生成
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // BOM付きでダウンロード（Excelで文字化け防止）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `入退ログ_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ページネーション
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">入退ログ管理</h1>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSVエクスポート
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* フィルター */}
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">検索条件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 開始日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 終了日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 保護者名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保護者名
              </label>
              <input
                type="text"
                value={filters.parentName}
                onChange={(e) => setFilters({ ...filters, parentName: e.target.value })}
                placeholder="部分一致検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 入退種別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                入/出
              </label>
              <select
                value={filters.entryType}
                onChange={(e) => setFilters({ ...filters, entryType: e.target.value as '' | 'Entry' | 'Exit' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">すべて</option>
                <option value="Entry">入</option>
                <option value="Exit">出</option>
              </select>
            </div>
          </div>

          {/* フィルターボタン */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleFilterChange}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              検索
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              クリア
            </button>
          </div>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        )}

        {/* テーブル */}
        {!loading && (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        保護者名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        園児名
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        入/出
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          データがありません
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.timestamp).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.parentName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {log.childNames.join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                log.entryType === 'Entry'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.entryType === 'Entry' ? '入' : '出'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteClick(log)}
                              className="text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  全 {totalCount} 件中 {(currentPage - 1) * pageSize + 1} 〜{' '}
                  {Math.min(currentPage * pageSize, totalCount)} 件を表示
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  >
                    前へ
                  </button>
                  <div className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!canGoNext}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 削除確認ダイアログ */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">削除確認</h3>
              <p className="text-gray-700 mb-6">
                以下のログを削除してもよろしいですか？
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">日時:</span>{' '}
                  {new Date(deleteTarget.timestamp).toLocaleString('ja-JP')}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">保護者:</span> {deleteTarget.parentName}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">入/出:</span>{' '}
                  {deleteTarget.entryType === 'Entry' ? '入' : '出'}
                </div>
              </div>
              <p className="text-sm text-red-600 mb-6">
                ※ この操作は取り消せません
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
