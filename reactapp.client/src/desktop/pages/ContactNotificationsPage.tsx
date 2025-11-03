import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { contactNotificationService } from '../services/contactNotificationService';
import { masterService } from '../services/masterService';
import type { ContactNotificationDto, ContactNotificationFilterDto } from '../types/contactNotification';
import type { ClassDto } from '../types/master';

/**
 * 連絡通知一覧ページ（デスクトップアプリ用）
 * 保護者からの欠席・遅刻・お迎え連絡の管理
 */
export function ContactNotificationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [notifications, setNotifications] = useState<ContactNotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // モーダル関連
  const [selectedNotification, setSelectedNotification] = useState<ContactNotificationDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // マスタデータ
  const [classes, setClasses] = useState<ClassDto[]>([]);

  // 今日の日付を取得 (YYYY-MM-DD形式)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // フィルタ状態（デフォルトで今日の日付をセット）
  const [filters, setFilters] = useState<ContactNotificationFilterDto>({
    startDate: getTodayString(),
    endDate: undefined,
    notificationType: undefined,
    status: undefined,
    classId: undefined,
    searchKeyword: '',
    acknowledgedByAdminUser: undefined,
  });

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 初期データ読み込み（マスタデータと本日のデータ）
  useEffect(() => {
    loadMasterData();
    // 初回は本日のデータを自動的に取得
    loadNotifications();
  }, [isDemoMode]);

  // フィルター変更時に自動的にデータを取得（検索キーワード以外）
  useEffect(() => {
    if (hasSearched) {
      loadNotifications();
    }
  }, [
    filters.startDate,
    filters.endDate,
    filters.notificationType,
    filters.status,
    filters.classId,
    filters.acknowledgedByAdminUser,
    isDemoMode
  ]);

  const loadMasterData = async () => {
    try {
      if (!isDemoMode) {
        const classesData = await masterService.getClasses();
        setClasses(classesData);
      }
    } catch (error) {
      console.error('マスタデータの取得に失敗しました:', error);
      setErrorMessage('マスタデータの取得に失敗しました');
    }
  };

  const loadDemoData = () => {
    const demoNotifications: ContactNotificationDto[] = [
      {
        id: 1,
        parentId: 1,
        parentName: '田中 太郎',
        nurseryId: 1,
        childId: 1,
        childName: '田中 花子',
        className: 'さくら組',
        notificationType: 'absence',
        ymd: '2025-10-30',
        expectedArrivalTime: undefined,
        reason: 'illness',
        additionalNotes: '風邪のため欠席します',
        submittedAt: '2025-10-29T20:30:00',
        status: 'submitted',
        staffResponse: undefined,
        acknowledgedAt: undefined,
        acknowledgedBy: undefined,
        acknowledgedByAdminUser: false,
        respondedByStaffId: undefined,
        respondedByStaffName: undefined,
        acknowledgedByAdminAt: undefined,
        latestResponse: undefined,
      },
      {
        id: 2,
        parentId: 2,
        parentName: '佐藤 美咲',
        nurseryId: 1,
        childId: 2,
        childName: '佐藤 健太',
        className: 'ひまわり組',
        notificationType: 'lateness',
        ymd: '2025-10-30',
        expectedArrivalTime: '10:00:00',
        reason: 'appointment',
        additionalNotes: '病院の予約があるため10時頃到着予定です',
        submittedAt: '2025-10-29T18:15:00',
        status: 'acknowledged',
        staffResponse: '承知しました。お気をつけてお越しください。',
        acknowledgedAt: '2025-10-29T19:00:00',
        acknowledgedBy: 1,
        acknowledgedByAdminUser: true,
        respondedByStaffId: 1,
        respondedByStaffName: '山田 先生',
        acknowledgedByAdminAt: '2025-10-29T19:00:00',
        latestResponse: undefined,
      },
      {
        id: 3,
        parentId: 3,
        parentName: '鈴木 一郎',
        nurseryId: 1,
        childId: 3,
        childName: '鈴木 愛美',
        className: 'さくら組',
        notificationType: 'pickup',
        ymd: '2025-10-30',
        expectedArrivalTime: '15:00:00',
        reason: 'family_event',
        additionalNotes: '祖父母宅に行くため早めのお迎えです',
        submittedAt: '2025-10-29T07:45:00',
        status: 'acknowledged',
        staffResponse: '了解しました',
        acknowledgedAt: '2025-10-29T08:30:00',
        acknowledgedBy: 2,
        acknowledgedByAdminUser: true,
        respondedByStaffId: 2,
        respondedByStaffName: '佐々木 先生',
        acknowledgedByAdminAt: '2025-10-29T08:30:00',
        latestResponse: undefined,
      },
    ];

    setNotifications(demoNotifications);
    setIsLoading(false);
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await contactNotificationService.getContactNotifications(filters);
      setNotifications(data);
      setHasSearched(true);
    } catch (error: any) {
      console.error('連絡通知の取得に失敗:', error);
      setErrorMessage('連絡通知の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || undefined }));
    setCurrentPage(1);
  };

  const handleSearchKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, searchKeyword: value }));
    // 検索キーワードの変更では自動検索しない
  };

  const handleSearchKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      loadNotifications();
    }
  };

  const handleDateClear = () => {
    setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
    setCurrentPage(1);
  };

  const handleInitialSearch = () => {
    loadNotifications();
  };

  // フィルタリセット
  const handleResetFilters = () => {
    setFilters({
      startDate: getTodayString(),
      endDate: undefined,
      notificationType: undefined,
      status: undefined,
      classId: undefined,
      searchKeyword: '',
      acknowledgedByAdminUser: undefined,
    });
    setCurrentPage(1);
  };

  const handleAcknowledge = async (id: number) => {
    try {
      if (isDemoMode) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === id
              ? {
                  ...n,
                  acknowledgedByAdminUser: true,
                  acknowledgedByAdminAt: new Date().toISOString(),
                  status: 'acknowledged',
                }
              : n
          )
        );
        setSuccessMessage('連絡を確認しました');
        return;
      }

      await contactNotificationService.acknowledgeNotification(id, {});
      setSuccessMessage('連絡を確認しました');
      loadNotifications();
    } catch (error: any) {
      console.error('確認処理に失敗:', error);
      setErrorMessage('確認処理に失敗しました');
    }
  };

  const handleViewDetail = (notification: ContactNotificationDto) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedNotification(null);
    setShowDetailModal(false);
  };

  // ページネーション用にフィルタ済みデータをそのまま使用（バックエンドでフィルタ済み）
  const filteredNotifications = notifications;

  // ページネーション
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'absence':
        return '欠席';
      case 'lateness':
        return '遅刻';
      case 'pickup':
        return 'お迎え';
      default:
        return type;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'illness':
        return '体調不良';
      case 'appointment':
        return '通院';
      case 'family_event':
        return '家庭の都合';
      case 'other':
        return 'その他';
      default:
        return reason;
    }
  };

  const getStatusBadge = (notification: ContactNotificationDto) => {
    if (notification.acknowledgedByAdminUser) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          確認済み
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        未確認
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">連絡通知管理</h1>
            <p className="text-gray-600 mt-2">保護者からの欠席・遅刻・お迎え連絡の確認と返信</p>
          </div>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
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

        {/* フィルタ・検索バー */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 日付 */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                日付
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate || ''}
                  onChange={handleFilterChange}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                />
{filters.startDate && (
                  <button
                    type="button"
                    onClick={handleDateClear}
                    className="px-2 py-2 bg-gray-50 text-gray-500 rounded border border-gray-300 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="日付クリア"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* クラス選択 */}
            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                クラス
              </label>
              <select
                id="classId"
                name="classId"
                value={filters.classId || ''}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                {classes.map(classItem => (
                  <option key={classItem.classId} value={classItem.classId}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 連絡種別 */}
            <div>
              <label htmlFor="notificationType" className="block text-sm font-medium text-gray-700 mb-2">
                連絡種別
              </label>
              <select
                id="notificationType"
                name="notificationType"
                value={filters.notificationType || ''}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                <option value="absence">欠席</option>
                <option value="lateness">遅刻</option>
                <option value="pickup">お迎え</option>
              </select>
            </div>

            {/* ステータス */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                value={filters.status || ''}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                <option value="submitted">未確認</option>
                <option value="acknowledged">確認済み</option>
                <option value="processed">処理済み</option>
              </select>
            </div>
          </div>

          {/* 検索キーワードとリセットボタン */}
          <div className="md:col-span-2">
            <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
              検索キーワード
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="searchKeyword"
                name="searchKeyword"
                value={filters.searchKeyword}
                onChange={handleSearchKeywordChange}
                onKeyDown={handleSearchKeywordKeyDown}
                placeholder="保護者名・園児名で検索"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              />
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium text-sm whitespace-nowrap"
              >
                フィルタをリセット
              </button>
            </div>
          </div>
        </div>

        {/* 連絡通知一覧 */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : currentNotifications.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-4 text-gray-500">連絡通知がありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      園児名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      保護者名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      理由
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentNotifications.map(notification => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(notification.ymd).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {getNotificationTypeLabel(notification.notificationType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.childName}
                        {notification.className && (
                          <span className="ml-2 text-xs text-gray-500">({notification.className})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.parentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getReasonLabel(notification.reason)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(notification)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-1">
                          {/* 詳細ボタン */}
                          <button
                            onClick={() => handleViewDetail(notification)}
                            className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                            title="詳細"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              詳細
                            </span>
                          </button>
                          {/* 確認ボタン */}
                          {!notification.acknowledgedByAdminUser && (
                            <button
                              onClick={() => handleAcknowledge(notification.id)}
                              className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                              title="確認"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                確認
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{startIndex + 1}</span> から{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredNotifications.length)}
                    </span>{' '}
                    件を表示 （全 <span className="font-medium">{filteredNotifications.length}</span> 件）
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">前へ</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">次へ</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 詳細モーダル */}
        {showDetailModal && selectedNotification && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={handleCloseDetailModal}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* モーダルヘッダー */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">連絡通知詳細</h2>
                <button
                  onClick={handleCloseDetailModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* モーダルコンテンツ */}
              <div className="p-6 space-y-6">
                {/* ステータス */}
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mr-2">
                      {getNotificationTypeLabel(selectedNotification.notificationType)}
                    </span>
                    {selectedNotification.acknowledgedByAdminUser ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        確認済み
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        未確認
                      </span>
                    )}
                  </div>
                  {!selectedNotification.acknowledgedByAdminUser && (
                    <button
                      onClick={() => {
                        handleAcknowledge(selectedNotification.id);
                        handleCloseDetailModal();
                      }}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                    >
                      確認済みにする
                    </button>
                  )}
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">対象日</label>
                    <p className="text-gray-900">{new Date(selectedNotification.ymd).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">提出日時</label>
                    <p className="text-gray-900">
                      {new Date(selectedNotification.submittedAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">園児名</label>
                    <p className="text-gray-900">
                      {selectedNotification.childName}
                      {selectedNotification.className && (
                        <span className="ml-2 text-sm text-gray-500">({selectedNotification.className})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">保護者名</label>
                    <p className="text-gray-900">{selectedNotification.parentName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">理由</label>
                    <p className="text-gray-900">{getReasonLabel(selectedNotification.reason)}</p>
                  </div>
                  {selectedNotification.expectedArrivalTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">予定時刻</label>
                      <p className="text-gray-900">{selectedNotification.expectedArrivalTime}</p>
                    </div>
                  )}
                </div>

                {/* 備考 */}
                {selectedNotification.additionalNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">備考</label>
                    <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                      {selectedNotification.additionalNotes}
                    </p>
                  </div>
                )}

                {/* 返信情報 */}
                {selectedNotification.latestResponse && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">スタッフ返信</label>
                    <div className="bg-gray-50 rounded-md p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedNotification.latestResponse.staffName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(selectedNotification.latestResponse.responseAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {selectedNotification.latestResponse.responseType}
                        </span>
                      </div>
                      {selectedNotification.latestResponse.responseMessage && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                          {selectedNotification.latestResponse.responseMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* モーダルフッター */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
