import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdKey, MdQrCode, MdDownload, MdDelete, MdRefresh } from 'react-icons/md';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../../services/apiClient';

interface ApplicationKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApplicationKeyStatus {
  applicationKey: string | null;
  applicationUrl: string | null;
  hasKey: boolean;
}

const ApplicationKeyModal: React.FC<ApplicationKeyModalProps> = ({ isOpen, onClose }) => {
  const [keyStatus, setKeyStatus] = useState<ApplicationKeyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchKeyStatus();
    }
  }, [isOpen]);

  const fetchKeyStatus = async () => {
    try {
      setIsLoading(true);
      setError('');

      // フロントエンドのベースURLを取得
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const response = await apiClient.get(`/api/desktop/master/application-key/status?baseUrl=${encodeURIComponent(baseUrl)}`);

      if (response.data.success) {
        setKeyStatus(response.data.data);
      } else {
        setError('ステータスの取得に失敗しました');
      }
    } catch (err: any) {
      console.error('Failed to fetch application key status:', err);
      setError('ステータスの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!confirm('新しい入園申込キーを生成しますか？\n既存のキーがある場合は上書きされます。')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // フロントエンドのベースURLを取得
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const response = await apiClient.post('/api/desktop/master/application-key/generate', { baseUrl });

      if (response.data.success) {
        setKeyStatus({
          applicationKey: response.data.data.applicationKey,
          applicationUrl: response.data.data.applicationUrl,
          hasKey: true
        });
      } else {
        setError(response.data.error?.message || 'キーの生成に失敗しました');
      }
    } catch (err: any) {
      console.error('Failed to generate application key:', err);
      setError(err.response?.data?.error?.message || 'キーの生成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm('入園申込キーを削除しますか？\nこの操作は取り消せません。')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await apiClient.delete('/api/desktop/master/application-key');

      if (response.data.success) {
        setKeyStatus({
          applicationKey: null,
          applicationUrl: null,
          hasKey: false
        });
      } else {
        setError('キーの削除に失敗しました');
      }
    } catch (err: any) {
      console.error('Failed to delete application key:', err);
      setError('キーの削除中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // SVGをPNGに変換してダウンロード
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `application-qr-${keyStatus?.applicationKey}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('クリップボードにコピーしました');
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MdKey className="text-2xl text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">入園申込キー管理</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : keyStatus?.hasKey ? (
            // キーが存在する場合
            <div className="space-y-4">
              {/* キー情報 */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    入園申込キー
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keyStatus.applicationKey || ''}
                      readOnly
                      className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(keyStatus.applicationKey || '')}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      コピー
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    入園申込URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keyStatus.applicationUrl || ''}
                      readOnly
                      className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                    <button
                      onClick={() => copyToClipboard(keyStatus.applicationUrl || '')}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>

              {/* QRコード */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MdQrCode className="text-lg text-gray-700" />
                  <h3 className="text-sm font-medium text-gray-800">QRコード</h3>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div ref={qrRef} className="bg-white p-2 rounded-lg shadow">
                    <QRCodeSVG
                      value={keyStatus.applicationUrl || ''}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <MdDownload className="text-lg" />
                    QRコードをダウンロード
                  </button>
                </div>
              </div>

              {/* アクション */}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateKey}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MdRefresh className="text-lg" />
                  キーを再生成
                </button>
                <button
                  onClick={handleDeleteKey}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MdDelete className="text-lg" />
                  キーを削除
                </button>
              </div>
            </div>
          ) : (
            // キーが存在しない場合
            <div className="text-center py-6 space-y-3">
              <div className="text-gray-500">
                <MdKey className="text-5xl mx-auto mb-2 opacity-30" />
                <p className="text-sm">入園申込キーが設定されていません</p>
                <p className="text-xs mt-1">キーを生成すると、入園申込URLとQRコードが発行されます</p>
              </div>
              <button
                onClick={handleGenerateKey}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MdKey className="text-lg" />
                キーを生成
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationKeyModal;
