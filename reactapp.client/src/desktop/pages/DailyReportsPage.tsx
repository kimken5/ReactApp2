import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { dailyReportService } from '../services/dailyReportService';
import { masterService } from '../services/masterService';
import type { DailyReportDto, DailyReportFilterDto } from '../types/dailyReport';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

/**
 * 日報一覧ページ
 * 日報の表示・検索・削除・公開を行う
 */
export function DailyReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DailyReportDto[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<DailyReportDto | null>(null);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // フィルタ状態
  const [filter, setFilter] = useState<DailyReportFilterDto>({
    childId: undefined,
    classId: undefined,
    staffId: undefined,
    startDate: undefined,
    endDate: undefined,
    category: undefined,
    status: undefined,
    parentAcknowledged: undefined,
    searchKeyword: '',
  });

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  // フィルタ適用
  useEffect(() => {
    applyFilters();
  }, [reports, filter]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [reportsData, childrenData, classesData, staffData] = await Promise.all([
        dailyReportService.getDailyReports(),
        masterService.getChildren(),
        masterService.getClasses(),
        masterService.getStaff(),
      ]);

      setReports(reportsData);
      setChildren(childrenData);
      setClasses(classesData);
      setStaffList(staffData);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrorMessage('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      // APIフィルタが設定されている場合はAPI呼び出し
      const hasApiFilter =
        filter.childId ||
        filter.classId ||
        filter.staffId ||
        filter.startDate ||
        filter.endDate ||
        filter.category ||
        filter.status ||
        filter.parentAcknowledged !== undefined;

      if (hasApiFilter) {
        const filtered = await dailyReportService.getDailyReports(filter);
        setFilteredReports(filtered);
      } else {
        // ローカルフィルタ（キーワード検索のみ）
        let filtered = [...reports];

        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filtered = filtered.filter(
            report =>
              report.childName.toLowerCase().includes(keyword) ||
              report.staffName.toLowerCase().includes(keyword) ||
              report.title.toLowerCase().includes(keyword) ||
              report.content.toLowerCase().includes(keyword) ||
              report.category.toLowerCase().includes(keyword)
          );
        }

        setFilteredReports(filtered);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('フィルタの適用に失敗しました:', error);
      setErrorMessage('フィルタの適用に失敗しました');
    }
  };

  const handleDelete = async (report: DailyReportDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await dailyReportService.deleteDailyReport(report.id);
      setSuccessMessage(`日報「${report.title}」を削除しました`);
      setDeleteConfirmReport(null);
      loadInitialData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('日報の削除に失敗しました:', error);
      setErrorMessage('日報の削除に失敗しました');
      setDeleteConfirmReport(null);
    }
  };

  const handlePublish = async (report: DailyReportDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await dailyReportService.publishDailyReport(report.id);
      setSuccessMessage(`日報「${report.title}」を公開しました`);
      loadInitialData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('日報の公開に失敗しました:', error);
      setErrorMessage('日報の公開に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            下書き
          </span>
        );
      case 'published':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            公開済み
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            アーカイブ済み
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getAcknowledgedBadge = (acknowledged: boolean) => {
    return acknowledged ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        確認済み
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        未確認
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return dateString.split('T')[0]; // YYYY-MM-DD
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

  const isDraft = (status: string) => {
    return status.toLowerCase() === 'draft';
  };

  // ページネーション処理
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">日報管理</h1>
            <p className="text-gray-600">日報の一覧・作成・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/dailyreports/create')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 active:bg-purple-800 transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規作成</span>
          </button>
        </div>

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

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* フィルタ */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 園児選択 */}
            <div>
              <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                園児選択
              </label>
              <select
                id="childId"
                value={filter.childId || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    childId: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                {children.map(child => (
                  <option key={child.childId} value={child.childId}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            {/* クラス選択 */}
            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                クラス選択
              </label>
              <select
                id="classId"
                value={filter.classId || ''}
                onChange={e => setFilter(prev => ({ ...prev, classId: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                {classes.map(classItem => (
                  <option key={classItem.classId} value={classItem.classId}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 職員選択 */}
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                職員選択
              </label>
              <select
                id="staffId"
                value={filter.staffId || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    staffId: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                {staffList.map(staff => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            {/* カテゴリ選択 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ選択
              </label>
              <select
                id="category"
                value={filter.category || ''}
                onChange={e => setFilter(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                <option value="食事">食事</option>
                <option value="睡眠">睡眠</option>
                <option value="排泄">排泄</option>
                <option value="遊び">遊び</option>
                <option value="健康">健康</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 開始日 */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                id="startDate"
                value={filter.startDate || ''}
                onChange={e => setFilter(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* 終了日 */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                id="endDate"
                value={filter.endDate || ''}
                onChange={e => setFilter(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* ステータス選択 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス選択
              </label>
              <select
                id="status"
                value={filter.status || ''}
                onChange={e => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="published">公開済み</option>
                <option value="archived">アーカイブ済み</option>
              </select>
            </div>

            {/* 保護者確認 */}
            <div>
              <label htmlFor="parentAcknowledged" className="block text-sm font-medium text-gray-700 mb-2">
                保護者確認
              </label>
              <select
                id="parentAcknowledged"
                value={
                  filter.parentAcknowledged === undefined
                    ? ''
                    : filter.parentAcknowledged
                      ? 'true'
                      : 'false'
                }
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    parentAcknowledged:
                      e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                <option value="true">確認済み</option>
                <option value="false">未確認</option>
              </select>
            </div>
          </div>

          {/* キーワード検索 */}
          <div>
            <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
              キーワード検索
            </label>
            <input
              type="text"
              id="searchKeyword"
              value={filter.searchKeyword || ''}
              onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="園児名、職員名、タイトル、内容で検索"
            />
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    園児名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    職員名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保護者確認
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      日報が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  currentReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(report.reportDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.childName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.className || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.staffName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{report.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAcknowledgedBadge(report.parentAcknowledged)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => navigate(`/desktop/dailyreports/${report.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => navigate(`/desktop/dailyreports/edit/${report.id}`)}
                          disabled={isPublishedOrArchived(report.status)}
                          className={`font-medium ${
                            isPublishedOrArchived(report.status)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-purple-600 hover:text-purple-800'
                          }`}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => setDeleteConfirmReport(report)}
                          disabled={isPublishedOrArchived(report.status)}
                          className={`font-medium ${
                            isPublishedOrArchived(report.status)
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          削除
                        </button>
                        {isDraft(report.status) && (
                          <button
                            onClick={() => handlePublish(report)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            公開
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                全 {filteredReports.length} 件中 {startIndex + 1} ～{' '}
                {Math.min(endIndex, filteredReports.length)} 件を表示
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        currentPage === i + 1
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirmReport && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirmReport(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">日報を削除</h3>
              <p className="text-gray-600 mb-6">
                本当に日報「{deleteConfirmReport.title}」を削除しますか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmReport)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
