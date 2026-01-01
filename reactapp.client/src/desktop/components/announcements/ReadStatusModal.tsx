import { useState } from 'react';
import type { ReadStatusDto, ReadParentDto, UnreadParentDto } from '../../types/announcement';

interface ReadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementTitle: string;
  readStatus: ReadStatusDto;
  readParents: ReadParentDto[];
  unreadParents: UnreadParentDto[];
}

type FilterType = 'all' | 'read' | 'unread';

/**
 * 閲覧状況モーダルコンポーネント
 * お知らせの既読率と保護者リストを表示
 */
export function ReadStatusModal({
  isOpen,
  onClose,
  announcementTitle,
  readStatus,
  readParents,
  unreadParents,
}: ReadStatusModalProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  if (!isOpen) return null;

  // フィルターに応じた保護者リストを取得
  const getFilteredParents = () => {
    switch (filter) {
      case 'read':
        return readParents;
      case 'unread':
        return unreadParents;
      case 'all':
      default:
        return [...readParents, ...unreadParents];
    }
  };

  const filteredParents = getFilteredParents();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">閲覧状況</h2>
            <p className="text-gray-600 text-sm mt-1">{announcementTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 既読率サマリー */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">既読率</span>
            <span className="text-2xl font-bold text-blue-600">{readStatus.readRate.toFixed(1)}%</span>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${readStatus.readRate}%` }}
            ></div>
          </div>

          {/* 統計情報 */}
          <div className="flex justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                既読: <span className="font-semibold text-gray-800">{readStatus.readCount}人</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">
                未読: <span className="font-semibold text-gray-800">{readStatus.totalRecipients - readStatus.readCount}人</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                総配信数: <span className="font-semibold text-gray-800">{readStatus.totalRecipients}人</span>
              </span>
            </div>
          </div>
        </div>

        {/* フィルターボタン */}
        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全体 ({readStatus.totalRecipients})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === 'read'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              既読 ({readStatus.readCount})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === 'unread'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未読 ({readStatus.totalRecipients - readStatus.readCount})
            </button>
          </div>
        </div>

        {/* 保護者リスト */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
          {filteredParents.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              該当する保護者がいません
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保護者名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    園児名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filter === 'all' && (
                  <>
                    {/* 既読保護者 */}
                    {readParents.map((parent) => (
                      <tr key={`read-${parent.parentId}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parent.parentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {parent.childName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {parent.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {parent.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              既読
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(parent.readAt).toLocaleString('ja-JP', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* 未読保護者 */}
                    {unreadParents.map((parent) => (
                      <tr key={`unread-${parent.parentId}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {parent.parentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {parent.childName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {parent.className}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {parent.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            未読
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {filter === 'read' && readParents.map((parent) => (
                  <tr key={parent.parentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parent.parentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {parent.childName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parent.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parent.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          既読
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(parent.readAt).toLocaleString('ja-JP', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {filter === 'unread' && unreadParents.map((parent) => (
                  <tr key={parent.parentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parent.parentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {parent.childName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parent.className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parent.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        未読
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
