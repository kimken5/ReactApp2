import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { photoService } from '../services/photoService';
import type { PhotoDto } from '../types/photo';

/**
 * 写真詳細ページ
 * 写真の詳細情報を表示する（読み取り専用）
 */
export function PhotoDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state } = useDesktopAuth();
  const [photo, setPhoto] = useState<PhotoDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 写真機能の利用可否をチェック
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true;

  // 写真機能が無効な場合はアクセス制限
  if (!photoFunctionEnabled) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">写真機能は利用できません</h2>
            <p className="text-gray-600">
              この保育園では写真機能が有効になっていません。
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    if (id) {
      loadPhotoDetail(parseInt(id));
    }
  }, [id]);

  const loadPhotoDetail = async (photoId: number) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await photoService.getPhotoById(photoId);
      setPhoto(data);
    } catch (error) {
      console.error('写真の取得に失敗しました:', error);
      setErrorMessage('写真の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 日付フォーマット: YYYY年MM月DD日
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // 日時フォーマット: YYYY年MM月DD日 HH:MM
  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  };

  // ファイルサイズフォーマット: XX KB or XX.X MB
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // ステータスバッジ
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

  // 公開範囲バッジ
  const getVisibilityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'class':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
            クラス
          </span>
        );
      case 'grade':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
            学年
          </span>
        );
      case 'all':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            全体
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {level}
          </span>
        );
    }
  };

  // 編集可能かチェック（published/archivedは編集不可）
  const isEditable = (status: string): boolean => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus !== 'published' && lowerStatus !== 'archived';
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

  if (errorMessage || !photo) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage || '写真が見つかりませんでした'}
          </div>
          <button
            onClick={() => navigate('/desktop/photos')}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            一覧に戻る
          </button>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">写真詳細</h1>
            <p className="text-gray-600">写真ID: {photo.id}</p>
          </div>
          <div className="flex space-x-3">
            {isEditable(photo.status) && (
              <button
                onClick={() => navigate(`/desktop/photos/edit/${photo.id}`)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 active:bg-purple-800 transition flex items-center space-x-2"
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
              onClick={() => navigate('/desktop/photos')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 active:bg-gray-800 transition flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>一覧に戻る</span>
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左側: 写真表示 */}
            <div>
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo.filePath}
                  alt={photo.description || '写真'}
                  className="w-full h-auto object-contain"
                  style={{ maxWidth: '800px' }}
                />
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                画像サイズ: {photo.width} x {photo.height} px
              </div>
            </div>

            {/* 右側: メタデータ */}
            <div>
              <dl className="space-y-4">
                {/* ファイル名 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">ファイル名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{photo.fileName}</dd>
                </div>

                {/* 元のファイル名 */}
                {photo.originalFileName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">元のファイル名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{photo.originalFileName}</dd>
                  </div>
                )}

                {/* ファイルサイズ */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">ファイルサイズ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatFileSize(photo.fileSize)}</dd>
                </div>

                {/* 説明文 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">説明文</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {photo.description || '説明なし'}
                  </dd>
                </div>

                {/* アップロード職員名 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">アップロード職員名</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center space-x-2">
                    <span>{photo.uploadedByStaffName}</span>
                    {photo.uploadedByAdminUser && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        管理者
                      </span>
                    )}
                    {!photo.uploadedByAdminUser && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        職員
                      </span>
                    )}
                  </dd>
                </div>

                {/* アップロード日時 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">アップロード日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(photo.uploadedAt)}</dd>
                </div>

                {/* 公開日時 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">公開日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(photo.publishedAt)}</dd>
                </div>

                {/* 更新日時 */}
                {photo.updatedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">更新日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(photo.updatedAt)}</dd>
                  </div>
                )}

                {/* 公開範囲 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">公開範囲</dt>
                  <dd className="mt-1">{getVisibilityBadge(photo.visibilityLevel)}</dd>
                </div>

                {/* 対象クラス名 */}
                {photo.targetClassName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">対象クラス名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{photo.targetClassName}</dd>
                  </div>
                )}

                {/* ステータス */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">ステータス</dt>
                  <dd className="mt-1">{getStatusBadge(photo.status)}</dd>
                </div>

                {/* 同意要否 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">同意要否</dt>
                  <dd className="mt-1 flex items-center space-x-2">
                    {photo.requiresConsent ? (
                      <>
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-900 font-medium">要同意</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-900">不要</span>
                      </>
                    )}
                  </dd>
                </div>

                {/* 閲覧回数 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">閲覧回数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{photo.viewCount} 回</dd>
                </div>

                {/* ダウンロード回数 */}
                <div>
                  <dt className="text-sm font-medium text-gray-700">ダウンロード回数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{photo.downloadCount} 回</dd>
                </div>

                {/* 写っている園児リスト */}
                <div>
                  <dt className="text-sm font-medium text-gray-700 mb-2">写っている園児</dt>
                  <dd className="mt-1">
                    {photo.children.length === 0 ? (
                      <p className="text-sm text-gray-500">園児が登録されていません</p>
                    ) : (
                      <div className="space-y-2">
                        {photo.children.map(child => (
                          <div
                            key={child.childId}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                              child.isPrimarySubject ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                            }`}
                          >
                            {child.isPrimarySubject && (
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">{child.childName}</p>
                              {child.className && (
                                <p className="text-xs text-gray-600">{child.className}</p>
                              )}
                            </div>
                            {child.isPrimarySubject && (
                              <span className="text-xs font-semibold text-yellow-700">主要被写体</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
