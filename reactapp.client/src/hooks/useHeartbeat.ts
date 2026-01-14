/**
 * ハートビートカスタムフック
 * 30秒ごとにサーバーにアクセスし、JWTトークンを更新してセッションを維持する
 */

import { useEffect, useRef, useCallback } from 'react';
import { heartbeat } from '../services/entryExitService';

interface HeartbeatOptions {
  enabled?: boolean;
  interval?: number; // ミリ秒（デフォルト: 30000 = 30秒）
  onSuccess?: (newToken: string, expiresAt: string) => void;
  onError?: (error: Error) => void;
}

/**
 * useHeartbeat
 * 定期的にハートビートAPIを呼び出し、トークンを更新する
 */
export const useHeartbeat = (
  token: string | null,
  options: HeartbeatOptions = {}
) => {
  const {
    enabled = true,
    interval = 30000, // 30秒
    onSuccess,
    onError,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(token);

  // トークンを最新に保つ
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const executeHeartbeat = useCallback(async () => {
    if (!tokenRef.current) {
      console.warn('Heartbeat: トークンが存在しません');
      return;
    }

    try {
      console.log('Heartbeat: 実行中...');
      const response = await heartbeat(tokenRef.current);

      console.log('Heartbeat: 成功', {
        expiresAt: response.expiresAt,
      });

      // トークンを更新
      tokenRef.current = response.token;

      // 成功コールバック
      if (onSuccess) {
        onSuccess(response.token, response.expiresAt);
      }
    } catch (error: any) {
      console.error('Heartbeat: エラー', error);

      // エラーコールバック
      if (onError) {
        onError(error);
      }
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    // 有効でない、またはトークンがない場合は何もしない
    if (!enabled || !token) {
      return;
    }

    // 初回実行（即座に）
    executeHeartbeat();

    // 定期実行開始
    intervalRef.current = setInterval(executeHeartbeat, interval);

    console.log(`Heartbeat: 開始（${interval / 1000}秒間隔）`);

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Heartbeat: 停止');
      }
    };
  }, [enabled, token, interval, executeHeartbeat]);

  return {
    executeNow: executeHeartbeat,
  };
};

export default useHeartbeat;
