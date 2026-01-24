import { useEffect, useState } from 'react';
import type { EntryExitLogDto } from '../../services/entryExitService';

interface EntryExitLogDetailModalProps {
  logId: number;
  logs: EntryExitLogDto[];
  onClose: () => void;
}

/**
 * 入退ログ詳細モーダル
 * ログの詳細情報を表示
 */
export function EntryExitLogDetailModal({ logId, logs, onClose }: EntryExitLogDetailModalProps) {
  const [log, setLog] = useState<EntryExitLogDto | null>(null);

  useEffect(() => {
    const foundLog = logs.find(l => l.id === logId);
    setLog(foundLog || null);
  }, [logId, logs]);

  if (!log) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">入退ログ詳細</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">ログID</p>
                <p className="text-base font-semibold text-gray-900">{log.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">入/出</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    log.entryType === 'Entry'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {log.entryType === 'Entry' ? '入' : '出'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">日時</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(log.timestamp).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">保護者名</p>
              <p className="text-base font-semibold text-gray-900">{log.parentName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">園児名</p>
              <div className="flex flex-wrap gap-2">
                {log.childNames.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">登録日時</p>
              <p className="text-sm text-gray-600">
                {new Date(log.createdAt).toLocaleString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
