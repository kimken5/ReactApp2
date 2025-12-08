/**
 * 入園申込管理ページ
 */

import React, { useState, useEffect } from 'react';
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

export function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginatedResult<ApplicationListItemDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // フィルター・検索状態
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // モーダル状態
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

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
      setApplications(result.items);
      setPagination(result);
    } catch (err) {
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入園申込管理</h1>
        <p className="mt-1 text-sm text-gray-600">
          保護者からの入園申込を確認し、インポートまたは却下します。
        </p>
      </div>

      {/* フィルター・検索 */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
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
              <option value="Imported">取り込み済み</option>
              <option value="Rejected">却下済み</option>
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            🔍 検索
          </button>
        </form>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請者名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    園児名
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
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={app.applicationStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.applicantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.childName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.relationshipToChild}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.mobilePhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(app.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {app.hasDuplicateParent ? (
                        <span className="text-orange-600 font-medium">⚠️ あり</span>
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleShowDetail(app.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                      {app.applicationStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleShowImport(app.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            インポート
                          </button>
                          <button
                            onClick={() => handleShowReject(app.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            却下
                          </button>
                        </>
                      )}
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
    </div>
  );
}
