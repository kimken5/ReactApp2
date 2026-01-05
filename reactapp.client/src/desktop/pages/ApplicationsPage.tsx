/**
 * 入園申込管理ページ
 */

import React, { useState, useEffect } from 'react';
import { MdKey } from 'react-icons/md';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getApplicationList } from '../../services/desktopApplicationService';
import type {
  ApplicationListItemDto,
  ApplicationStatus,
  GetApplicationListParams,
  PaginatedResult,
} from '../../types/desktopApplication';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_ICONS,
} from '../../types/desktopApplication';
import { ApplicationDetailModal } from '../components/application/ApplicationDetailModal';
import { ImportApplicationModal } from '../components/application/ImportApplicationModal';
import { RejectApplicationModal } from '../components/application/RejectApplicationModal';
import ApplicationKeyModal from '../components/settings/ApplicationKeyModal';

/**
 * 年齢を計算する関数
 * @param birthDate 生年月日（ISO形式文字列）
 * @returns "X歳Yか月" 形式の文字列
 */
function calculateAge(birthDate: string): string {
  if (!birthDate) return '';

  const birth = new Date(birthDate);
  const today = new Date();

  // 無効な日付の場合
  if (isNaN(birth.getTime())) {
    return '';
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  // 日にちも考慮して月数を調整
  if (today.getDate() < birth.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years}歳${months}か月`;
}

/**
 * 生年月日をフォーマットする関数
 * @param birthDate 生年月日（ISO形式文字列）
 * @returns "YYYY/MM/DD" 形式の文字列
 */
function formatBirthDate(birthDate: string): string {
  if (!birthDate) return '';

  const date = new Date(birthDate);

  // 無効な日付の場合
  if (isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

/**
 * 申込日時をフォーマットする関数
 * @param dateString 日時（ISO形式文字列）
 * @returns "YY/MM/DD HH:MM" 形式の文字列
 */
function formatApplicationDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  // 無効な日付の場合
  if (isNaN(date.getTime())) {
    return '';
  }

  const year = String(date.getFullYear()).slice(-2); // 下2桁
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 続柄の英語値を日本語に変換するマッピング
 */
const RELATIONSHIP_LABEL_MAP: Record<string, string> = {
  'Father': '父',
  'Mother': '母',
  'Grandfather': '祖父',
  'Grandmother': '祖母',
  'Other': 'その他',
};

/**
 * 続柄を日本語に変換する関数
 * @param relationship 続柄（英語値）
 * @returns 日本語の続柄
 */
function formatRelationship(relationship: string): string {
  return RELATIONSHIP_LABEL_MAP[relationship] || relationship;
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginatedResult<ApplicationListItemDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // フィルター・検索状態
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // モーダル状態
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isApplicationKeyModalOpen, setIsApplicationKeyModalOpen] = useState(false);

  // データ取得
  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params: GetApplicationListParams = {
        page: currentPage,
        pageSize,
        status: statusFilter,
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await getApplicationList(params);
      setApplications(result.items || []);
      setPagination(result);
    } catch (err) {
      setApplications([]);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('申込一覧の取得に失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード・フィルター変更時
  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter, searchQuery]);

  // 検索実行
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  // 詳細表示
  const handleShowDetail = (id: number) => {
    setSelectedApplicationId(id);
    setShowDetailModal(true);
  };

  // インポート表示
  const handleShowImport = (id: number) => {
    setSelectedApplicationId(id);
    setShowImportModal(true);
  };

  // 却下表示
  const handleShowReject = (id: number) => {
    setSelectedApplicationId(id);
    setShowRejectModal(true);
  };

  // インポート成功
  const handleImportSuccess = () => {
    setShowImportModal(false);
    setSelectedApplicationId(null);
    fetchApplications();
  };

  // 却下成功
  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    setSelectedApplicationId(null);
    fetchApplications();
  };

  // ステータスバッジ
  const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
    const colorClass = APPLICATION_STATUS_COLORS[status];
    const label = APPLICATION_STATUS_LABELS[status];
    const icon = APPLICATION_STATUS_ICONS[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <span className="mr-1">{icon}</span>
        {label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">入園申込管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            保護者からの入園申込を確認し、インポートまたは却下します。
          </p>
        </div>
        <button
          onClick={() => setIsApplicationKeyModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
        >
          <MdKey className="text-xl" />
          入園申込キー管理
        </button>
      </div>

      {/* フィルター・検索 */}
      <div className="mb-6 bg-white shadow-md rounded-md p-4">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ApplicationStatus | 'All');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">全て</option>
              <option value="Pending">保留中</option>
              <option value="Imported">取込済</option>
              <option value="Rejected">却下済</option>
            </select>
          </div>

          <div className="flex-[2]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              検索（申請者名、園児名、電話番号）
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          >
            検索
          </button>
        </form>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white shadow-md rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">申込がありません</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請者名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    続柄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    携帯電話
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申込日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    重複
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    園児名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生年月日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.applicationStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.applicantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRelationship(app.relationshipToChild)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.mobilePhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatApplicationDate(app.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {app.applicationStatus === 'Imported' || app.applicationStatus === 'Rejected' ? (
                        <span className="text-gray-400">-</span>
                      ) : app.hasDuplicateParent ? (
                        <span className="text-orange-600 font-medium">⚠️ あり</span>
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.childFamilyName} {app.childFirstName}（{calculateAge(app.childDateOfBirth)}）
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatBirthDate(app.childDateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        {/* 詳細ボタン */}
                        <button
                          onClick={() => handleShowDetail(app.id)}
                          className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                          title="詳細"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            詳細
                          </span>
                        </button>

                        {app.applicationStatus === 'Pending' && (
                          <>
                            {/* インポートボタン */}
                            <button
                              onClick={() => handleShowImport(app.id)}
                              className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                              title="インポート"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                インポート
                              </span>
                            </button>

                            {/* 却下ボタン */}
                            <button
                              onClick={() => handleShowReject(app.id)}
                              className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                              title="却下"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                却下
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{pagination.totalCount}</span> 件中{' '}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> -{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, pagination.totalCount)}
                      </span>{' '}
                      件を表示
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        前へ
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        次へ
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* モーダル */}
      {showDetailModal && selectedApplicationId && (
        <ApplicationDetailModal
          applicationId={selectedApplicationId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApplicationId(null);
          }}
          onImport={() => {
            setShowDetailModal(false);
            setShowImportModal(true);
          }}
          onReject={() => {
            setShowDetailModal(false);
            setShowRejectModal(true);
          }}
        />
      )}

      {showImportModal && selectedApplicationId && (
        <ImportApplicationModal
          applicationId={selectedApplicationId}
          onClose={() => {
            setShowImportModal(false);
            setSelectedApplicationId(null);
          }}
          onSuccess={handleImportSuccess}
        />
      )}

      {showRejectModal && selectedApplicationId && (
        <RejectApplicationModal
          applicationId={selectedApplicationId}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedApplicationId(null);
          }}
          onSuccess={handleRejectSuccess}
        />
      )}

      {/* 入園申込キー管理モーダル */}
      <ApplicationKeyModal
        isOpen={isApplicationKeyModalOpen}
        onClose={() => setIsApplicationKeyModalOpen(false)}
      />
    </DashboardLayout>
  );
}
