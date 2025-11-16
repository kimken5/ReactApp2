import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/auth';

/**
 * デスクトップアプリ用 Axios インスタンス
 * JWT自動付与、トークンリフレッシュ、エラーハンドリング
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7118';

// Axios インスタンス作成
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター: JWT自動付与
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('desktop_access_token');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター: トークンリフレッシュ・エラーハンドリング
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401エラー（トークン期限切れ）の場合、トークンリフレッシュを試行
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // トークンリフレッシュ中の場合、キューに追加
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('desktop_refresh_token');

      if (!refreshToken) {
        // リフレッシュトークンがない場合、ログアウト
        localStorage.removeItem('desktop_access_token');
        localStorage.removeItem('desktop_refresh_token');
        localStorage.removeItem('desktop_nursery');
        window.location.href = '/desktop/login';
        return Promise.reject(error);
      }

      try {
        // トークンリフレッシュAPI呼び出し
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${API_BASE_URL}/api/desktop/auth/refresh`,
          { refreshToken }
        );

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // 新しいトークンを保存
          localStorage.setItem('desktop_access_token', accessToken);
          localStorage.setItem('desktop_refresh_token', newRefreshToken);

          // キューに積まれたリクエストを再実行
          processQueue(null, accessToken);

          // 元のリクエストを再試行
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('トークンリフレッシュ失敗');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('desktop_access_token');
        localStorage.removeItem('desktop_refresh_token');
        localStorage.removeItem('desktop_nursery');
        window.location.href = '/desktop/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
