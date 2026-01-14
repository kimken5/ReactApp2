/**
 * スキャンフィードバックコンポーネント
 * バーコードスキャン成功/失敗時のビジュアルフィードバックを表示
 */

import { useEffect } from 'react';

interface ScanFeedbackProps {
  type: 'success' | 'error' | null;
  message: string;
  onClose: () => void;
  duration?: number; // ミリ秒（デフォルト: 3000）
  entryType?: 'Entry' | 'Exit'; // 入園/退園種別
}

export function ScanFeedback({ type, message, onClose, duration = 3000, entryType = 'Entry' }: ScanFeedbackProps) {
  useEffect(() => {
    if (type) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  if (!type) {
    return null;
  }

  const isSuccess = type === 'success';
  const isExit = entryType === 'Exit';
  const successColor = isSuccess && isExit ? 'orange' : isSuccess ? 'green' : 'red';

  return (
    <>
      {/* 全画面フラッシュオーバーレイ */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-200 ${
          successColor === 'green' ? 'bg-green-500' : successColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'
        } ${type ? 'opacity-20' : 'opacity-0'}`}
      />

      {/* メッセージボックス */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className={`transform transition-all duration-200 ${
            type ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div
            className={`rounded-2xl shadow-2xl p-8 max-w-md w-full ${
              successColor === 'green'
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : successColor === 'orange'
                ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              {/* アイコン */}
              <div className="mb-4">
                {isSuccess ? (
                  <svg
                    className="w-24 h-24 text-white animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-24 h-24 text-white animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              {/* メッセージ */}
              <p className="text-white text-3xl font-bold leading-tight whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ScanFeedback;
