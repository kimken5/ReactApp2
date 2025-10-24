import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { photoService } from '../services/photoService';
import { masterService } from '../services/masterService';
import type { PhotoDto, PhotoFilterDto } from '../types/photo';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

/**
 * 写真一覧ページ
 * 写真の表示・検索・削除を行う
 */
export function PhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoDto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = useState<PhotoDto | null>(null);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // フィルタ状態
  const [filter, setFilter] = useState<PhotoFilterDto>({
    childId: undefined,
    classId: undefined,
    staffId: undefined,
    startDate: undefined,
    endDate: undefined,
    visibilityLevel: undefined,
    status: undefined,
    requiresConsent: undefined,
    searchKeyword: '',
  });

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, []);

  // フィルタ適用
  useEffect(() => {
    applyFilters();
  }, [photos, filter]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [photosData, childrenData, classesData, staffData] = await Promise.all([
        photoService.getPhotos(),
        masterService.getChildren(),
        masterService.getClasses(),
        masterService.getStaff(),
      ]);

      setPhotos(photosData);
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
        filter.visibilityLevel ||
        filter.status ||
        filter.requiresConsent !== undefined;

      if (hasApiFilter) {
        const filtered = await photoService.getPhotos(filter);
        setFilteredPhotos(filtered);
      } else {
        // ローカルフィルタ（キーワード検索のみ）
        let filtered = [...photos];

        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filtered = filtered.filter(
            photo =>
              photo.uploadedByStaffName.toLowerCase().includes(keyword) ||
              photo.description?.toLowerCase().includes(keyword) ||
              photo.children.some(child => child.childName.toLowerCase().includes(keyword))
          );
        }

        setFilteredPhotos(filtered);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('フィルタの適用に失敗しました:', error);
      setErrorMessage('フィルタの適用に失敗しました');
    }
  };

  const handleDelete = async (photo: PhotoDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await photoService.deletePhoto(photo.id);
      setSuccessMessage(`写真を削除しました`);
      setDeleteConfirmPhoto(null);
      loadInitialData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('写真の削除に失敗しました:', error);
      setErrorMessage('写真の削除に失敗しました');
      setDeleteConfirmPhoto(null);
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

  const getVisibilityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'class':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            クラス
          </span>
        );
      case 'grade':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            学年
          </span>
        );
      case 'all':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            全体
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {level}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return dateString.split('T')[0]; // YYYY-MM-DD
  };

  const isPublished = (status: string) => {
    return status.toLowerCase() === 'published';
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ページネーション処理
  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPhotos = filteredPhotos.slice(startIndex, endIndex);

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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">写真管理</h1>
            <p className="text-gray-600">写真の一覧・アップロード・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/photos/upload')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 active:bg-purple-800 transition flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規アップロード</span>
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

            {/* 公開範囲選択 */}
            <div>
              <label htmlFor="visibilityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                公開範囲
              </label>
              <select
                id="visibilityLevel"
                value={filter.visibilityLevel || ''}
                onChange={e =>
                  setFilter(prev => ({ ...prev, visibilityLevel: e.target.value || undefined }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                <option value="class">クラス</option>
                <option value="grade">学年</option>
                <option value="all">全体</option>
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

            {/* 同意要否 */}
            <div>
              <label htmlFor="requiresConsent" className="block text-sm font-medium text-gray-700 mb-2">
                同意要否
              </label>
              <select
                id="requiresConsent"
                value={
                  filter.requiresConsent === undefined ? '' : filter.requiresConsent ? 'true' : 'false'
                }
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    requiresConsent: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">すべて</option>
                <option value="true">要同意</option>
                <option value="false">不要</option>
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
              placeholder="職員名、説明、園児名で検索"
            />
          </div>
        </div>

        {/* 写真グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {currentPhotos.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center text-gray-500">
              写真が見つかりませんでした
            </div>
          ) : (
            currentPhotos.map(photo => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* サムネイル画像 */}
                <div
                  className="relative aspect-square bg-gray-200 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/desktop/photos/${photo.id}`)}
                >
                  <img
                    src={photo.thumbnailPath}
                    alt={photo.description || '写真'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* カード内容 */}
                <div className="p-4">
                  {/* 説明文 */}
                  <p className="text-sm text-gray-900 mb-2 min-h-[40px]">
                    {truncateText(photo.description, 50) || '説明なし'}
                  </p>

                  {/* メタ情報 */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {photo.uploadedByStaffName}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(photo.publishedAt)}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      園児: {photo.children.length}人
                    </div>
                  </div>

                  {/* バッジ */}
                  <div className="flex items-center space-x-2 mb-3">
                    {getStatusBadge(photo.status)}
                    {getVisibilityBadge(photo.visibilityLevel)}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <button
                      onClick={() => navigate(`/desktop/photos/${photo.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      詳細
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/desktop/photos/edit/${photo.id}`)}
                        disabled={isPublishedOrArchived(photo.status)}
                        className={`text-sm font-medium ${
                          isPublishedOrArchived(photo.status)
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-purple-600 hover:text-purple-800'
                        }`}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => setDeleteConfirmPhoto(photo)}
                        disabled={isPublished(photo.status)}
                        className={`text-sm font-medium ${
                          isPublished(photo.status)
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-800'
                        }`}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              全 {filteredPhotos.length} 件中 {startIndex + 1} ～{' '}
              {Math.min(endIndex, filteredPhotos.length)} 件を表示
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

      {/* 削除確認モーダル */}
      {deleteConfirmPhoto && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirmPhoto(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">写真を削除</h3>
              <p className="text-gray-600 mb-6">
                本当にこの写真を削除しますか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmPhoto(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmPhoto)}
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
