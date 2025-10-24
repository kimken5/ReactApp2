import { Routes, Route, Navigate } from 'react-router-dom';
import { DesktopAuthProvider, useDesktopAuth } from './contexts/DesktopAuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NurseryInfoPage } from './pages/NurseryInfoPage';
import { ClassesPage } from './pages/ClassesPage';
import { ClassFormPage } from './pages/ClassFormPage';
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

/**
 * デスクトップアプリ用ルーター
 */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useDesktopAuth();

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
    return <Navigate to="/desktop/login" replace />;
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
