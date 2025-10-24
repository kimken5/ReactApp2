import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StaffClassProvider } from './contexts/StaffClassContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import './i18n';

// デスクトップアプリ
import { DesktopApp } from './desktop/DesktopApp';
import { FamilyInvitePage } from './pages/FamilyInvitePage';
import { PhotoGalleryPage } from './pages/PhotoGalleryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SimpleNotificationSettingsPage } from './pages/SimpleNotificationSettingsPage';
import { AnnouncementListPage } from './pages/AnnouncementListPage';
import { CalendarPage } from './pages/CalendarPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { CustomizationPage } from './pages/CustomizationPage';

// 認証コンポーネント
import { AuthFlow } from './components/auth/AuthFlow';
import { ParentDashboard } from './pages/ParentDashboard';
import { TestDashboard } from './pages/TestDashboard';

// スタッフ用コンポーネント
import { StaffApp } from './pages/staff/StaffApp';
import { StaffLogin } from './components/staff/auth/StaffLogin';
import { StaffDashboard } from './components/staff/dashboard/StaffDashboard';
import { SelectClassPage } from './pages/SelectClassPage';
import { ContactsList } from './components/staff/contacts/ContactsList';
import { ReportCreate } from './components/staff/reports/ReportCreate';
import ReportList from './components/staff/reports/ReportList';
import { PhotoUploadWithNavigation } from './components/staff/photos/PhotoUploadWithNavigation';
import { StaffPhotosPage } from './components/staff/photos/StaffPhotosPage';
import { AnnouncementCreate } from './components/staff/announcements/AnnouncementCreate';
import AnnouncementList from './components/staff/announcements/AnnouncementList';
import AnnouncementPage from './pages/AnnouncementPage';
import { StaffAuthDebug } from './pages/StaffAuthDebug';

