import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { photoService } from '../services/photoService';
import { masterService } from '../services/masterService';
import type { UploadPhotoRequestDto } from '../types/photo';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

/**
 * 写真アップロードページ
 * 写真のアップロードとメタデータ登録を行う
 */
export function PhotoUploadPage() {
  const navigate = useNavigate();

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const [description, setDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [visibilityLevel, setVisibilityLevel] = useState<'class' | 'grade' | 'all'>('class');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [requiresConsent, setRequiresConsent] = useState(true);
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [primaryChildId, setPrimaryChildId] = useState<number | null>(null);

  // Master data
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load master data
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      const [childrenData, classesData, staffData] = await Promise.all([
        masterService.getChildren(),
        masterService.getClasses(),
        masterService.getStaff(),
      ]);
      setChildren(childrenData);
      setClasses(classesData);
      setStaffList(staffData);
    } catch (error) {
      console.error('マスタデータの読み込みに失敗しました:', error);
      setErrorMessage('マスタデータの読み込みに失敗しました');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      resetFileState();
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, file: '画像ファイル（JPEG、PNG、WebP）のみアップロード可能です' }));
      resetFileState();
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setFieldErrors((prev) => ({ ...prev, file: 'ファイルサイズは50MB以下にしてください' }));
      resetFileState();
      return;
    }

    // Clear file error
    setFieldErrors((prev) => {
      const { file, ...rest } = prev;
      return rest;
    });

    setSelectedFile(file);
    setFileSize(file.size);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setPreviewUrl(imageUrl);

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const resetFileState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileSize(0);
    setImageDimensions(null);
  };

  // Handle child selection
  const handleChildToggle = (childId: number) => {
    setSelectedChildIds((prev) => {
      if (prev.includes(childId)) {
        // Remove child
        const newIds = prev.filter((id) => id !== childId);
        // Reset primary child if it was the removed child
        if (primaryChildId === childId) {
          setPrimaryChildId(null);
        }
        return newIds;
      } else {
        // Add child
        return [...prev, childId];
      }
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedFile) {
      errors.file = '画像ファイルを選択してください';
    }

    if (!publishedAt) {
      errors.publishedAt = '公開日時を入力してください';
    } else {
      // Check if publishedAt is in the future
      const publishedDate = new Date(publishedAt);
      const now = new Date();
      if (publishedDate > now) {
        errors.publishedAt = '公開日時は現在時刻以前を指定してください';
      }
    }

    if (!selectedStaffId) {
      errors.staffId = '職員を選択してください';
    }

    if (visibilityLevel === 'class' && !targetClassId) {
      errors.targetClassId = 'クラスを選択してください';
    }

    if (selectedChildIds.length === 0) {
      errors.childIds = '少なくとも1人の園児を選択してください';
    }

    if (primaryChildId && !selectedChildIds.includes(primaryChildId)) {
      errors.primaryChildId = '主要被写体は選択された園児の中から選んでください';
    }

    if (description && description.length > 500) {
      errors.description = '説明は500文字以内で入力してください';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('入力内容に誤りがあります。各項目を確認してください。');
      return;
    }

    if (!selectedFile || !selectedStaffId) {
      return;
    }

    setIsLoading(true);

    try {
      const request: UploadPhotoRequestDto = {
        file: selectedFile,
        description: description.trim() || undefined,
        publishedAt: new Date(publishedAt).toISOString(),
        visibilityLevel,
        targetClassId: visibilityLevel === 'class' ? targetClassId : undefined,
        status,
        requiresConsent,
        staffId: selectedStaffId,
        childIds: selectedChildIds,
        primaryChildId: primaryChildId || undefined,
      };

      const uploadedPhoto = await photoService.uploadPhoto(request);

      // Navigate to photo detail page
      navigate(`/desktop/photos/${uploadedPhoto.id}`);
    } catch (error: any) {
      console.error('写真のアップロードに失敗しました:', error);
      setErrorMessage(
        error.response?.data?.message || '写真のアップロードに失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/desktop/photos');
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">写真アップロード</h1>
          <p className="mt-1 text-sm text-gray-600">新しい写真をアップロードします</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像ファイル <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isLoading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {fieldErrors.file && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.file}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                JPEG、PNG、WebP形式のみ対応。最大ファイルサイズ: 50MB
              </p>

              {/* Preview */}
              {previewUrl && (
                <div className="mt-4 space-y-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-md rounded-lg shadow-md"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  <div className="text-sm text-gray-600">
                    <p>ファイルサイズ: {formatFileSize(fileSize)}</p>
                    {imageDimensions && (
                      <p>
                        画像サイズ: {imageDimensions.width} × {imageDimensions.height} px
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                placeholder="写真の説明を入力してください（任意）"
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{description.length} / 500 文字</p>
            </div>

            {/* Published At */}
            <div>
              <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-2">
                公開日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="publishedAt"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
              {fieldErrors.publishedAt && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.publishedAt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">現在時刻以前を指定してください</p>
            </div>

            {/* Staff Selection */}
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                職員選択 <span className="text-red-500">*</span>
              </label>
              <select
                id="staffId"
                value={selectedStaffId || ''}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              >
                <option value="">職員を選択してください</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.lastName} {staff.firstName}
                  </option>
                ))}
              </select>
              {fieldErrors.staffId && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.staffId}</p>
              )}
            </div>

            {/* Visibility Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                公開範囲 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="class"
                    checked={visibilityLevel === 'class'}
                    onChange={(e) => setVisibilityLevel(e.target.value as 'class' | 'grade' | 'all')}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">クラス</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="grade"
                    checked={visibilityLevel === 'grade'}
                    onChange={(e) => setVisibilityLevel(e.target.value as 'class' | 'grade' | 'all')}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">学年</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={visibilityLevel === 'all'}
                    onChange={(e) => setVisibilityLevel(e.target.value as 'class' | 'grade' | 'all')}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">全体</span>
                </label>
              </div>
            </div>

            {/* Target Class (conditional) */}
            {visibilityLevel === 'class' && (
              <div>
                <label htmlFor="targetClassId" className="block text-sm font-medium text-gray-700 mb-2">
                  対象クラス <span className="text-red-500">*</span>
                </label>
                <select
                  id="targetClassId"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                >
                  <option value="">クラスを選択してください</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.targetClassId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.targetClassId}</p>
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">下書き</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="published"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    disabled={isLoading}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">公開済み</span>
                </label>
              </div>
            </div>

            {/* Requires Consent */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={requiresConsent}
                  onChange={(e) => setRequiresConsent(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">同意が必要</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">保護者の同意が必要な写真の場合はチェックしてください</p>
            </div>

            {/* Child Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                写っている園児 <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {children.length === 0 ? (
                  <p className="text-sm text-gray-500">園児データがありません</p>
                ) : (
                  <div className="space-y-2">
                    {children.map((child) => (
                      <label key={child.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedChildIds.includes(child.id)}
                          onChange={() => handleChildToggle(child.id)}
                          disabled={isLoading}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {child.lastName} {child.firstName}
                          {child.className && <span className="text-gray-500 ml-2">({child.className})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {fieldErrors.childIds && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.childIds}</p>
              )}
            </div>

            {/* Primary Child Selection */}
            {selectedChildIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">主要被写体（任意）</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={primaryChildId === null}
                      onChange={() => setPrimaryChildId(null)}
                      disabled={isLoading}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">指定なし</span>
                  </label>
                  {selectedChildIds.map((childId) => {
                    const child = children.find((c) => c.id === childId);
                    if (!child) return null;
                    return (
                      <label key={childId} className="flex items-center">
                        <input
                          type="radio"
                          checked={primaryChildId === childId}
                          onChange={() => setPrimaryChildId(childId)}
                          disabled={isLoading}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {child.lastName} {child.firstName}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {fieldErrors.primaryChildId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.primaryChildId}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isLoading ? 'アップロード中...' : 'アップロード'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
