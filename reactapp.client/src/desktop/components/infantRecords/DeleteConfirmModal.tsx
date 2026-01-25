import { useState } from 'react';
import { MdWarning } from 'react-icons/md';

/**
 * 乳児記録削除確認モーダル（汎用）
 */

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recordType: string; // '食事記録', 'ミルク記録', '睡眠記録', '排泄記録', '機嫌記録', '室温・湿度記録'
  recordDetails: string; // '山田太郎 10:00', '佐藤花子 昼食' など
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  recordType,
  recordDetails,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('削除に失敗しました:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[60] transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{recordType}の削除</h2>
                <p className="text-sm text-gray-600 mt-1">この操作は取り消せません</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-700">
              以下の{recordType}を削除してもよろしいですか?
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{recordDetails}</p>
            </div>
            <p className="mt-3 text-sm text-red-600">
              ※ 削除後は復元できません。本当に削除する場合のみ「削除する」ボタンを押してください。
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className={`px-6 py-2 bg-red-600 text-white rounded-md font-medium transition-all duration-200 ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 hover:shadow-md'
              }`}
            >
              {isDeleting ? (
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
                  削除中...
                </span>
              ) : (
                '削除する'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
