import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ReadStatusModal } from '../components/announcements/ReadStatusModal';
import { announcementService } from '../services/announcementService';
import type {
  AnnouncementDto,
  AnnouncementFilterDto,
  AnnouncementCategoryType,
  DeliveryStatusType,
  ReadStatusDto,
  ReadParentDto,
  UnreadParentDto,
} from '../types/announcement';
import {
  announcementCategoriesDesktop,
  targetAudienceNames,
  deliveryStatusNames,
} from '../types/announcement';

/**
 * お知らせ一覧ページ
 * お知らせの表示・検索・削除を行う
 */
export function AnnouncementsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<AnnouncementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmAnnouncement, setDeleteConfirmAnnouncement] =
    useState<AnnouncementDto | null>(null);

  // 閲覧状況モーダル用state
  const [readStatusModalOpen, setReadStatusModalOpen] = useState(false);
  const [selectedAnnouncementForReadStatus, setSelectedAnnouncementForReadStatus] =
    useState<AnnouncementDto | null>(null);
  const [readStatusData, setReadStatusData] = useState<{
    readStatus: ReadStatusDto;
    readParents: ReadParentDto[];
    unreadParents: UnreadParentDto[];
  } | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<AnnouncementFilterDto>({
    searchKeyword: '',
  });

  // 初期データ読み込み
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // フィルタ適用
  useEffect(() => {
    applyFilter();
  }, [announcements, filter]);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (isDemoMode) {
        // デモデータを設定
        const demoData: AnnouncementDto[] = [
          {
            announcementId: 1,
            title: '【緊急】台風接近に伴う休園のお知らせ',
            content:
              '保護者の皆様へ\n\n台風19号の接近に伴い、園児の安全を最優先に考え、明日9月15日（金）は臨時休園とさせていただきます。\n\nご理解とご協力をお願いいたします。',
            category: 'emergency',
            targetAudience: 'all',
            createdByAdminUser: true,
            publishedAt: new Date().toISOString(),
            status: 'published',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            readStatus: {
              totalRecipients: 150,
              readCount: 142,
              readRate: 94.67,
            },
          },
          {
            announcementId: 2,
            title: '運動会の日程変更について',
            content:
              '保護者の皆様へ\n\n10月13日（日）に予定しておりました運動会ですが、天候不順が予想されるため、10月20日（日）に延期させていただきます。\n\n時間：9:00～12:00\n場所：○○小学校グラウンド',
            category: 'important',
            targetAudience: 'all',
            createdByAdminUser: true,
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'published',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            readStatus: {
              totalRecipients: 150,
              readCount: 138,
              readRate: 92.0,
            },
          },
          {
            announcementId: 3,
            title: '保護者会のご案内',
            content:
              '保護者の皆様へ\n\n来月の保護者会についてご案内いたします。\n\n日時：11月10日（日）10:00～12:00\n場所：園ホール\n内容：行事報告、年度末に向けた準備について',
            category: 'cooperation',
            targetAudience: 'all',
            createdByAdminUser: true,
            scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            announcementId: 4,
            title: '【ひよこ組】遠足のお知らせ',
            content:
              'ひよこ組保護者の皆様へ\n\nクラス行事として遠足を実施いたします。\n\n日時：10月25日（金）9:30～14:00\n行き先：○○公園\n持ち物：お弁当、水筒、帽子、レジャーシート',
            category: 'general',
            targetAudience: 'class',
            targetClassId: 'C001',
            targetClassName: 'ひよこ組',
            createdByStaffId: 5,
            createdByStaffName: '田中 花子',
            createdByAdminUser: false,
            status: 'draft',
            createdAt: new Date().toISOString(),
          },
        ];

        setAnnouncements(demoData);
      } else {
        const data = await announcementService.getAnnouncements();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
      setErrorMessage('お知らせの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...announcements];

    // キーワード検索
    if (filter.searchKeyword) {
      const keyword = filter.searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(keyword) ||
          a.summary.toLowerCase().includes(keyword) ||
          a.content.toLowerCase().includes(keyword)
      );
    }

    // カテゴリフィルター
    if (filter.category) {
      filtered = filtered.filter((a) => a.category === filter.category);
    }

    // 配信状態フィルター
    if (filter.status) {
      filtered = filtered.filter((a) => a.status === filter.status);
    }

    setFilteredAnnouncements(filtered);
  };

  const handleOpenReadStatus = async (announcement: AnnouncementDto) => {
    try {
      setSelectedAnnouncementForReadStatus(announcement);

      if (isDemoMode) {
        // デモモード: サンプルデータを生成
        const demoReadParents: ReadParentDto[] = [
          {
            parentId: 1,
            parentName: '田中 一郎',
            phoneNumber: '090-1234-5678',
            childName: '田中 太郎',
            className: 'ひよこ組',
            readAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
          },
          {
            parentId: 2,
            parentName: '佐藤 花子',
            phoneNumber: '090-2345-6789',
            childName: '佐藤 次郎',
            className: 'ひよこ組',
            readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5時間前
          },
          {
            parentId: 3,
            parentName: '鈴木 美咲',
            phoneNumber: '090-3456-7890',
            childName: '鈴木 三郎',
            className: 'うさぎ組',
            readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1時間前
          },
        ];

        const demoUnreadParents: UnreadParentDto[] = [
          {
            parentId: 4,
            parentName: '高橋 健太',
            phoneNumber: '090-4567-8901',
            childName: '高橋 四郎',
            className: 'きりん組',
          },
        ];

        setReadStatusData({
          readStatus: {
            totalRecipients: 4,
            readCount: 3,
            readRate: 75.0,
          },
          readParents: demoReadParents,
          unreadParents: demoUnreadParents,
        });
      } else {
        // 本番モード: APIから取得
        const unreadParents = await announcementService.getUnreadParents(announcement.announcementId);

        // ここでは仮のデータを設定（APIが実装されたら適切に修正）
        setReadStatusData({
          readStatus: announcement.readStatus || {
            totalRecipients: 0,
            readCount: 0,
            readRate: 0,
          },
          readParents: [], // APIから取得した既読保護者リスト
          unreadParents: unreadParents,
        });
      }

      setReadStatusModalOpen(true);
    } catch (error) {
      console.error('閲覧状況取得エラー:', error);
      setErrorMessage('閲覧状況の取得に失敗しました');
    }
  };

  const handleDelete = async (announcement: AnnouncementDto) => {
    try {
      if (isDemoMode) {
        setAnnouncements(announcements.filter((a) => a.announcementId !== announcement.announcementId));
        setSuccessMessage(`「${announcement.title}」を削除しました（デモモード）`);
      } else {
        await announcementService.deleteAnnouncement(announcement.announcementId);
        setSuccessMessage(`「${announcement.title}」を削除しました`);
        loadAnnouncements();
      }
      setDeleteConfirmAnnouncement(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('削除エラー:', error);
      setErrorMessage('削除に失敗しました');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handlePublish = async (announcement: AnnouncementDto) => {
    try {
      if (isDemoMode) {
        setAnnouncements(
          announcements.map((a) =>
            a.announcementId === announcement.announcementId
              ? { ...a, status: 'published', publishedAt: new Date().toISOString() }
              : a
          )
        );
        setSuccessMessage(`「${announcement.title}」を配信しました（デモモード）`);
      } else {
        await announcementService.publishAnnouncement(announcement.announcementId);
        setSuccessMessage(`「${announcement.title}」を配信しました`);
        loadAnnouncements();
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('配信エラー:', error);
      setErrorMessage('配信に失敗しました');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">お知らせ管理</h1>
            <p className="text-gray-600 mt-2">お知らせの作成・配信・削除を行います</p>
          </div>
          <button
            onClick={() => navigate(`/desktop/announcements/create${isDemoMode ? '?demo=true' : ''}`)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規作成</span>
          </button>
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
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
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

        {/* フィルター */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード検索</label>
              <input
                type="text"
                value={filter.searchKeyword || ''}
                onChange={(e) => setFilter({ ...filter, searchKeyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                placeholder="タイトル・内容で検索"
              />
            </div>

            {/* カテゴリフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <select
                value={filter.category || ''}
                onChange={(e) =>
                  setFilter({ ...filter, category: e.target.value as AnnouncementCategoryType || undefined })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                {Object.entries(announcementCategoriesDesktop).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 配信状態フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">配信状態</label>
              <select
                value={filter.status || ''}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value as DeliveryStatusType || undefined })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                {Object.entries(deliveryStatusNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* お知らせ一覧 */}
        <div className="bg-white rounded-md shadow-md border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    配信状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      お知らせが見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <tr key={announcement.announcementId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{announcement.summary}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{
                            backgroundColor:
                              announcementCategoriesDesktop[announcement.category].bgColor,
                            color: announcementCategoriesDesktop[announcement.category].color,
                          }}
                        >
                          {announcementCategoriesDesktop[announcement.category].name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {targetAudienceNames[announcement.targetAudience]}
                        {announcement.targetChildName && ` (${announcement.targetChildName})`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            announcement.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : announcement.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {deliveryStatusNames[announcement.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString('ja-JP', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-1">
                          {/* 閲覧状況ボタン (配信済みのみ) */}
                          {announcement.status === 'published' && (
                            <button
                              onClick={() => handleOpenReadStatus(announcement)}
                              className="relative group p-2 bg-purple-50 text-purple-600 rounded-md border border-purple-200 hover:bg-purple-100 hover:shadow-md transition-all duration-200"
                              title="閲覧状況"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                閲覧状況
                              </span>
                            </button>
                          )}
                          {/* 配信ボタン (下書きのみ) */}
                          {announcement.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(announcement)}
                              className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                              title="配信"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                配信
                              </span>
                            </button>
                          )}
                          {/* 編集ボタン */}
                          <button
                            onClick={() =>
                              navigate(
                                `/desktop/announcements/edit/${announcement.announcementId}${isDemoMode ? '?demo=true' : ''}`
                              )
                            }
                            className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                            title="編集"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              編集
                            </span>
                          </button>
                          {/* 削除ボタン */}
                          <button
                            onClick={() => setDeleteConfirmAnnouncement(announcement)}
                            className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                            title="削除"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
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
        </div>
      </div>

      {/* 閲覧状況モーダル */}
      {readStatusModalOpen && selectedAnnouncementForReadStatus && readStatusData && (
        <ReadStatusModal
          isOpen={readStatusModalOpen}
          onClose={() => {
            setReadStatusModalOpen(false);
            setSelectedAnnouncementForReadStatus(null);
            setReadStatusData(null);
          }}
          announcementTitle={selectedAnnouncementForReadStatus.title}
          readStatus={readStatusData.readStatus}
          readParents={readStatusData.readParents}
          unreadParents={readStatusData.unreadParents}
        />
      )}

      {/* 削除確認モーダル */}
      {deleteConfirmAnnouncement && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteConfirmAnnouncement(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">お知らせの削除</h3>
              <p className="text-gray-600 mb-6">
                「{deleteConfirmAnnouncement.title}」を削除してもよろしいですか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmAnnouncement(null)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:shadow-md transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmAnnouncement)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 hover:shadow-md transition-all duration-200"
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
