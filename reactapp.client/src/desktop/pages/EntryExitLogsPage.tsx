import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getEntryExitLogs, deleteEntryExitLog } from '../../services/entryExitService';
import type { EntryExitLogDto } from '../../services/entryExitService';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';

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
  const { state: authState } = useDesktopAuth();
  const [logs, setLogs] = useState<EntryExitLogDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  // ログ一覧を取得
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!authState.accessToken) {
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

      const response = await getEntryExitLogs(authState.accessToken, params);
      setLogs(response.logs);
      setTotalCount(response.totalCount);
      setHasSearched(true);
    } catch (err: any) {
      console.error('入退ログ取得エラー:', err);
      setError(err.message || '入退ログの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      if (!authState.accessToken) {
        setError('認証情報が見つかりません');
        return;
      }

      await deleteEntryExitLog(deleteTarget.id, authState.accessToken);

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
    const headers = ['日時', '保護者名', '園児名', '入/出'];

    // CSVボディ
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      log.parentName,
      log.childNames.join('/'),
      log.entryType === 'Entry' ? '入' : '出',
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
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">入退ログ管理</h1>
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

          {/* 表示ボタン */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleFilterChange}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  読み込み中...
                </>
              ) : (
                '表示'
              )}
            </button>
          </div>
        </div>

        {/* テーブル */}
        {hasSearched && (
          <div className="bg-white rounded-md shadow-md overflow-hidden">
            {/* CSVエクスポートボタン */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                全 {totalCount} 件{logs.length > 0 && ` 中 ${(currentPage - 1) * pageSize + 1} 〜 ${Math.min(currentPage * pageSize, totalCount)} 件を表示`}
              </p>
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

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      保護者名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      園児名
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      入/出
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.parentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.childNames.join('/')}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-1 justify-end">
                            {/* 削除ボタン */}
                            <button
                              onClick={() => handleDeleteClick(log)}
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

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    fetchLogs();
                  }}
                  disabled={!canGoPrevious}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  前へ
                </button>
                <div className="text-sm text-gray-700">
                  ページ {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    fetchLogs();
                  }}
                  disabled={!canGoNext}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        )}

        {/* 削除確認ダイアログ */}
        {deleteTarget && (
          <>
            {/* オーバーレイ */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={handleCancelDelete}
            />

            {/* モーダル */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                {/* ヘッダー */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">入退ログを削除</h3>
                </div>

                {/* コンテンツ */}
                <div className="px-6 py-6">
                  <p className="text-gray-600 mb-6">
                    本当に入退ログ「{deleteTarget.parentName}」を削除しますか？
                    <br />
                    この操作は取り消せません。
                  </p>

                  {/* ボタン */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancelDelete}
                      disabled={deleteLoading}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deleteLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      {deleteLoading ? '削除中...' : '削除する'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
