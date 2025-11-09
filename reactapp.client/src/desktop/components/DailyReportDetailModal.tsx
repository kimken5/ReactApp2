import { useEffect, useState } from 'react';
import { dailyReportService } from '../services/dailyReportService';
import type { DailyReportDto } from '../types/dailyReport';

interface DailyReportDetailModalProps {
  reportId: number;
  onClose: () => void;
  onEdit: (reportId: number) => void;
}

/**
 * 日報詳細モーダル
 */
export function DailyReportDetailModal({ reportId, onClose, onEdit }: DailyReportDetailModalProps) {
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReportDetail();
  }, [reportId]);

  const loadReportDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await dailyReportService.getDailyReportById(reportId);
      console.log('日報詳細データ:', data);
      console.log('写真データ:', data.photos);
      if (data.photos && data.photos.length > 0) {
        console.log('写真URL一覧:', data.photos);
      }
      setReport(data);
    } catch (error) {
      console.error('日報の取得に失敗しました:', error);
      setErrorMessage('日報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
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

  const getReportKindLabel = (reportKind: string) => {
    const kindMap: Record<string, string> = {
      'activity': '活動',
      'meal': '食事',
      'sleep': '睡眠',
      'health': '健康',
      'incident': '事故',
      'behavior': '行動',
    };

    // 複数の種別がカンマ区切りで含まれている場合
    if (reportKind.includes(',')) {
      return reportKind
        .split(',')
        .map(kind => kindMap[kind.trim()] || kind.trim())
        .join(', ');
    }

    return kindMap[reportKind] || reportKind;
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-300 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-yellow-50">
            <div>
              {report && <p className="text-sm text-gray-600">レポートID: {report.id}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              title="閉じる"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">読み込み中...</p>
                </div>
              </div>
            ) : errorMessage || !report ? (
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
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">園児名</p>
                      <p className="text-base font-medium text-gray-900">{report.childName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">クラス</p>
                      <p className="text-base font-medium text-gray-900">{report.className || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">職員名</p>
                      <p className="text-base font-medium text-gray-900">{report.staffName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">報告日</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(report.reportDate).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">レポート種別</p>
                      <p className="text-base font-medium text-gray-900">{getReportKindLabel(report.reportKind)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ステータス</p>
                      <div>{getStatusBadge(report.status)}</div>
                    </div>
                  </div>
                </div>

                {/* タイトル */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">タイトル</h3>
                  <p className="text-base text-gray-900 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {report.title}
                  </p>
                </div>

                {/* 内容 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">内容</h3>
                  <div className="text-base text-gray-900 bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>

                {/* 写真 */}
                {report.photos && report.photos.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">写真</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {report.photos.map((photoUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <img
                            src={photoUrl}
                            alt={`写真 ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              console.error('写真の読み込みエラー:', photoUrl);
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E画像エラー%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-gray-500">
                    写真はありません
                  </div>
                )}

                {/* タイムスタンプ */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">作成日時:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(report.createdAt)}</span>
                    </div>
                    {report.updatedAt && (
                      <div>
                        <span className="text-gray-600">更新日時:</span>
                        <span className="ml-2 text-gray-900">{formatDateTime(report.updatedAt)}</span>
                      </div>
                    )}
                    {report.publishedAt && (
                      <div>
                        <span className="text-gray-600">公開日時:</span>
                        <span className="ml-2 text-gray-900">{formatDateTime(report.publishedAt)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">保護者確認:</span>
                      <span className={`ml-2 font-medium ${report.parentAcknowledged ? 'text-green-600' : 'text-amber-600'}`}>
                        {report.parentAcknowledged ? '確認済み' : '未確認'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              閉じる
            </button>
            {report && !isPublishedOrArchived(report.status) && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(report.id);
                }}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                編集
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