// スタッフルート用ラッパーコンポーネント
function StaffRoutes() {
  const { user, isLoading } = useAuth();

  console.log('StaffRoutes - user:', user);
  console.log('StaffRoutes - user?.role:', user?.role);
  console.log('StaffRoutes - isLoading:', isLoading);

  // ローディング中は何も表示しない
  if (isLoading) {
    console.log('StaffRoutes - 認証情報ローディング中');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // スタッフでない場合は何も表示しない
  if (!user || user.role !== 'Staff') {
    console.log('StaffRoutes - userがnullまたはStaffでないためnullを返します');
    console.log('StaffRoutes - リダイレクトせず、nullを返します');
    // Navigate component should handle redirect at app level
    return null;
  }

  console.log('StaffRoutes - スタッフルートを表示します');

  // デフォルト値を設定（APIがstaff情報を返さない場合に備える）
  const nurseryId = user.staff?.nurseryId ?? 1;
  const staffId = user.staff?.staffId ?? parseInt(user.id) ?? 1;
  const classAssignments = user.staff?.classAssignments ?? [];

  return (
    <StaffClassProvider
      nurseryId={nurseryId}
      staffId={staffId}
      initialAssignments={classAssignments}
    >
      <Routes>
        <Route index element={<StaffApp />} />
        <Route path="select-class" element={<SelectClassPage />} />
        <Route path="dashboard" element={<StaffDashboard staffName="田中先生" className="さくら組" />} />
        <Route path="contacts" element={<ContactsList />} />
        <Route path="reports" element={<ReportList />} />
        <Route path="reports/create" element={<ReportCreate />} />
        <Route path="reports/edit/:id" element={<ReportCreate />} />
        <Route path="photos" element={<StaffPhotosPage staffName="山田先生" className="さくら組" />} />
        <Route path="photos/upload" element={<PhotoUploadWithNavigation />} />
        <Route path="announcements" element={<AnnouncementPage />}>
          <Route index element={<AnnouncementList />} />
          <Route path="create" element={<AnnouncementCreate />} />
          <Route path="edit/:id" element={<AnnouncementCreate />} />
        </Route>
        <Route path="calendar" element={<CalendarPage isStaffView={true} />} />
      </Routes>
    </StaffClassProvider>
  );
}

function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <Routes>
                {/* デスクトップアプリ */}
                <Route path="/desktop/*" element={<DesktopApp />} />

                {/* 認証画面 */}
                <Route path="/login" element={<AuthFlow />} />
                <Route path="/auth" element={<AuthFlow />} />
                <Route path="/dashboard" element={<ParentDashboard />} />
                <Route path="/test" element={<TestDashboard />} />

                {/* 保護者用画面 */}
                <Route path="/family/invite" element={<FamilyInvitePage />} />
                <Route path="/photos" element={<PhotoGalleryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings/notifications" element={<SimpleNotificationSettingsPage />} />
                <Route path="/settings/customization" element={<CustomizationPage />} />
                <Route path="/customization" element={<CustomizationPage />} />
                <Route path="/announcements" element={<AnnouncementListPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/children" element={<ChildrenPage />} />

                {/* スタッフ用画面 - クラスコンテキスト不要 */}
                <Route path="/staff/login" element={<StaffLogin onLogin={async () => {}} />} />
                <Route path="/staff/auth-debug" element={<StaffAuthDebug />} />

                {/* スタッフ用画面 - クラスコンテキスト必要 */}
                <Route path="/staff/*" element={<StaffRoutes />} />

                <Route path="/" element={
                    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
                        <h1 style={{color: '#333', marginBottom: '30px'}}>保育園アプリ - 画面一覧</h1>

                        <div style={{marginBottom: '30px'}}>
                            <h2 style={{color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'}}>💻 デスクトップ管理画面</h2>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                <li style={{margin: '10px 0'}}><a href="/desktop/login" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold'}}>💻 デスクトップ管理ログイン</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/dashboard" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>📊 管理ダッシュボード</a></li>
                            </ul>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h2 style={{color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'}}>🔐 モバイル認証</h2>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                <li style={{margin: '10px 0'}}><a href="/login" style={{color: '#dc2626', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold'}}>🔐 SMS認証ログイン</a></li>
                            </ul>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h2 style={{color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'}}>👨‍👩‍👧‍👦 保護者用画面</h2>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                <li style={{margin: '10px 0'}}><a href="/children" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>👶 園児一覧（連絡機能含む）</a></li>
                                <li style={{margin: '10px 0'}}><a href="/family/invite" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>👪 家族招待</a></li>
                                <li style={{margin: '10px 0'}}><a href="/photos" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>📸 写真ギャラリー</a></li>
                                <li style={{margin: '10px 0'}}><a href="/reports" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>📋 レポート一覧</a></li>
                                <li style={{margin: '10px 0'}}><a href="/announcements" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>📢 お知らせ一覧</a></li>
                                <li style={{margin: '10px 0'}}><a href="/calendar" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>📅 カレンダー</a></li>
                                <li style={{margin: '10px 0'}}><a href="/settings/notifications" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>🔔 通知設定</a></li>
                                <li style={{margin: '10px 0'}}><a href="/customization" style={{color: '#2563eb', textDecoration: 'none', fontSize: '16px'}}>⚙️ カスタマイズ設定</a></li>
                            </ul>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h2 style={{color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'}}>👩‍🏫 スタッフ用画面</h2>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                <li style={{margin: '10px 0'}}><a href="/staff" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>🏠 スタッフアプリ（統合版）</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/login" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>🔐 スタッフログイン</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/dashboard" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📊 ダッシュボード</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/contacts" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📞 連絡受信・確認</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/reports" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📋 レポート一覧</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/reports/create" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📝 レポート作成</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/photos" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📸 写真管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/photos/upload" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📤 写真アップロード</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/announcements/create" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📢 お知らせ作成</a></li>
                                <li style={{margin: '10px 0'}}><a href="/staff/calendar" style={{color: '#16a34a', textDecoration: 'none', fontSize: '16px'}}>📅 カレンダー</a></li>
                            </ul>
                        </div>

                        <div style={{backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginTop: '30px'}}>
                            <h3 style={{color: '#374151', margin: '0 0 10px 0'}}>📱 モバイル表示推奨</h3>
                            <p style={{color: '#6b7280', margin: 0}}>
                                スタッフ用画面はスマートフォンでの利用を前提として設計されています。<br/>
                                ブラウザの開発者ツールでモバイル表示（iPhone 12 Pro等）にしてご確認ください。
                            </p>
                        </div>
                    </div>
                } />
                    <Route path="/*" element={<div style={{padding: '50px', backgroundColor: 'blue', color: 'white'}}>404 - Page Not Found</div>} />
                    </Routes>
                </Router>
            </LanguageProvider>
        </AuthProvider>
    );
}

export default App;