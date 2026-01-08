import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { DailyReportPhotoUpload } from '../components/DailyReportPhotoUpload';
import { dailyReportService } from '../services/dailyReportService';
import { masterService } from '../services/masterService';
import { apiClient } from '../services/apiClient';
import type {
  DailyReportDto,
  CreateDailyReportRequestDto,
  UpdateDailyReportRequestDto,
} from '../types/dailyReport';
import type { ChildDto, StaffDto } from '../types/master';
import {
  MdSportsSoccer,
  MdRestaurant,
  MdNightsStay,
  MdFavorite,
  MdWarning,
  MdEmojiPeople
} from 'react-icons/md';

/**
 * レポート作成/編集ページ
 * 新規作成モードと編集モードの両方に対応
 */
export function DailyReportFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const { state } = useDesktopAuth();

  // 写真機能の利用可否を取得
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true;

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [existingReport, setExistingReport] = useState<DailyReportDto | null>(null);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [staff, setStaff] = useState<StaffDto[]>([]);

  // フォーム入力値の状態（作成用）
  const [createFormData, setCreateFormData] = useState<CreateDailyReportRequestDto>({
    childId: 0,
    staffId: 0,
    reportDate: new Date().toISOString().split('T')[0],
    reportKind: '',
    title: '',
    content: '',
    photos: [],
    status: 'draft',
  });

  // フォーム入力値の状態（更新用）
  const [updateFormData, setUpdateFormData] = useState<UpdateDailyReportRequestDto>({
    reportDate: new Date().toISOString().split('T')[0],
    reportKind: '',
    title: '',
    content: '',
    photos: [],
    status: 'draft',
  });

  // 園児オートコンプリート用の状態
  const [childSearchQuery, setChildSearchQuery] = useState('');
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // 写真アップロード用の状態（ReportCreate.tsxと同じ仕様）
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  // レポート種別の選択肢
  const reportKindOptions = [
    { value: 'activity', label: '活動', icon: MdSportsSoccer, color: 'text-blue-500' },
    { value: 'meal', label: '食事', icon: MdRestaurant, color: 'text-orange-500' },
    { value: 'sleep', label: '睡眠', icon: MdNightsStay, color: 'text-indigo-500' },
    { value: 'health', label: '健康', icon: MdFavorite, color: 'text-red-500' },
    { value: 'incident', label: '事故', icon: MdWarning, color: 'text-yellow-600' },
    { value: 'behavior', label: '行動', icon: MdEmojiPeople, color: 'text-green-500' },
  ];

  // 選択されているレポート種別（配列として管理）
  const selectedReportKinds = isEditMode
    ? updateFormData.reportKind.split(',').filter(k => k)
    : createFormData.reportKind.split(',').filter(k => k);

  // フィルタリングされた園児リスト
  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(childSearchQuery.toLowerCase())
  );

  // 読み取り専用モードのチェック
  const isReadOnly = isEditMode && existingReport && (existingReport.status === 'published' || existingReport.status === 'archived');

  // マスタデータ読み込み
  useEffect(() => {
    loadMasterData();
  }, []);

  // 編集モードの場合、既存データを読み込む
  useEffect(() => {
    if (isEditMode && id) {
      loadReportData(Number(id));
    }
  }, [isEditMode, id]);

  const loadMasterData = async () => {
    try {
      const [childrenData, staffData] = await Promise.all([
        masterService.getChildren({ isActive: true }),
        masterService.getStaff({ isActive: true }),
      ]);
      setChildren(childrenData);
      setStaff(staffData);
    } catch (error) {
      console.error('マスタデータの取得に失敗しました:', error);
      setErrors({ general: 'マスタデータの取得に失敗しました' });
    }
  };

  const loadReportData = async (reportId: number) => {
    try {
      setIsLoading(true);
      const data = await dailyReportService.getDailyReportById(reportId);
      setExistingReport(data);
      setUpdateFormData({
        reportDate: data.reportDate.split('T')[0],
        reportKind: data.reportKind,
        title: data.title,
        content: data.content,
        photos: data.photos || [],
        status: data.status,
      });

      // 写真URLをFile配列に変換（ReportCreate.tsxと同じロジック）
      if (data.photos && data.photos.length > 0) {
        try {
          console.log('既存写真データ:', data.photos);
          // URLからダミーFileオブジェクトを作成（size=0で既存写真と判定）
          const photoFiles = data.photos.map(url => {
            return new File([], url.trim(), { type: 'image/jpeg' });
          });
          setUploadedPhotos(photoFiles);
          console.log('写真をFileオブジェクトに変換:', photoFiles);
        } catch (e) {
          console.error('写真の変換エラー:', e);
          setUploadedPhotos([]);
        }
      }
    } catch (error) {
      console.error('日報情報の取得に失敗しました:', error);
      setErrors({ general: '日報情報の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 作成フォーム入力値変更ハンドラ
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'childId' || name === 'staffId') {
      const numValue = parseInt(value, 10) || 0;
      setCreateFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 更新フォーム入力値変更ハンドラ
  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setUpdateFormData(prev => ({ ...prev, [name]: value }));

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 園児選択（オートコンプリート）
  const handleChildSelect = (child: ChildDto) => {
    setCreateFormData(prev => ({ ...prev, childId: child.childId }));
    setChildSearchQuery(child.className ? `${child.name}（${child.className}）` : child.name);
    setShowChildDropdown(false);

    if (errors.childId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.childId;
        return newErrors;
      });
    }
  };

  // レポート種別チェックボックス変更ハンドラー
  const handleReportKindToggle = (kind: string) => {
    const currentKinds = isEditMode
      ? updateFormData.reportKind.split(',').filter(k => k)
      : createFormData.reportKind.split(',').filter(k => k);

    const newKinds = currentKinds.includes(kind)
      ? currentKinds.filter(k => k !== kind)
      : [...currentKinds, kind];

    const reportKindString = newKinds.join(',');

    if (isEditMode) {
      setUpdateFormData(prev => ({ ...prev, reportKind: reportKindString }));
    } else {
      setCreateFormData(prev => ({ ...prev, reportKind: reportKindString }));
    }

    // エラークリア
    if (errors.reportKind) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.reportKind;
        return newErrors;
      });
    }
  };

  // 写真変更ハンドラ（ReportCreate.tsxと同じ仕様）
  const handlePhotosChange = (newPhotos: File[]) => {
    setUploadedPhotos(newPhotos);

    // エラークリア
    if (errors.photos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photos;
        return newErrors;
      });
    }
  };

  // 写真をAzure Blob Storageにアップロードする関数（ReportCreate.tsxと同じロジック）
  const uploadPhotosToAzure = async (photos: File[], childId: number, staffId: number): Promise<string[]> => {
    const uploadedFileNames: string[] = [];

    for (const photo of photos) {
      // 既存の写真（size=0のダミーファイル）はスキップ
      if (photo.size === 0) {
        uploadedFileNames.push(photo.name);
        console.log('既存の写真をスキップ:', photo.name);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('File', photo);  // Desktop用は'File'
        formData.append('StaffId', staffId.toString());  // 必須フィールド
        formData.append('Description', '日報写真');
        formData.append('PublishedAt', new Date().toISOString());
        formData.append('VisibilityLevel', 'class');
        formData.append('Status', 'published');
        formData.append('IsReportCreate', 'true');  // 日報作成フラグ: 写真管理画面には表示されない

        console.log('写真アップロード開始:', {
          fileName: photo.name,
          fileSize: photo.size,
          childId: childId,
          formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            value: value instanceof File ? `File(${value.name})` : value
          }))
        });

        const response = await apiClient.post('/api/desktop/photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('写真アップロードレスポンス:', response);

        if (response.data && response.data.data) {
          // Desktop APIのレスポンス形式: { success: true, data: PhotoDto, message: string }
          // PhotoDtoはfilePathプロパティに完全なAzure Blob Storage URLを含む
          const photoUrl = response.data.data.filePath || response.data.data.fileName;
          if (photoUrl) {
            uploadedFileNames.push(photoUrl);
            console.log('写真アップロード成功 - URL:', photoUrl);
          } else {
            console.error('写真URLが取得できませんでした:', response.data);
            throw new Error(`写真URLの取得に失敗しました: ${photo.name}`);
          }
        } else {
          console.error('無効なレスポンス形式:', response);
          throw new Error(`無効なレスポンス: ${photo.name}`);
        }
      } catch (error: any) {
        console.error('写真アップロードエラー詳細:', {
          error,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(`写真のアップロードに失敗しました: ${photo.name} (${error.response?.status || error.message})`);
      }
    }

    return uploadedFileNames;
  };

  // バリデーション（作成）
  const validateCreate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!createFormData.childId || createFormData.childId === 0) {
      newErrors.childId = '園児を選択してください';
    }

    if (!createFormData.staffId || createFormData.staffId === 0) {
      newErrors.staffId = '職員を選択してください';
    }

    if (!createFormData.reportDate) {
      newErrors.reportDate = '日報日付は必須です';
    } else {
      const reportDate = new Date(createFormData.reportDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate > today) {
        newErrors.reportDate = '日報日付に未来の日付は指定できません';
      }
    }

    if (!createFormData.reportKind || createFormData.reportKind.split(',').filter(k => k).length === 0) {
      newErrors.reportKind = 'レポート種別を少なくとも1つ選択してください';
    }

    if (!createFormData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (createFormData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!createFormData.content.trim()) {
      newErrors.content = '内容は必須です';
    } else if (createFormData.content.length > 1000) {
      newErrors.content = '内容は1000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // バリデーション（更新）
  const validateUpdate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!updateFormData.reportDate) {
      newErrors.reportDate = '日報日付は必須です';
    } else {
      const reportDate = new Date(updateFormData.reportDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate > today) {
        newErrors.reportDate = '日報日付に未来の日付は指定できません';
      }
    }

    if (!updateFormData.reportKind || updateFormData.reportKind.split(',').filter(k => k).length === 0) {
      newErrors.reportKind = 'レポート種別を少なくとも1つ選択してください';
    }

    if (!updateFormData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (updateFormData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!updateFormData.content.trim()) {
      newErrors.content = '内容は必須です';
    } else if (updateFormData.content.length > 1000) {
      newErrors.content = '内容は1000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下書き保存処理
  const handleSaveDraft = async () => {
    // バリデーション
    const isValid = isEditMode ? validateUpdate() : validateCreate();
    if (!isValid) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      // 写真をAzure Blob Storageにアップロード（ReportCreate.tsxと同じロジック）
      console.log('写真アップロード開始:', uploadedPhotos.length, '枚');
      const childId = isEditMode ? existingReport?.childId : createFormData.childId;
      const staffId = isEditMode ? existingReport?.staffId : createFormData.staffId;
      if (!childId) {
        throw new Error('園児IDが取得できません');
      }
      if (!staffId) {
        throw new Error('職員IDが取得できません');
      }
      const photoFileNames = await uploadPhotosToAzure(uploadedPhotos, childId, staffId);
      console.log('写真アップロード完了:', photoFileNames);

      if (isEditMode && id) {
        // 更新：一覧に戻る
        const updateDraftData = { ...updateFormData, photos: photoFileNames, status: 'draft' };
        await dailyReportService.updateDailyReport(Number(id), updateDraftData);
        setSuccessMessage('下書きを保存しました');
        setTimeout(() => {
          navigate('/desktop/dailyreports');
        }, 2000);
      } else {
        // 作成：フォームをクリアして継続入力
        const createDraftData = { ...createFormData, photos: photoFileNames, status: 'draft' };
        await dailyReportService.createDailyReport(createDraftData);
        setSuccessMessage('下書きを保存しました');

        // フォームをクリア
        setCreateFormData({
          childId: 0,
          staffId: 0,
          reportDate: new Date().toISOString().split('T')[0],
          reportKind: '',
          title: '',
          content: '',
          photos: [],
          status: 'draft',
        });
        setChildSearchQuery('');
        setUploadedPhotos([]);

        // スクロールをトップに戻す
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 3秒後に成功メッセージを消去
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error: any) {
      console.error('下書きの保存に失敗しました:', error);
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // 送信処理
  const handleSubmit = async () => {
    // バリデーション
    const isValid = isEditMode ? validateUpdate() : validateCreate();
    if (!isValid) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      // 写真をAzure Blob Storageにアップロード（ReportCreate.tsxと同じロジック）
      console.log('写真アップロード開始:', uploadedPhotos.length, '枚');
      const childId = isEditMode ? existingReport?.childId : createFormData.childId;
      const staffId = isEditMode ? existingReport?.staffId : createFormData.staffId;
      if (!childId) {
        throw new Error('園児IDが取得できません');
      }
      if (!staffId) {
        throw new Error('職員IDが取得できません');
      }
      const photoFileNames = await uploadPhotosToAzure(uploadedPhotos, childId, staffId);
      console.log('写真アップロード完了:', photoFileNames);

      if (isEditMode && id) {
        // 更新：一覧に戻る
        const updatePublishedData = { ...updateFormData, photos: photoFileNames, status: 'published' };
        await dailyReportService.updateDailyReport(Number(id), updatePublishedData);
        setSuccessMessage('レポートを送信しました');
        setTimeout(() => {
          navigate('/desktop/dailyreports');
        }, 2000);
      } else {
        // 作成：フォームをクリアして継続入力
        const createPublishedData = { ...createFormData, photos: photoFileNames, status: 'published' };
        await dailyReportService.createDailyReport(createPublishedData);
        setSuccessMessage('レポートを送信しました');

        // フォームをクリア
        setCreateFormData({
          childId: 0,
          staffId: 0,
          reportDate: new Date().toISOString().split('T')[0],
          reportKind: '',
          title: '',
          content: '',
          photos: [],
          status: 'draft',
        });
        setChildSearchQuery('');
        setUploadedPhotos([]);

        // スクロールをトップに戻す
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 3秒後に成功メッセージを消去
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error: any) {
      console.error('レポートの送信に失敗しました:', error);
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // エラーハンドリング
  const handleError = (error: any) => {
    console.error('Response data:', error.response?.data);
    console.error('Request data:', isEditMode ? updateFormData : createFormData);

    // エラーメッセージを詳細に表示
    if (error.response?.data?.errors) {
      const apiErrors: Record<string, string> = {};
      Object.entries(error.response.data.errors).forEach(([key, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          apiErrors[key.toLowerCase()] = messages[0];
        }
      });
      setErrors(apiErrors);
    } else {
      setErrors({ general: '処理に失敗しました' });
    }
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

  const formData = isEditMode ? updateFormData : createFormData;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'レポート編集' : 'レポート新規作成'}
          </h1>
        </div>

        {/* 読み取り専用メッセージ */}
        {isReadOnly && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            この日報は公開済みまたはアーカイブされているため、編集できません
          </div>
        )}

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

        {/* 全体エラーメッセージ */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errors.general}
          </div>
        )}

        {/* フォーム */}
        <div className="bg-white rounded-md shadow-md">
          <div className="p-6 space-y-6">
            {/* 園児選択（作成時のみ - オートコンプリート） */}
            {!isEditMode && (
              <div className="relative">
                <label htmlFor="childSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  園児 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="childSearch"
                  value={childSearchQuery}
                  onChange={(e) => {
                    setChildSearchQuery(e.target.value);
                    setShowChildDropdown(true);
                  }}
                  onFocus={() => setShowChildDropdown(true)}
                  disabled={isReadOnly || false}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    errors.childId ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="園児名を入力してください"
                  autoComplete="off"
                />
                {errors.childId && <p className="mt-1 text-sm text-red-600">{errors.childId}</p>}

                {/* オートコンプリートドロップダウン */}
                {showChildDropdown && childSearchQuery && filteredChildren.length > 0 && !isReadOnly && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredChildren.map((child) => (
                      <div
                        key={child.childId}
                        onClick={() => handleChildSelect(child)}
                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer transition"
                      >
                        <div className="font-medium text-gray-800">{child.name}</div>
                        {child.className && (
                          <div className="text-xs text-gray-500">{child.className}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 園児表示（編集時） */}
            {isEditMode && existingReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">園児</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {existingReport.childName} ({existingReport.className || '未所属'})
                </div>
              </div>
            )}

            {/* 職員選択（作成時のみ） */}
            {!isEditMode && (
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                  職員 <span className="text-red-600">*</span>
                </label>
                <select
                  id="staffId"
                  name="staffId"
                  value={createFormData.staffId}
                  onChange={handleCreateChange}
                  disabled={isReadOnly || false}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                    errors.staffId ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value={0}>選択してください</option>
                  {staff.map(s => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.staffId && <p className="mt-1 text-sm text-red-600">{errors.staffId}</p>}
              </div>
            )}

            {/* 職員表示（編集時） */}
            {isEditMode && existingReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">職員</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {existingReport.staffName}
                </div>
              </div>
            )}

            {/* 日報日付 */}
            <div>
              <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-2">
                日報日付 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="reportDate"
                name="reportDate"
                value={formData.reportDate}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.reportDate ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {errors.reportDate && <p className="mt-1 text-sm text-red-600">{errors.reportDate}</p>}
            </div>

            {/* レポート種別 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レポート種別 <span className="text-red-600">*</span>
              </label>
              <div className={`grid grid-cols-3 gap-3 p-4 border rounded-lg ${
                errors.reportKind ? 'border-red-500' : 'border-gray-300'
              } ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}>
                {reportKindOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition ${
                        isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReportKinds.includes(option.value)}
                        onChange={() => handleReportKindToggle(option.value)}
                        disabled={isReadOnly || false}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400 focus:ring-2"
                      />
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.reportKind && <p className="mt-1 text-sm text-red-600">{errors.reportKind}</p>}
            </div>

            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                maxLength={200}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="例: 今日の給食の様子"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/200文字</p>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* 内容 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                内容 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={isEditMode ? handleUpdateChange : handleCreateChange}
                disabled={isReadOnly || false}
                maxLength={1000}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                } ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="日報の内容を入力してください"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.content.length}/1000文字</p>
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
            </div>

            {/* 写真アップロード（写真機能が有効な場合のみ表示） */}
            {photoFunctionEnabled && (
              <DailyReportPhotoUpload
                uploadedPhotos={uploadedPhotos}
                onPhotosChange={handlePhotosChange}
                disabled={isReadOnly || false}
                maxPhotos={10}
                maxFileSize={10 * 1024 * 1024}
              />
            )}
            {errors.photos && <p className="mt-1 text-sm text-red-600">{errors.photos}</p>}

          </div>

          {/* ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/desktop/dailyreports')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition"
            >
              キャンセル
            </button>
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className={`px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium transition ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  {isSaving ? (
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
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  {isSaving ? (
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
                      送信中...
                    </span>
                  ) : (
                    '送信する'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
