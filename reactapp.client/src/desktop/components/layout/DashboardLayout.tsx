import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDesktopAuth } from '../../contexts/DesktopAuthContext';
import { authService } from '../../services/authService';

/**
 * デスクトップアプリ用ダッシュボードレイアウト
 * ヘッダー、サイドバー、メインコンテンツエリア
 */

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { state, logout } = useDesktopAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      navigate('/desktop/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーでもログアウト処理を続行
      logout();
      navigate('/desktop/login');
    }
  };

  const menuItems = [
    { path: '/desktop/dashboard', label: 'ダッシュボード', icon: '📊' },
    { path: '/desktop/nurseries', label: '保育園情報', icon: '🏫' },
    { path: '/desktop/classes', label: 'クラス管理', icon: '👥' },
    { path: '/desktop/children', label: '園児管理', icon: '👶' },
    { path: '/desktop/parents', label: '保護者管理', icon: '👨‍👩‍👧' },
    { path: '/desktop/staff', label: '職員管理', icon: '👩‍🏫' },
    { path: '/desktop/daily-reports', label: '連絡帳管理', icon: '📋' },
    { path: '/desktop/photos', label: '写真管理', icon: '📸' },
    { path: '/desktop/announcements', label: 'お知らせ管理', icon: '📢' },
    { path: '/desktop/calendar', label: '予定管理', icon: '📅' },
    { path: '/desktop/absence', label: '欠席・遅刻管理', icon: '📞' },
    { path: '/desktop/year-management', label: '年度管理', icon: '🗓️' },
    { path: '/desktop/audit-logs', label: '操作ログ', icon: '📜' },
    { path: '/desktop/settings', label: 'システム設定', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 左側: ロゴ＋サイドバートグル */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-gray-800">保育園管理</span>
            </div>
          </div>

          {/* 右側: ユーザー情報 */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{state.nursery?.name}</p>
                <p className="text-xs text-gray-500">管理者</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                {state.nursery?.name?.charAt(0)}
              </div>
            </button>

            {/* ユーザーメニュー */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{state.nursery?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">年度: {state.nursery?.currentAcademicYear}年</p>
                  </div>
                  <Link
                    to="/desktop/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    プロフィール設定
                  </Link>
                  <Link
                    to="/desktop/change-password"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    パスワード変更
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-100 mt-2"
                  >
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* サイドバー */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-20 ${
          isSidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* メインコンテンツ */}
      <main
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
