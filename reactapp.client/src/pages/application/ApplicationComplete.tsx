import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ApplicationComplete() {
  const navigate = useNavigate();

  useEffect(() => {
    // ApplicationKeyをクリア(セキュリティのため)
    // ただし、保育園名は表示のため残す
    const nurseryName = sessionStorage.getItem('nurseryName');
    sessionStorage.clear();
    if (nurseryName) {
      sessionStorage.setItem('nurseryName', nurseryName);
    }

    // 下書きも削除
    localStorage.removeItem('application-form-draft');
  }, []);

  const handleClose = () => {
    // すべてのセッション情報をクリア
    sessionStorage.clear();
    localStorage.removeItem('application-form-draft');

    // トップページへ(または任意のページ)
    navigate('/');
  };

  const nurseryName = sessionStorage.getItem('nurseryName') || '保育園';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {/* 成功アイコン */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            申込を受け付けました
          </h1>

          <div className="mb-8 space-y-3">
            <p className="text-base text-gray-700">
              {nurseryName}への入園申込を受け付けました。
            </p>
            <p className="text-sm text-gray-600">
              担当者が申込内容を確認次第、ご連絡いたします。
            </p>
            <p className="text-sm text-gray-600">
              今しばらくお待ちください。
            </p>
          </div>

          {/* 注意事項 */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h2 className="text-sm font-bold text-blue-900 mb-2">ご注意</h2>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>申込内容の確認には数日かかる場合があります</li>
              <li>ご登録の電話番号またはメールアドレスにご連絡いたします</li>
              <li>申込内容に不明点がある場合は、保育園から直接ご連絡する場合があります</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
