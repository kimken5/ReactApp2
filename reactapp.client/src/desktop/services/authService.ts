import apiClient from './apiClient';
import type {
  DesktopLoginRequest,
  DesktopLoginResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  AccountLockStatus,
  ApiResponse,
} from '../types/auth';

/**
 * デスクトップアプリ用認証サービス
 * バックエンドAPI (DesktopAuthController) との通信
 */

const AUTH_BASE_URL = '/api/desktop/auth';

export const authService = {
  /**
   * ログイン (ログインID・パスワード認証)
   */
  async login(request: DesktopLoginRequest): Promise<DesktopLoginResponse> {
    const response = await apiClient.post<ApiResponse<DesktopLoginResponse>>(
      `${AUTH_BASE_URL}/login`,
      request
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'ログインに失敗しました');
    }

    return response.data.data;
  },

  /**
   * トークンリフレッシュ
   */
  async refreshToken(request: RefreshTokenRequest): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${AUTH_BASE_URL}/refresh`,
      request
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'トークンリフレッシュに失敗しました');
    }

    return response.data.data;
  },

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`${AUTH_BASE_URL}/logout`);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // ログアウトはベストエフォート（失敗してもローカルストレージはクリアする）
    }
  },

  /**
   * パスワード変更
   */
  async changePassword(request: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.put<ApiResponse<void>>(
      `${AUTH_BASE_URL}/change-password`,
      request
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'パスワード変更に失敗しました');
    }
  },

  /**
   * アカウントロック状態確認
   */
  async checkLockStatus(nurseryId: number): Promise<AccountLockStatus> {
    const response = await apiClient.get<ApiResponse<AccountLockStatus>>(
      `${AUTH_BASE_URL}/lock-status/${nurseryId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'ロック状態の確認に失敗しました');
    }

    return response.data.data;
  },

  /**
   * アカウントロック解除 (管理者用)
   */
  async unlockAccount(nurseryId: number): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      `${AUTH_BASE_URL}/unlock/${nurseryId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'ロック解除に失敗しました');
    }
  },
};
