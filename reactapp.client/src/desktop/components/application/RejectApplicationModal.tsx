/**
 * 却下処理モーダル
 */

import React, { useState, useEffect } from 'react';
import { rejectApplication } from '../../../services/desktopApplicationService';

interface Props {
  applicationId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function RejectApplicationModal({ applicationId, onClose, onSuccess }: Props) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!rejectionReason.trim()) {
      setError('却下理由を入力してください。');
      return;
    }

    if (rejectionReason.length > 500) {
      setError('却下理由は500文字以内で入力してください。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await rejectApplication(applicationId, {
        rejectionReason: rejectionReason.trim(),
      });

      // 成功メッセージを設定（モーダル内に表示）
      setSuccessMessage('申込を却下しました。');

      // 2秒後にモーダルを閉じてリストを更新
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('却下処理に失敗しました。');
      }
      setIsSubmitting(false);
    }
  };

  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              申込却下
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        <form onSubmit={handleReject}>
          <div className="p-6">
            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 whitespace-pre-line">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ この申込を却下します。却下後は元に戻すことができません。
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
                却下理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="却下理由を入力してください（必須、500文字以内）"
                disabled={isSubmitting}
                maxLength={500}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-required="true"
                aria-invalid={!!error}
              />
              <p className="mt-1 text-sm text-gray-500 text-right">
                {rejectionReason.length} / 500 文字
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">却下後の処理</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>申込のステータスが「却下済み」に変更されます</li>
                <li>却下理由が記録されます</li>
                <li>再度インポートすることはできません</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting ? '却下処理中...' : '却下実行'}</span>
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
