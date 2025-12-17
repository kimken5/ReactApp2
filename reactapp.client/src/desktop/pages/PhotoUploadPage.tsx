import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { photoService } from '../services/photoService';
import { masterService } from '../services/masterService';
import { NoPhotoWarningDialog } from '../components/photo/NoPhotoWarningDialog';
import type { UploadPhotoRequestDto, ValidateChildrenForPhotoResponseDto } from '../types/photo';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

/**
 * 写真アップロードページ
 * 写真のアップロードとメタデータ登録を行う
 */
export function PhotoUploadPage() {
  const navigate = useNavigate();

  // Form state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileSizes, setFileSizes] = useState<number[]>([]);
  const [imageDimensionsList, setImageDimensionsList] = useState<Array<{ width: number; height: number }>>([]);

  const [description, setDescription] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [visibilityLevel, setVisibilityLevel] = useState<'class' | 'grade' | 'all'>('class');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetGrade, setTargetGrade] = useState<number | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);
  const [primaryChildId, setPrimaryChildId] = useState<number | null>(null);
  const [childSelectionMode, setChildSelectionMode] = useState<'individual' | 'class'>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Master data
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // NoPhoto warning dialog state
  const [showNoPhotoWarning, setShowNoPhotoWarning] = useState(false);
  const [noPhotoValidationResult, setNoPhotoValidationResult] =
    useState<ValidateChildrenForPhotoResponseDto | null>(null);
  const [pendingAction, setPendingAction] = useState<'draft' | 'publish' | null>(null);

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

  // Handle file selection (multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      resetFileState();
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    const newFileSizes: number[] = [];
    const newImageDimensions: Array<{ width: number; height: number }> = [];

    let hasError = false;
    let errorMessage = '';

    // Validate all files
    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        hasError = true;
        errorMessage = '画像ファイル（JPEG、PNG、WebP）のみアップロード可能です';
        return;
      }

      if (file.size > maxSize) {
        hasError = true;
        errorMessage = 'ファイルサイズは50MB以下にしてください';
        return;
      }

      newFiles.push(file);
      newFileSizes.push(file.size);
    });

    if (hasError) {
      setFieldErrors((prev) => ({ ...prev, file: errorMessage }));
      resetFileState();
      return;
    }

    // Clear file error
    setFieldErrors((prev) => {
      const { file, ...rest } = prev;
      return rest;
    });

    setSelectedFiles(newFiles);
    setFileSizes(newFileSizes);

    // Create previews for all files
    newFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;

        setPreviewUrls((prev) => {
          const updated = [...prev];
          updated[index] = imageUrl;
          return updated;
        });

        // Extract image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensionsList((prev) => {
            const updated = [...prev];
            updated[index] = { width: img.width, height: img.height };
            return updated;
          });
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const resetFileState = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFileSizes([]);
    setImageDimensionsList([]);
  };

  // Remove a specific file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFileSizes((prev) => prev.filter((_, i) => i !== index));
    setImageDimensionsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle child selection mode change
  const handleSelectionModeChange = (mode: 'individual' | 'class') => {
    setChildSelectionMode(mode);
    // Clear selections when changing mode
    setSelectedChildIds([]);
    setSelectedClassIds([]);
    setPrimaryChildId(null);
    setSearchQuery('');
  };

  // Handle individual child selection
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

  // Handle class selection
  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) => {
      if (prev.includes(classId)) {
        // Remove class
        const newClassIds = prev.filter((id) => id !== classId);
        // Remove children from this class
        const childrenInClass = children.filter((c) => c.classId === classId).map((c) => c.childId);
        setSelectedChildIds((prevChildIds) => prevChildIds.filter((id) => !childrenInClass.includes(id)));
        return newClassIds;
      } else {
        // Add class
        const newClassIds = [...prev, classId];
        // Add all children from this class
        const childrenInClass = children.filter((c) => c.classId === classId).map((c) => c.childId);
        setSelectedChildIds((prevChildIds) => [...new Set([...prevChildIds, ...childrenInClass])]);
        return newClassIds;
      }
    });
  };

  // Filter children by search query
  const filteredChildren = children.filter((child) => {
    if (!searchQuery) return true;
    const name = child.name;
    const furigana = child.furigana || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      furigana.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle search input with autocomplete
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle selecting child from autocomplete
  const handleSelectFromAutocomplete = (childId: number) => {
    if (!selectedChildIds.includes(childId)) {
      setSelectedChildIds((prev) => [...prev, childId]);
    }
    setSearchQuery('');
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (selectedFiles.length === 0) {
      errors.file = '画像ファイルを選択してください';
    }

    if (!selectedStaffId) {
      errors.staffId = '職員を選択してください';
    }

    if (visibilityLevel === 'class' && !targetClassId) {
      errors.targetClassId = 'クラスを選択してください';
    }

    if (visibilityLevel === 'grade' && targetGrade === null) {
      errors.targetGrade = '学年を選択してください';
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

  // Validate children for NoPhoto setting
  const validateChildrenForNoPhoto = async (): Promise<boolean> => {
    if (selectedChildIds.length === 0) {
      return true; // No children selected, skip validation
    }

    try {
      const result = await photoService.validateChildrenForPhoto({
        childIds: selectedChildIds,
      });

      if (result.hasNoPhotoChildren) {
        setNoPhotoValidationResult(result);
        setShowNoPhotoWarning(true);
        return false; // Show warning dialog
      }

      return true; // No NoPhoto children, proceed
    } catch (error) {
      console.error('園児の撮影禁止チェックに失敗しました:', error);
      // エラーが発生しても警告を表示せずに続行（フォールバック）
      return true;
    }
  };

  // Execute upload after NoPhoto warning confirmation
  const executeUpload = async (status: 'draft' | 'published') => {
    setIsLoading(true);

    try {
      // Upload all files sequentially
      const uploadedPhotos = [];
      for (const file of selectedFiles) {
        const request: UploadPhotoRequestDto = {
          file,
          description: description.trim() || undefined,
          publishedAt: new Date().toISOString(), // 現在時刻
          visibilityLevel,
          targetClassId: visibilityLevel === 'class' ? targetClassId : undefined,
          targetGrade: visibilityLevel === 'grade' ? targetGrade ?? undefined : undefined,
          status,
          staffId: selectedStaffId!,
          childIds: selectedChildIds,
          primaryChildId: primaryChildId || undefined,
        };

        const uploadedPhoto = await photoService.uploadPhoto(request);
        uploadedPhotos.push(uploadedPhoto);
      }

      // Navigate to photo list page after all uploads complete
      navigate('/desktop/photos');
    } catch (error: any) {
      console.error('アップロードに失敗しました:', error);
      setErrorMessage(
        error.response?.data?.message || 'アップロードに失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  // Handle NoPhoto warning confirmation
  const handleNoPhotoConfirm = () => {
    setShowNoPhotoWarning(false);
    if (pendingAction) {
      executeUpload(pendingAction);
    }
  };

  // Handle NoPhoto warning cancel
  const handleNoPhotoCancel = () => {
    setShowNoPhotoWarning(false);
    setPendingAction(null);
    setNoPhotoValidationResult(null);
  };

  // Handle save as draft (multiple files)
  const handleSaveDraft = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('入力内容に誤りがあります。各項目を確認してください。');
      return;
    }

    if (selectedFiles.length === 0 || !selectedStaffId) {
      return;
    }

    // Validate NoPhoto setting
    const isValidated = await validateChildrenForNoPhoto();
    if (!isValidated) {
      setPendingAction('draft');
      return; // Wait for user confirmation in dialog
    }

    // No NoPhoto children, proceed with upload
    await executeUpload('draft');
  };

  // Handle publish (multiple files)
  const handlePublish = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('入力内容に誤りがあります。各項目を確認してください。');
      return;
    }

    if (selectedFiles.length === 0 || !selectedStaffId) {
      return;
    }

    // Validate NoPhoto setting
    const isValidated = await validateChildrenForNoPhoto();
    if (!isValidated) {
      setPendingAction('publish');
      return; // Wait for user confirmation in dialog
    }

    // No NoPhoto children, proceed with upload
    await executeUpload('published');
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

        <div className="bg-white shadow-md rounded-lg border border-gray-200">
          <div className="p-6 space-y-6">
            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像ファイル <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={isLoading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {fieldErrors.file && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.file}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                JPEG、PNG、WebP形式のみ対応。最大ファイルサイズ: 50MB（複数選択可能）
              </p>

              {/* Preview (multiple files) */}
              {previewUrls.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    選択中の写真: {selectedFiles.length}枚
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative border border-gray-300 rounded-lg p-2 bg-gray-50">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="truncate">{selectedFiles[index]?.name}</p>
                          <p>サイズ: {formatFileSize(fileSizes[index])}</p>
                          {imageDimensionsList[index] && (
                            <p>
                              {imageDimensionsList[index].width} × {imageDimensionsList[index].height} px
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isLoading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
                placeholder="写真の説明を入力してください（任意）"
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{description.length} / 500 文字</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
              >
                <option value="">職員を選択してください</option>
                {staffList.map((staff) => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name}
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
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="class"
                    checked={visibilityLevel === 'class'}
                    onChange={(e) => setVisibilityLevel(e.target.value as 'class' | 'grade' | 'all')}
                    disabled={isLoading}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-400"
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
                    className="h-4 w-4 text-orange-600 focus:ring-orange-400"
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
                    className="h-4 w-4 text-orange-600 focus:ring-orange-400"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
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

            {/* Target Grade (conditional) */}
            {visibilityLevel === 'grade' && (
              <div>
                <label htmlFor="targetGrade" className="block text-sm font-medium text-gray-700 mb-2">
                  対象学年 <span className="text-red-500">*</span>
                </label>
                <select
                  id="targetGrade"
                  value={targetGrade ?? ''}
                  onChange={(e) => setTargetGrade(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
                >
                  <option value="">学年を選択してください</option>
                  <option value="0">0歳児</option>
                  <option value="1">1歳児</option>
                  <option value="2">2歳児</option>
                  <option value="3">3歳児</option>
                  <option value="4">4歳児</option>
                  <option value="5">5歳児</option>
                </select>
                {fieldErrors.targetGrade && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.targetGrade}</p>
                )}
              </div>
            )}

            {/* Child Selection Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                園児選択方法 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="individual"
                    checked={childSelectionMode === 'individual'}
                    onChange={() => handleSelectionModeChange('individual')}
                    disabled={isLoading}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-400"
                  />
                  <span className="ml-2 text-sm text-gray-700">個別選択</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="class"
                    checked={childSelectionMode === 'class'}
                    onChange={() => handleSelectionModeChange('class')}
                    disabled={isLoading}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-400"
                  />
                  <span className="ml-2 text-sm text-gray-700">クラス毎</span>
                </label>
              </div>
            </div>

            {/* Individual Child Selection with Autocomplete */}
            {childSelectionMode === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  写っている園児 <span className="text-red-500">*</span>
                </label>

                {/* Search/Autocomplete Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    disabled={isLoading}
                    placeholder="園児名またはふりがなで検索..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100"
                  />

                  {/* Autocomplete Dropdown */}
                  {searchQuery && filteredChildren.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredChildren.map((child) => (
                        <button
                          key={child.childId}
                          type="button"
                          onClick={() => handleSelectFromAutocomplete(child.childId)}
                          disabled={isLoading || selectedChildIds.includes(child.childId)}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span>
                              {child.name}
                              {child.furigana && <span className="text-gray-500 text-xs ml-2">({child.furigana})</span>}
                            </span>
                            {child.className && (
                              <span className="text-gray-500 text-xs">{child.className}</span>
                            )}
                          </div>
                          {selectedChildIds.includes(child.childId) && (
                            <span className="text-green-600 text-xs">✓ 選択済み</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredChildren.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <p className="text-sm text-gray-500">該当する園児が見つかりません</p>
                    </div>
                  )}
                </div>

                {/* Selected Children Display */}
                <div className="border border-gray-300 rounded-lg p-4 min-h-[100px]">
                  {selectedChildIds.length === 0 ? (
                    <p className="text-sm text-gray-500">選択された園児はいません</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedChildIds.map((childId) => {
                        const child = children.find((c) => c.childId === childId);
                        if (!child) return null;
                        return (
                          <div key={childId} className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">
                              {child.name}
                              {child.className && <span className="text-gray-500 ml-2">({child.className})</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleChildToggle(childId)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                            >
                              削除
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {fieldErrors.childIds && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.childIds}</p>
                )}
              </div>
            )}

            {/* Class-based Child Selection */}
            {childSelectionMode === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  クラス選択 <span className="text-red-500">*</span>
                </label>

                <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                  {classes.length === 0 ? (
                    <p className="text-sm text-gray-500">クラスデータがありません</p>
                  ) : (
                    classes.map((classItem) => {
                      const childrenInClass = children.filter((c) => c.classId === classItem.classId);
                      const isClassSelected = selectedClassIds.includes(classItem.classId);

                      return (
                        <div key={classItem.classId} className="border border-gray-200 rounded-lg p-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isClassSelected}
                              onChange={() => handleClassToggle(classItem.classId)}
                              disabled={isLoading}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-400 rounded"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {classItem.name}
                              <span className="ml-2 text-gray-500 font-normal">
                                ({childrenInClass.length}名)
                              </span>
                            </span>
                          </label>

                          {isClassSelected && childrenInClass.length > 0 && (
                            <div className="mt-2 ml-7 pl-3 border-l-2 border-orange-200">
                              <div className="flex flex-wrap gap-2">
                                {childrenInClass.map((child) => (
                                  <label key={child.childId} className="flex items-center cursor-pointer bg-orange-50 px-2 py-1 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selectedChildIds.includes(child.childId)}
                                      onChange={() => handleChildToggle(child.childId)}
                                      disabled={isLoading}
                                      className="h-3 w-3 text-orange-600 focus:ring-orange-400 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      {child.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedChildIds.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      選択中の園児: <span className="font-medium">{selectedChildIds.length}名</span>
                    </p>
                  </div>
                )}

                {fieldErrors.childIds && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.childIds}</p>
                )}
              </div>
            )}

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
                      className="h-4 w-4 text-orange-600 focus:ring-orange-400"
                    />
                    <span className="ml-2 text-sm text-gray-700">指定なし</span>
                  </label>
                  {selectedChildIds.map((childId) => {
                    const child = children.find((c) => c.childId === childId);
                    if (!child) return null;
                    return (
                      <label key={childId} className="flex items-center">
                        <input
                          type="radio"
                          checked={primaryChildId === childId}
                          onChange={() => setPrimaryChildId(childId)}
                          disabled={isLoading}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-400"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {child.name}
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

          </div>

          {/* フッター（キャンセル・下書き・公開ボタン） */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className={`px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
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
                  保存中...
                </span>
              ) : (
                '下書き'
              )}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isLoading}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                  公開中...
                </span>
              ) : (
                '公開'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NoPhoto Warning Dialog */}
      {noPhotoValidationResult && (
        <NoPhotoWarningDialog
          isOpen={showNoPhotoWarning}
          noPhotoChildren={noPhotoValidationResult.noPhotoChildren}
          warningMessage={noPhotoValidationResult.warningMessage || ''}
          onConfirm={handleNoPhotoConfirm}
          onCancel={handleNoPhotoCancel}
        />
      )}
    </DashboardLayout>
  );
}
