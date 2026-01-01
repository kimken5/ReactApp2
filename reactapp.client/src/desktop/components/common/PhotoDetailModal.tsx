import { useState, useEffect } from 'react';
import { photoService } from '../../services/photoService';
import { masterService } from '../../services/masterService';
import type { PhotoDto, UpdatePhotoRequestDto } from '../../types/photo';
import type { ChildDto, ClassDto } from '../../types/master';

interface PhotoDetailModalProps {
  photo: PhotoDto | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function PhotoDetailModal({ photo, isOpen, onClose, onUpdated }: PhotoDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 編集用フォーム
  const [description, setDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [visibilityLevel, setVisibilityLevel] = useState('class');
  const [targetClassId, setTargetClassId] = useState<string | undefined>(undefined);
  const [targetGrade, setTargetGrade] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState('draft');
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [primaryChildId, setPrimaryChildId] = useState<number | undefined>(undefined);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);

  useEffect(() => {
    if (isOpen && photo) {
      // 初期値設定
      setDescription(photo.description || '');
      setPublishedAt(photo.publishedAt.split('T')[0]);
      setVisibilityLevel(photo.visibilityLevel);
      setTargetClassId(photo.targetClassId);
      setTargetGrade(photo.targetGrade);
      setStatus(photo.status);
      setSelectedChildIds(photo.children.map(c => c.childId));
      setPrimaryChildId(photo.children.find(c => c.isPrimarySubject)?.childId);

      // マスタデータ読み込み
      loadMasterData();
    }
  }, [isOpen, photo]);

  const loadMasterData = async () => {
    try {
      const [childrenData, classesData] = await Promise.all([
        masterService.getChildren(),
        masterService.getClasses(),
      ]);
      setChildren(childrenData);
      setClasses(classesData);
    } catch (err) {
      console.error('マスタデータ読み込みエラー:', err);
    }
  };

  const handleSave = async () => {
    if (!photo) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const request: UpdatePhotoRequestDto = {
        description,
        publishedAt: `${publishedAt}T00:00:00`,
        visibilityLevel,
        targetClassId: visibilityLevel === 'class' ? targetClassId : undefined,
        targetGrade: visibilityLevel === 'grade' ? targetGrade : undefined,
        status,
        childIds: selectedChildIds,
        primaryChildId,
      };

      await photoService.updatePhoto(photo.id, request);
      setSuccessMessage('写真情報を更新しました');
      setIsEditMode(false);

      if (onUpdated) {
        onUpdated();
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('写真更新エラー:', error);
      setErrorMessage('写真情報の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChildSelection = (childId: number) => {
    setSelectedChildIds(prev => {
      if (prev.includes(childId)) {
        // 削除時、主な園児も解除
        if (primaryChildId === childId) {
          setPrimaryChildId(undefined);
        }
        return prev.filter(id => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
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
    return dateString.split('T')[0];
  };

  const canEdit = photo !== null;

  if (!isOpen || !photo) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {isEditMode ? '写真編集' : '写真詳細'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
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

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
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

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Image */}
              <div>
                <img
                  src={photo.thumbnailPath}
                  alt={photo.description || '写真'}
                  className="w-full rounded-lg shadow-md border border-gray-200"
                />
              </div>

              {/* Right: Details / Edit Form */}
              <div className="space-y-4">
                {!isEditMode ? (
                  // View Mode
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                      <p className="text-gray-900">{photo.description || '説明なし'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">公開日</label>
                      <p className="text-gray-900">{formatDate(photo.publishedAt)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                      {getStatusBadge(photo.status)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">公開範囲</label>
                      {getVisibilityBadge(photo.visibilityLevel)}
                    </div>

                    {photo.targetClassId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">対象クラス</label>
                        <p className="text-gray-900">{photo.targetClassName || photo.targetClassId}</p>
                      </div>
                    )}

                    {photo.targetGrade !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">対象学年</label>
                        <p className="text-gray-900">{photo.targetGrade}歳児</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">アップロード職員</label>
                      <p className="text-gray-900">{photo.uploadedByStaffName}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">写っている園児</label>
                      <div className="flex flex-wrap gap-2">
                        {photo.children.map(child => (
                          <span
                            key={child.childId}
                            className={`px-3 py-1 text-sm rounded-full ${
                              child.isPrimarySubject
                                ? 'bg-orange-100 text-orange-800 font-semibold'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {child.childName}
                            {child.isPrimarySubject && ' (主)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  // Edit Mode
                  <>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        説明
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-1">
                        公開日
                      </label>
                      <input
                        type="date"
                        id="publishedAt"
                        value={publishedAt}
                        onChange={e => setPublishedAt(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        ステータス
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      >
                        <option value="draft">下書き</option>
                        <option value="published">公開済み</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="visibilityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                        公開範囲
                      </label>
                      <select
                        id="visibilityLevel"
                        value={visibilityLevel}
                        onChange={e => {
                          setVisibilityLevel(e.target.value);
                          setTargetClassId(undefined);
                          setTargetGrade(undefined);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                      >
                        <option value="class">クラス</option>
                        <option value="grade">学年</option>
                        <option value="all">全体</option>
                      </select>
                    </div>

                    {visibilityLevel === 'class' && (
                      <div>
                        <label htmlFor="targetClassId" className="block text-sm font-medium text-gray-700 mb-1">
                          対象クラス
                        </label>
                        <select
                          id="targetClassId"
                          value={targetClassId || ''}
                          onChange={e => setTargetClassId(e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        >
                          <option value="">選択してください</option>
                          {classes.map(classItem => (
                            <option key={classItem.classId} value={classItem.classId}>
                              {classItem.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {visibilityLevel === 'grade' && (
                      <div>
                        <label htmlFor="targetGrade" className="block text-sm font-medium text-gray-700 mb-1">
                          対象学年
                        </label>
                        <select
                          id="targetGrade"
                          value={targetGrade ?? ''}
                          onChange={e => setTargetGrade(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                        >
                          <option value="">選択してください</option>
                          <option value="0">0歳児</option>
                          <option value="1">1歳児</option>
                          <option value="2">2歳児</option>
                          <option value="3">3歳児</option>
                          <option value="4">4歳児</option>
                          <option value="5">5歳児</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">写っている園児</label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                        {children.map(child => (
                          <label key={child.childId} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedChildIds.includes(child.childId)}
                              onChange={() => toggleChildSelection(child.childId)}
                              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                            />
                            <span className="text-sm text-gray-700">{child.name}</span>
                            {selectedChildIds.includes(child.childId) && (
                              <button
                                type="button"
                                onClick={() => setPrimaryChildId(child.childId)}
                                className={`ml-auto text-xs px-2 py-1 rounded ${
                                  primaryChildId === child.childId
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {primaryChildId === child.childId ? '主' : '主に設定'}
                              </button>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            {!isEditMode ? (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  閉じる
                </button>
                {canEdit && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-lg hover:from-orange-500 hover:to-yellow-500 transition shadow-sm"
                  >
                    編集
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-lg hover:from-orange-500 hover:to-yellow-500 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isLoading ? '保存中...' : '保存'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
