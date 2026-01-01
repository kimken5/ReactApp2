import { useState } from 'react';
import type { NoPhotoChildInfoDto } from '../../types/photo';

interface NoPhotoWarningDialogProps {
  isOpen: boolean;
  noPhotoChildren: NoPhotoChildInfoDto[];
  warningMessage: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 撮影禁止園児警告ダイアログ
 * 撮影禁止設定の園児が含まれている場合に警告を表示し、
 * 確認チェックボックスによるユーザー確認を求める
 */
export function NoPhotoWarningDialog({
  isOpen,
  noPhotoChildren,
  warningMessage,
  onConfirm,
  onCancel,
}: NoPhotoWarningDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setIsConfirmed(false); // リセット
    }
  };

  const handleCancel = () => {
    setIsConfirmed(false); // リセット
    onCancel();
  };

  return (
    <>
      {/* オーバーレイ背景 */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={handleCancel} />

      {/* ダイアログコンテンツ */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">撮影禁止の園児が含まれています</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 mb-4">{warningMessage}</p>

          {/* NoPhoto Children List */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">撮影禁止設定の園児:</p>
            <ul className="space-y-2">
              {noPhotoChildren.map((child) => (
                <li key={child.childId} className="flex items-center text-sm text-gray-800">
                  <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{child.childName}</span>
                  {child.className && <span className="text-gray-500 ml-2">({child.className})</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>注意:</strong> 撮影禁止の設定がされている園児の写真は、保護者アプリで共有されません。
              この写真をアップロードする場合は、撮影禁止の園児が写っていないことを確認してください。
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start cursor-pointer p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">
              撮影禁止の園児が写っていないことを確認しました。アップロードを続行します。
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isConfirmed
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            確認してアップロード
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
