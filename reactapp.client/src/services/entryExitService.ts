/**
 * 入退管理サービス
 * タブレット端末での入退管理機能のAPIクライアント
 */

import axios from 'axios';

const API_BASE_URL = '/api/desktop/auth';
const ENTRY_EXIT_API_URL = '/api/entry-exit-logs';

// リクエスト・レスポンス型定義
export interface EntryExitLoginRequest {
  loginId: string;
  password: string;
}

export interface EntryExitLoginResponse {
  token: string;
  nurseryId: number;
  nurseryName: string;
  expiresAt: string;
}

export interface HeartbeatResponse {
  token: string;
  expiresAt: string;
}

export interface CreateEntryExitLogRequest {
  parentId: number;
  nurseryId: number;
  entryType: 'Entry' | 'Exit';
}

export interface EntryExitLogDto {
  id: number;
  parentId: number;
  parentName: string;
  nurseryId: number;
  entryType: string;
  timestamp: string;
  childNames: string[];
  createdAt: string;
}

// エラーレスポンス型
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * 入退管理用ログイン
 */
export const entryExitLogin = async (request: EntryExitLoginRequest): Promise<EntryExitLoginResponse> => {
  try {
    const response = await axios.post<{ success: boolean; data: EntryExitLoginResponse }>(`${API_BASE_URL}/entry-exit-login`, request);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      throw new Error(apiError.error?.message || 'ログインに失敗しました');
    }
    throw new Error('ログイン処理中にエラーが発生しました');
  }
};

/**
 * ハートビート（トークン更新）
 */
export const heartbeat = async (token: string): Promise<HeartbeatResponse> => {
  try {
    const response = await axios.post<{ success: boolean; data: HeartbeatResponse }>(
      `${API_BASE_URL}/heartbeat`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      throw new Error(apiError.error?.message || 'ハートビートに失敗しました');
    }
    throw new Error('ハートビート処理中にエラーが発生しました');
  }
};

/**
 * 入退ログ作成
 */
export const createEntryExitLog = async (request: CreateEntryExitLogRequest, token: string): Promise<EntryExitLogDto> => {
  try {
    const response = await axios.post<{ success: boolean; data: EntryExitLogDto }>(
      ENTRY_EXIT_API_URL,
      request,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      throw new Error(apiError.error?.message || '入退ログの作成に失敗しました');
    }
    throw new Error('入退ログ作成中にエラーが発生しました');
  }
};

/**
 * 入退ログ一覧取得
 */
export const getEntryExitLogs = async (
  token: string,
  params?: {
    fromDate?: string;
    toDate?: string;
    parentName?: string;
    entryType?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<{ logs: EntryExitLogDto[]; totalCount: number; page: number; pageSize: number }> => {
  try {
    const response = await axios.get<{ success: boolean; data: { logs: EntryExitLogDto[]; totalCount: number; page: number; pageSize: number } }>(
      ENTRY_EXIT_API_URL,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      throw new Error(apiError.error?.message || '入退ログの取得に失敗しました');
    }
    throw new Error('入退ログ取得中にエラーが発生しました');
  }
};

/**
 * 入退ログ削除
 */
export const deleteEntryExitLog = async (logId: number, token: string): Promise<void> => {
  try {
    await axios.delete(`${ENTRY_EXIT_API_URL}/${logId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      throw new Error(apiError.error?.message || '入退ログの削除に失敗しました');
    }
    throw new Error('入退ログ削除中にエラーが発生しました');
  }
};
