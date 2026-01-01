import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { dailyReportService } from '../services/dailyReportService';
import type { DailyReportDto } from '../types/dailyReport';

/**
 * 日報詳細ページ
 * 日報の詳細情報を読み取り専用で表示する
 */
export function DailyReportDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReportDetail(parseInt(id));
    }
  }, [id]);

  const loadReportDetail = async (reportId: number) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await dailyReportService.getDailyReportById(reportId);
      setReport(data);
    } catch (error) {
      console.error('日報の取得に失敗しました:', error);
      setErrorMessage('日報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            下書き
          </span>
        );
      case 'published':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            公開済み
          </span>
        );
      case 'archived':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
            アーカイブ済み
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

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

  if (errorMessage || !report) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage || '日報が見つかりませんでした'}
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/desktop/dailyreports')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
            >
              一覧に戻る
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">日報詳細</h1>
            <p className="text-gray-600">日報ID: {report.id}</p>
          </div>
          <div className="flex space-x-3">
            {!isPublishedOrArchived(report.status) && (
              <button
                onClick={() => navigate(`/desktop/dailyreports/edit/${report.id}`)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>編集</span>
              </button>
            )}
            <button
              onClick={() => navigate('/desktop/dailyreports')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
            >
              一覧に戻る
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow">
          {/* 基本情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">基本情報</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">日報日付</dt>
                <dd className="text-base text-gray-900">{formatDate(report.reportDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">園児名</dt>
                <dd className="text-base text-gray-900">{report.childName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">クラス名</dt>
                <dd className="text-base text-gray-900">{report.className || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">職員名</dt>
                <dd className="text-base text-gray-900">{report.staffName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">作成者</dt>
                <dd className="text-base text-gray-900">
                  {report.createdByAdminUser ? '管理者' : '職員'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 内容 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">内容</h2>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">タイトル</dt>
                <dd className="text-base text-gray-900">{report.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">内容</dt>
                <dd className="text-base text-gray-900 whitespace-pre-wrap">{report.content}</dd>
              </div>
            </div>
          </div>

          {/* メディア */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">メディア</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">写真</dt>
                <dd>
                  {report.photos.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {report.photos.map((photo, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {photo}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-base text-gray-500">なし</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* ステータス情報 */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ステータス情報</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">ステータス</dt>
                <dd>{getStatusBadge(report.status)}</dd>
              </div>
              {report.publishedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">公開日時</dt>
                  <dd className="text-base text-gray-900">{formatDateTime(report.publishedAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">保護者確認</dt>
                <dd className="flex items-center space-x-2">
                  {report.parentAcknowledged ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base text-gray-900">確認済み</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-base text-gray-900">未確認</span>
                    </>
                  )}
                </dd>
              </div>
              {report.acknowledgedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">確認日時</dt>
                  <dd className="text-base text-gray-900">
                    {formatDateTime(report.acknowledgedAt)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">作成日時</dt>
                <dd className="text-base text-gray-900">{formatDateTime(report.createdAt)}</dd>
              </div>
              {report.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">更新日時</dt>
                  <dd className="text-base text-gray-900">{formatDateTime(report.updatedAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">回答数</dt>
                <dd className="text-base text-gray-900">{report.responseCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
