/**
 * 鍵アクセスモーダル
 * 4桁のPINコード入力で制限メニューへのアクセスを許可
 */

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';

interface Props {
  onClose: () => void;
  onUnlock: () => void;
}

export function SecureAccessModal({ onClose, onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // モーダルが開いたら入力フィールドにフォーカス
    inputRef.current?.focus();
  }, []);

  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 数字のみ、最大4桁
    if (/^\d{0,4}$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError('4桁のコードを入力してください。');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // サーバー側でKeyLockCodeを検証
      const response = await apiClient.post('/api/desktop/master/verify-keylock', {
        code: pin
      });

      if (response.data.success && response.data.data.isValid) {
        // 成功
        onUnlock();
        onClose();
      } else {
        // 失敗
        setError(response.data.data.errorMessage || 'コードが正しくありません。');
        setPin('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('KeyLockCode verification error:', err);
      setError('検証中にエラーが発生しました。');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>鍵アクセス</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  🔒 制限メニューにアクセスするには4桁のコードを入力してください。
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="pin-code" className="block text-sm font-medium text-gray-700 mb-2">
                  アクセスコード <span className="text-red-500">*</span>
                </label>
                <input
                  ref={inputRef}
                  id="pin-code"
                  type="password"
                  name="secure-access-pin"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="****"
                  maxLength={4}
                  disabled={isValidating}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-2xl tracking-widest disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="\d{4}"
                  aria-required="true"
                  aria-invalid={!!error}
                  data-form-type="other"
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  数字4桁を入力してください
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">アクセス可能メニュー</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>保育園情報</li>
                  <li>保護者管理</li>
                  <li>職員管理</li>
                  <li>入園申込管理</li>
                  <li>年度管理</li>
                  <li>パスワード変更</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isValidating || pin.length !== 4}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isValidating && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isValidating ? '検証中...' : 'アクセス'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
