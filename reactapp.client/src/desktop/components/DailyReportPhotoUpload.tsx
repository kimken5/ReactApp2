import { useRef } from 'react';
import { MdCloudUpload, MdDelete } from 'react-icons/md';

/**
 * 日報写真アップロードコンポーネント
 * ReportCreate.tsxの仕様に準拠
 * - ローカルでFileオブジェクトとして管理
 * - 保存時に一括でAzure Blob Storageにアップロード
 * - 既存写真はsize=0のダミーFileオブジェクトとして扱う
 */

interface DailyReportPhotoUploadProps {
  uploadedPhotos: File[];
  onPhotosChange: (photos: File[]) => void;
  disabled?: boolean;
  maxPhotos?: number;
  maxFileSize?: number;
}

export function DailyReportPhotoUpload({
  uploadedPhotos,
  onPhotosChange,
  disabled = false,
  maxPhotos = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
}: DailyReportPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択ハンドラ
   * ReportCreate.tsxのhandlePhotoUploadと同じロジック
   */
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }

    // ファイル形式とサイズの検証
    const validPhotos = Array.from(files).filter(file =>
      file.type.startsWith('image/') && file.size <= maxFileSize
    );

    if (validPhotos.length === 0) {
      alert(`有効な画像ファイルを選択してください（${Math.floor(maxFileSize / 1024 / 1024)}MB以下）`);
      return;
    }

    // 最大枚数チェック
    const totalPhotos = uploadedPhotos.length + validPhotos.length;
    if (totalPhotos > maxPhotos) {
      alert(`写真は最大${maxPhotos}枚までアップロードできます`);
      const allowedCount = maxPhotos - uploadedPhotos.length;
      if (allowedCount > 0) {
        onPhotosChange([...uploadedPhotos, ...validPhotos.slice(0, allowedCount)]);
      }
      return;
    }

    // 選択したファイルをローカルに保存（アップロードは保存時に実施）
    onPhotosChange([...uploadedPhotos, ...validPhotos]);
    console.log('写真を選択しました:', validPhotos.map(f => f.name));

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 写真削除ハンドラ
   * ReportCreate.tsxのhandlePhotoRemoveと同じロジック
   */
  const handlePhotoRemove = (index: number) => {
    const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        写真アップロード
        <span className="text-xs text-gray-500 font-normal ml-2">(任意)</span>
      </label>

      {/* アップロードボタン */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={disabled}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className={`inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium transition cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          <MdCloudUpload className="w-5 h-5" />
          写真を選択
        </label>
        <div className="text-xs text-gray-500 mt-2">
          JPG, PNG形式・最大{Math.floor(maxFileSize / 1024 / 1024)}MBまで・複数選択可能
        </div>
      </div>

      {/* アップロード済み写真一覧 */}
      {uploadedPhotos.length > 0 && (
        <div>
          <div className="text-sm font-bold text-gray-800 mb-3">
            アップロード済み写真 ({uploadedPhotos.length}枚)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedPhotos.map((photo, index) => {
              // 既存の写真（size=0のダミーファイル）かどうかで判定
              const isExistingPhoto = photo.size === 0;
              const photoUrl = isExistingPhoto
                ? photo.name  // バックエンドから完全なURLが返される
                : URL.createObjectURL(photo);

              console.log(`写真 ${index + 1}:`, {
                name: photo.name,
                size: photo.size,
                isExisting: isExistingPhoto,
                url: photoUrl
              });

              return (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50"
                >
                  <img
                    src={photoUrl}
                    alt={`アップロード写真 ${index + 1}`}
                    className="w-full h-30 object-cover"
                    onError={(e) => {
                      // 画像読み込みエラー時のフォールバック
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23f1f5f9" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="14"%3E読み込みエラー%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-2 py-1 text-xs flex justify-between items-center">
                    <span className="truncate flex-1">{photo.name}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="ml-2 text-white hover:text-red-300 transition"
                        title="削除"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
