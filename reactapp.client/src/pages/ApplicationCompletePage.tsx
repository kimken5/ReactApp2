/**
 * 入園申込完了ページ
 * URL: /application/complete
 */

export function ApplicationCompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-md border border-gray-100 p-8">
        {/* 成功アイコン */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">申込完了</h1>
          <p className="text-lg text-gray-600">入園申込を受け付けました</p>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 text-center text-sm text-gray-500">
          <p>
            お問い合わせは保育園まで直接ご連絡ください。
            <br />
            このページは保護者向け入園申込システムです。
          </p>
        </div>
      </div>
    </div>
  );
}
