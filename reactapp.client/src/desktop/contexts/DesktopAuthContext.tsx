import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DesktopAuthState, NurseryInfo } from '../types/auth';

/**
 * デスクトップアプリ用認証Context
 * ログインID・パスワード認証、JWT管理、トークンリフレッシュ機能
 */

interface DesktopAuthContextType {
  state: DesktopAuthState;
  login: (accessToken: string, refreshToken: string, nursery: NurseryInfo, expiresIn: number) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { accessToken: string; refreshToken: string; nursery: NurseryInfo } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_TOKENS'; payload: { accessToken: string; refreshToken: string } };

const DesktopAuthContext = createContext<DesktopAuthContextType | undefined>(undefined);

const initialState: DesktopAuthState = {
  isAuthenticated: false,
  isLoading: true,
  nursery: null,
  accessToken: null,
  refreshToken: null,
  error: null,
};

function authReducer(state: DesktopAuthState, action: AuthAction): DesktopAuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        nursery: action.payload.nursery,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_TOKENS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };
    default:
      return state;
  }
}

interface DesktopAuthProviderProps {
  children: ReactNode;
}

export function DesktopAuthProvider({ children }: DesktopAuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // LocalStorageから認証情報を復元
  useEffect(() => {
    const restoreAuth = () => {
      try {
        // 開発環境でデモモードを有効にする（URLパラメータで ?demo=true を指定）
        const urlParams = new URLSearchParams(window.location.search);
        const isDemoMode = urlParams.get('demo') === 'true';

        console.log('DesktopAuthContext - Restoring auth');
        console.log('DesktopAuthContext - window.location.search:', window.location.search);
        console.log('DesktopAuthContext - isDemoMode:', isDemoMode);

        if (isDemoMode) {
          // デモ用のダミーデータ
          const demoNursery: NurseryInfo = {
            id: 0,
            name: 'デモ保育園',
            phoneNumber: '000-0000-0000',
            currentAcademicYear: 2025,
          };
          console.log('DesktopAuthContext - Setting demo mode with nursery:', demoNursery);
          dispatch({
            type: 'LOGIN',
            payload: {
              accessToken: 'demo_token',
              refreshToken: 'demo_refresh_token',
              nursery: demoNursery,
            },
          });
          return;
        }

        const accessToken = localStorage.getItem('desktop_access_token');
        const refreshToken = localStorage.getItem('desktop_refresh_token');
        const nurseryData = localStorage.getItem('desktop_nursery');

        if (accessToken && refreshToken && nurseryData) {
          const nursery = JSON.parse(nurseryData) as NurseryInfo;
          dispatch({
            type: 'LOGIN',
            payload: { accessToken, refreshToken, nursery },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('認証情報の復元エラー:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreAuth();
  }, []);

  const login = (
    accessToken: string,
    refreshToken: string,
    nursery: NurseryInfo,
    expiresIn: number
  ) => {
    // LocalStorageに保存
    localStorage.setItem('desktop_access_token', accessToken);
    localStorage.setItem('desktop_refresh_token', refreshToken);
    localStorage.setItem('desktop_nursery', JSON.stringify(nursery));
    localStorage.setItem('desktop_token_expires_at', (Date.now() + expiresIn * 1000).toString());

    dispatch({
      type: 'LOGIN',
      payload: { accessToken, refreshToken, nursery },
    });
  };

  const logout = () => {
    // LocalStorageをクリア
    localStorage.removeItem('desktop_access_token');
    localStorage.removeItem('desktop_refresh_token');
    localStorage.removeItem('desktop_nursery');
    localStorage.removeItem('desktop_token_expires_at');

    dispatch({ type: 'LOGOUT' });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const updateTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('desktop_access_token', accessToken);
    localStorage.setItem('desktop_refresh_token', refreshToken);

    dispatch({
      type: 'UPDATE_TOKENS',
      payload: { accessToken, refreshToken },
    });
  };

  const value: DesktopAuthContextType = {
    state,
    login,
    logout,
    setError,
    setLoading,
    updateTokens,
  };

  return <DesktopAuthContext.Provider value={value}>{children}</DesktopAuthContext.Provider>;
}

export function useDesktopAuth() {
  const context = useContext(DesktopAuthContext);
  if (context === undefined) {
    throw new Error('useDesktopAuth must be used within DesktopAuthProvider');
  }
  return context;
}
