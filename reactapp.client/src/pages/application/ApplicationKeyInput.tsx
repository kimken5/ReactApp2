import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateApplicationKey } from '../../services/applicationService';
import { applicationKeySchema } from '../../utils/applicationValidation';
import { z } from 'zod';

export function ApplicationKeyInput() {
  const navigate = useNavigate();
  const [applicationKey, setApplicationKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    try {
      applicationKeySchema.parse({ applicationKey });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const result = await validateApplicationKey(applicationKey);

      if (result.isValid) {
        // ApplicationKeyと保育園情報をsessionStorageに保存
        sessionStorage.setItem('applicationKey', applicationKey);
        sessionStorage.setItem('nurseryId', result.nurseryId?.toString() || '');
        sessionStorage.setItem('nurseryName', result.nurseryName || '');

        // 申込フォーム画面へ遷移
        navigate('/application/form');
      } else {
        setError('無効な申込キーです。');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('ApplicationKeyの検証に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            入園申込フォーム
          </h1>
          <p className="text-sm text-gray-600">
            QRコードに記載されている申込キーを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="applicationKey" className="block text-sm font-medium text-gray-700 mb-2">
              申込キー <span className="text-red-500">*</span>
            </label>
            <input
              id="applicationKey"
              type="text"
              value={applicationKey}
              onChange={(e) => setApplicationKey(e.target.value)}
              className={`
                w-full px-4 py-3 border rounded-lg text-center text-lg tracking-wider
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${error ? 'border-red-500' : 'border-gray-300'}
              `}
              placeholder="例: test-application-key-2025"
              disabled={isLoading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'key-error' : undefined}
            />
            {error && (
              <p id="key-error" className="mt-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !applicationKey}
            className="
              w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                確認中...
              </span>
            ) : (
              '次へ'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            申込キーをお持ちでない方は、保育園にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
