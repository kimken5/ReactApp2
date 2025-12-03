import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { DesktopAuthProvider, useDesktopAuth } from './contexts/DesktopAuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NurseryInfoPage } from './pages/NurseryInfoPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassFormPage } from './pages/ClassFormPage';
import { ClassCompositionPage } from './pages/ClassCompositionPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { ChildFormPage } from './pages/ChildFormPage';
import { ParentsPage } from './pages/ParentsPage';
import { ParentFormPage } from './pages/ParentFormPage';
import { StaffPage } from './pages/StaffPage';
import { StaffFormPage } from './pages/StaffFormPage';
import { DailyReportsPage } from './pages/DailyReportsPage';
import { DailyReportFormPage } from './pages/DailyReportFormPage';
import { DailyReportDetailPage } from './pages/DailyReportDetailPage';
import { PhotosPage } from './pages/PhotosPage';
import { PhotoUploadPage } from './pages/PhotoUploadPage';
import { PhotoDetailPage } from './pages/PhotoDetailPage';
import { ContactNotificationsPage } from './pages/ContactNotificationsPage';
import { ContactNotificationDetailPage } from './pages/ContactNotificationDetailPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AnnouncementFormPage } from './pages/AnnouncementFormPage';
import { AttendancePage } from './pages/AttendancePage';
import AttendanceReportPage from './pages/AttendanceReportPage';
import AcademicYearManagement from '../components/staff/AcademicYearManagement';
import AcademicYearCreate from '../components/staff/AcademicYearCreate';
import YearSlideExecution from '../components/staff/YearSlideExecution';
import ChildClassAssignment from '../components/staff/ChildClassAssignment';
import StaffClassAssignment from '../components/staff/StaffClassAssignment';

/**
 * デスクトップアプリ用ルーター
 */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useDesktopAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  // デモモード検出のデバッグログ
  console.log('ProtectedRoute - isDemoMode:', isDemoMode);
  console.log('ProtectedRoute - searchParams:', Object.fromEntries(searchParams));
  console.log('ProtectedRoute - state.isAuthenticated:', state.isAuthenticated);

  // デモモードの場合は認証チェックをバイパス
  if (isDemoMode) {
    console.log('Demo mode detected, bypassing authentication');
    return <>{children}</>;
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    // クエリパラメータを保持してリダイレクト
    const search = window.location.search;
    console.log('Redirecting to login with search params:', search);
    return <Navigate to={`/desktop/login${search}`} replace />;
  }

  return <>{children}</>;
}

function DesktopRoutes() {
  return (
    <Routes>
      {/* 公開ルート */}
      <Route path="/login" element={<LoginPage />} />

      {/* 認証必須ルート */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nurseries"
        element={
          <ProtectedRoute>
            <NurseryInfoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/create"
        element={
          <ProtectedRoute>
            <ClassFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/edit/:classId"
        element={
          <ProtectedRoute>
            <ClassFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/composition/:classId"
        element={
          <ProtectedRoute>
            <ClassCompositionPage />
          </ProtectedRoute>
        }
      />

      {/* 園児管理 */}
      <Route
        path="/children"
        element={
          <ProtectedRoute>
            <ChildrenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/create"
        element={
          <ProtectedRoute>
            <ChildFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/children/edit/:childId"
        element={
          <ProtectedRoute>
            <ChildFormPage />
          </ProtectedRoute>
        }
      />

      {/* 保護者管理 */}
      <Route
        path="/parents"
        element={
          <ProtectedRoute>
            <ParentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parents/create"
        element={
          <ProtectedRoute>
            <ParentFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parents/edit/:parentId"
        element={
          <ProtectedRoute>
            <ParentFormPage />
          </ProtectedRoute>
        }
      />

      {/* 職員管理 */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <StaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/create"
        element={
          <ProtectedRoute>
            <StaffFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/edit/:staffId"
        element={
          <ProtectedRoute>
            <StaffFormPage />
          </ProtectedRoute>
        }
      />

      {/* 日報管理 */}
      <Route
        path="/dailyreports"
        element={
          <ProtectedRoute>
            <DailyReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dailyreports/create"
        element={
          <ProtectedRoute>
            <DailyReportFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dailyreports/edit/:id"
        element={
          <ProtectedRoute>
            <DailyReportFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dailyreports/:id"
        element={
          <ProtectedRoute>
            <DailyReportDetailPage />
          </ProtectedRoute>
        }
      />

      {/* 写真管理 */}
      <Route
        path="/photos"
        element={
          <ProtectedRoute>
            <PhotosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/photos/upload"
        element={
          <ProtectedRoute>
            <PhotoUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/photos/:id"
        element={
          <ProtectedRoute>
            <PhotoDetailPage />
          </ProtectedRoute>
        }
      />

      {/* 連絡通知管理 */}
      <Route
        path="/contact-notifications"
        element={
          <ProtectedRoute>
            <ContactNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact-notifications/:id"
        element={
          <ProtectedRoute>
            <ContactNotificationDetailPage />
          </ProtectedRoute>
        }
      />

      {/* カレンダー管理 */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      {/* 出欠表管理 */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/report"
        element={
          <ProtectedRoute>
            <AttendanceReportPage />
          </ProtectedRoute>
        }
      />

      {/* 年度管理 */}
      <Route
        path="/academic-years"
        element={
          <ProtectedRoute>
            <AcademicYearManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic-years/create"
        element={
          <ProtectedRoute>
            <AcademicYearCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/year-slide"
        element={
          <ProtectedRoute>
            <YearSlideExecution />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class-assignment"
        element={
          <ProtectedRoute>
            <ChildClassAssignment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff-class-assignment"
        element={
          <ProtectedRoute>
            <StaffClassAssignment />
          </ProtectedRoute>
        }
      />

      {/* お知らせ管理 */}
      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements/create"
        element={
          <ProtectedRoute>
            <AnnouncementFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements/edit/:announcementId"
        element={
          <ProtectedRoute>
            <AnnouncementFormPage />
          </ProtectedRoute>
        }
      />

      {/* デフォルトリダイレクト */}
      <Route path="/" element={<Navigate to="/desktop/dashboard" replace />} />
      <Route path="/*" element={<Navigate to="/desktop/dashboard" replace />} />
    </Routes>
  );
}

export function DesktopApp() {
  return (
    <DesktopAuthProvider>
      <DesktopRoutes />
    </DesktopAuthProvider>
  );
}
