/**
 * デスクトップアプリ用認証型定義
 */

export interface DesktopLoginRequest {
  loginId: string;
  password: string;
}

export interface NurseryInfo {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  currentAcademicYear: number;
}

export interface DesktopLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  nursery: NurseryInfo;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AccountLockStatus {
  isLocked: boolean;
  lockedUntil?: string;
  remainingAttempts: number;
}

export interface DesktopAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  nursery: NurseryInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}
