/**
 * 入退登録画面
 * URL: /entry-exit/registration
 * タブレット端末専用のバーコードスキャン入退登録画面
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEntryExitLog } from '../../services/entryExitService';
import { useHeartbeat } from '../../hooks/useHeartbeat';
import { ScanFeedback } from '../../components/entry-exit/ScanFeedback';

interface AuthData {
  token: string;
  nurseryId: number;
  nurseryName: string;
  expiresAt: string;
  loginAt: string;
}

export function EntryExitRegistrationPage() {
  const navigate = useNavigate();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [entryType, setEntryType] = useState<'Entry' | 'Exit'>('Entry');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const inputRef = useRef<HTMLInputElement>(null);

  // 認証チェック
  useEffect(() => {
    const stored = localStorage.getItem('entry_exit_auth');
    if (!stored) {
      navigate('/entry-exit/login');
      return;
    }

    try {
      const auth = JSON.parse(stored) as AuthData;
      setAuthData(auth);
    } catch (error) {
      console.error('認証情報の読み込みエラー:', error);
      navigate('/entry-exit/login');
    }
  }, [navigate]);

  // ハートビート（一時的に無効化 - トークンは1時間有効）
  useHeartbeat(authData?.token || null, {
    enabled: false, // 一時的に無効化
    interval: 30000, // 30秒
    onSuccess: (newToken, expiresAt) => {
      if (authData) {
        const updatedAuth = { ...authData, token: newToken, expiresAt };
        setAuthData(updatedAuth);
        localStorage.setItem('entry_exit_auth', JSON.stringify(updatedAuth));
      }
    },
    onError: (error) => {
      console.error('ハートビートエラー:', error);
      // トークンが無効になった場合はログイン画面に戻る
      if (error.message.includes('無効') || error.message.includes('expired')) {
        localStorage.removeItem('entry_exit_auth');
        navigate('/entry-exit/login');
      }
    },
  });

  // 現在時刻の更新（1秒ごと）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // バーコード入力フィールドに常にフォーカス
  useEffect(() => {
    const interval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // バーコードスキャン処理
  const handleScan = useCallback(
    async (scannedValue: string) => {
      if (!authData) return;

      const parentId = parseInt(scannedValue, 10);
      if (isNaN(parentId)) {
        setFeedback({
          type: 'error',
          message: '無効なバーコードです',
        });
        return;
      }

      try {
        const result = await createEntryExitLog(
          {
            parentId,
            nurseryId: authData.nurseryId,
            entryType,
          },
          authData.token
        );

        // 成功メッセージ
        const message =
          entryType === 'Entry'
            ? `${result.parentName}さん。\nおはようございます。`
            : `${result.parentName}さん。\nお疲れ様でした。`;

        setFeedback({
          type: 'success',
          message,
        });
      } catch (error: any) {
        console.error('スキャンエラー:', error);
        setFeedback({
          type: 'error',
          message: error.message || '登録に失敗しました',
        });
      }
    },
    [authData, entryType]
  );

  // キーボード入力処理（バーコードスキャナー）
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (value) {
        handleScan(value);
        e.currentTarget.value = '';
      }
    }
  };

  // ログアウト
  const handleLogout = () => {
    localStorage.removeItem('entry_exit_auth');
    navigate('/entry-exit/login');
  };

  // フィードバックを閉じる
  const closeFeedback = useCallback(() => {
    setFeedback({ type: null, message: '' });
  }, []);

  if (!authData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* スキャンフィードバック */}
      <ScanFeedback
        type={feedback.type}
        message={feedback.message}
        onClose={closeFeedback}
        duration={3000}
        entryType={entryType}
      />

      {/* ヘッダー */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{authData.nurseryName}</h1>
            <p className="text-sm text-gray-600">入退管理</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            ログアウト
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* メイン操作エリア */}
          <div className="space-y-6">
            {/* 日時表示 */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600 text-lg mb-2">{formatDate(currentTime)}</p>
              <p className="text-6xl font-bold text-gray-900 tabular-nums">
                {formatTime(currentTime)}
              </p>
            </div>

            {/* 入/出 トグル */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">入退種別</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setEntryType('Entry')}
                  className={`py-6 rounded-lg font-bold text-2xl transition ${
                    entryType === 'Entry'
                      ? 'bg-green-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  入
                </button>
                <button
                  onClick={() => setEntryType('Exit')}
                  className={`py-6 rounded-lg font-bold text-2xl transition ${
                    entryType === 'Exit'
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  出
                </button>
              </div>
            </div>

            {/* スキャン待機状態 */}
            <div className={`bg-gradient-to-br ${
              entryType === 'Entry'
                ? 'from-green-500 to-green-600'
                : 'from-orange-500 to-orange-600'
            } rounded-lg shadow-xl p-12 text-center`}>
              <div className="mb-6">
                <svg
                  className="w-32 h-32 text-white mx-auto animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h2 className="text-white text-3xl font-bold mb-4">バーコードをスキャンしてください</h2>
              <p className="text-white text-5xl font-bold">
                {entryType === 'Entry' ? '入園' : '退園'}モード
              </p>

              {/* 非表示の入力フィールド（バーコードスキャナー用） */}
              <input
                ref={inputRef}
                type="text"
                onKeyPress={handleKeyPress}
                className="opacity-0 absolute -left-9999px"
                autoFocus
                aria-label="バーコード入力"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntryExitRegistrationPage;
