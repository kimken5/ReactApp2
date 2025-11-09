import { useState, useEffect } from 'react';
import { dailyReportService } from '../services/dailyReportService';
import { masterService } from '../services/masterService';
import { DailyReportPhotoUpload } from './DailyReportPhotoUpload';
import type { DailyReportDto, UpdateDailyReportRequestDto } from '../types/dailyReport';
import type { ChildDto } from '../types/master';
import apiClient from '../services/apiClient';

interface DailyReportEditModalProps {
  reportId: number;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 日報編集モーダル
 */
export function DailyReportEditModal({ reportId, onClose, onSuccess }: DailyReportEditModalProps) {
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildDto[]>([]);

  // フォームデータ
  const [formData, setFormData] = useState({
    reportDate: '',
    reportKind: '',
    title: '',
    content: '',
    status: 'draft',
  });

  // 写真関連
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  useEffect(() => {
    loadReport();
    loadChildren();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await dailyReportService.getDailyReportById(reportId);
      setReport(data);

      // フォームデータを初期化
      setFormData({
        reportDate: data.reportDate.split('T')[0],
        reportKind: data.reportKind,
        title: data.title,
        content: data.content,
        status: data.status,
      });

      setExistingPhotos(data.photos || []);
    } catch (error) {
      console.error('日報の取得に失敗しました:', error);
      setErrorMessage('日報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const data = await masterService.getChildren();
      setChildren(data);
    } catch (error) {
      console.error('園児情報の取得に失敗しました:', error);
    }
  };

  const uploadPhotosToAzure = async (photos: File[], childId: number, staffId: number): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      try {
        const formData = new FormData();
        formData.append('File', photo);
        formData.append('StaffId', staffId.toString());
        formData.append('Description', '日報写真');
        formData.append('PublishedAt', new Date().toISOString());
        formData.append('VisibilityLevel', 'class');
        formData.append('Status', 'published');

        const response = await apiClient.post('/api/desktop/photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data && response.data.data) {
          // PhotoDtoはfilePathプロパティに完全なAzure Blob Storage URLを含む
          const photoUrl = response.data.data.filePath || response.data.data.fileName;
          if (photoUrl) {
            uploadedUrls.push(photoUrl);
            console.log('写真アップロード成功 - URL:', photoUrl);
          } else {
            console.error('写真URLが取得できませんでした:', response.data);
            throw new Error(`写真URLの取得に失敗しました: ${photo.name}`);
          }
        }
      } catch (error) {
        console.error('写真アップロードエラー:', photo.name, error);
        throw new Error(`写真のアップロードに失敗しました: ${photo.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published') => {
    e.preventDefault();

    if (!report) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // 新しい写真をアップロード
      let newPhotoUrls: string[] = [];
      if (uploadedPhotos.length > 0) {
        newPhotoUrls = await uploadPhotosToAzure(uploadedPhotos, report.childId, report.staffId);
      }

      // 既存の写真と新しい写真を結合
      const allPhotos = [...existingPhotos, ...newPhotoUrls];

      const updateData: UpdateDailyReportRequestDto = {
        reportDate: formData.reportDate,
        reportKind: formData.reportKind,
        title: formData.title,
        content: formData.content,
        photos: allPhotos,
        status: saveAs,
      };

      await dailyReportService.updateDailyReport(reportId, updateData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('日報の更新に失敗しました:', error);
      setErrorMessage(error.message || '日報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotosChange = (files: File[]) => {
    setUploadedPhotos(files);
  };

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
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
    return kindMap[reportKind] || reportKind;
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
              <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-6">
                {/* 基本情報（読み取り専用） */}
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
                  </div>
                </div>

                {/* 報告日 */}
                <div>
                  <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-2">
                    報告日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="reportDate"
                    value={formData.reportDate}
                    onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    required
                  />
                </div>

                {/* レポート種別 */}
                <div>
                  <label htmlFor="reportKind" className="block text-sm font-medium text-gray-700 mb-2">
                    レポート種別 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reportKind"
                    value={formData.reportKind}
                    onChange={(e) => setFormData({ ...formData, reportKind: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="activity">活動</option>
                    <option value="meal">食事</option>
                    <option value="sleep">睡眠</option>
                    <option value="health">健康</option>
                    <option value="incident">事故</option>
                    <option value="behavior">行動</option>
                  </select>
                </div>

                {/* タイトル */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    placeholder="例: 給食完食しました"
                    required
                  />
                </div>

                {/* 内容 */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                    placeholder="日報の内容を入力してください"
                    required
                  />
                </div>

                {/* 既存の写真 */}
                {existingPhotos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      既存の写真
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingPhotos.map((photoUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                          <img
                            src={photoUrl}
                            alt={`既存写真 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingPhoto(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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

                {/* 新しい写真アップロード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新しい写真を追加
                  </label>
                  <DailyReportPhotoUpload
                    uploadedPhotos={uploadedPhotos}
                    onPhotosChange={handlePhotosChange}
                  />
                </div>
              </form>
            )}
          </div>

          {/* フッター */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            {/* 下書き保存ボタン: 送信済みの場合は非表示 */}
            {report?.status !== 'published' && (
              <button
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={isSaving || !report}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '下書き保存'}
              </button>
            )}
            <button
              onClick={(e) => handleSubmit(e, 'published')}
              disabled={isSaving || !report}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (report?.status === 'published' ? '更新中...' : '送信中...') : (report?.status === 'published' ? '更新' : '送信')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
