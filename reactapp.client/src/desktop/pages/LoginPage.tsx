import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { authService } from '../services/authService';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, setError, setLoading, state } = useDesktopAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRemainingAttempts(null);
    setLoading(true);

    try {
      const response = await authService.login({ loginId, password });
      login(response.accessToken, response.refreshToken, response.nursery, response.expiresIn);
      navigate('/desktop/dashboard');
    } catch (error) {
      console.error('ログインエラー:', error);
      if (error instanceof AxiosError && error.response) {
        const apiError = error.response.data as ApiResponse<unknown>;
        if (apiError.error) {
          setErrorMessage(apiError.error.message);
          if (apiError.error.code === 'AUTH_ACCOUNT_LOCKED') {
            setErrorMessage('アカウントがロックされています。30分後に再試行してください。');
          } else if (apiError.error.details && apiError.error.details.length > 0) {
            const attemptsMatch = apiError.error.details[0].match(/残り(\d+)回/);
            if (attemptsMatch) {
              setRemainingAttempts(parseInt(attemptsMatch[1]));
            }
          }
        } else {
          setErrorMessage('ログインに失敗しました。ログインIDとパスワードを確認してください。');
        }
      } else {
        setErrorMessage('ネットワークエラーが発生しました。接続を確認してください。');
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptLTEyIDZjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0yNCAyNGMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNiA2LTIuNjkgNi02LTIuNjktNi02LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative w-full max-w-md px-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-10 pt-10 pb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 100 100">
                  <defs>
                    <mask id="buildingMask">
                      <polygon points="50,25 15,50 85,50" fill="white" />
                      <rect x="15" y="50" width="70" height="35" fill="white" />
                      <rect x="23" y="58" width="10" height="10" fill="black" rx="1"/>
                      <rect x="38" y="58" width="10" height="10" fill="black" rx="1"/>
                      <rect x="52" y="58" width="10" height="10" fill="black" rx="1"/>
                      <rect x="67" y="58" width="10" height="10" fill="black" rx="1"/>
                      <rect x="42" y="72" width="16" height="13" fill="black" rx="1"/>
                      <rect x="60" y="20" width="6" height="8" fill="white"/>
                    </mask>
                  </defs>
                  <g mask="url(#buildingMask)">
                    <polygon points="50,25 15,50 85,50" />
                    <rect x="15" y="50" width="70" height="35" />
                    <rect x="60" y="20" width="6" height="8"/>
                  </g>
                </svg>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg" role="alert">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
                    {remainingAttempts !== null && (
                      <p className="text-xs text-red-700 mt-1">残り試行回数: {remainingAttempts}回</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="loginId" className="block text-sm font-semibold text-gray-700">
                  ログインID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="loginId"
                    type="text"
                    autoComplete="username"
                    required
                    maxLength={50}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    disabled={state.isLoading}
                    className="block w-full pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="ログインIDを入力"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  パスワード
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    maxLength={100}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={state.isLoading}
                    className="block w-full pl-12 pr-12 py-3.5 text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="パスワードを入力"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={state.isLoading}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={state.isLoading || !loginId || !password}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-600/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {state.isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ログイン中...
                    </span>
                  ) : (
                    'ログイン'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
