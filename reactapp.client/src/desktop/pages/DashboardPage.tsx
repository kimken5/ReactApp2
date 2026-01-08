import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { dashboardService } from '../services/DashboardService';
import type {
  ClassContactStatistics,
  RecentDailyReport,
  TodayEvent
} from '../services/DashboardService';

/**
 * デスクトップアプリ用ダッシュボードページ
 */

export function DashboardPage() {
  const { state } = useDesktopAuth();
  const navigate = useNavigate();
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true; // 写真機能の利用可否
  const [classStats, setClassStats] = useState<ClassContactStatistics[]>([]);
  const [recentReports, setRecentReports] = useState<RecentDailyReport[]>([]);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Dashboard: Loading data...');
      const [stats, reports, events] = await Promise.all([
        dashboardService.getClassContactStatistics(),
        dashboardService.getRecentDailyReports(3),
        dashboardService.getTodayEvents(),
      ]);
      console.log('✅ Class Stats:', stats);
      console.log('✅ Recent Reports:', reports);
      console.log('✅ Today Events:', events);
      setClassStats(stats);
      setRecentReports(reports);
      setTodayEvents(events);
    } catch (error) {
      console.error('❌ ダッシュボードデータの取得に失敗しました', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassClick = (classId: string) => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/desktop/contact-notifications?classId=${classId}&date=${today}`);
  };

  const handleAttendanceClick = (e: React.MouseEvent, classId: string) => {
    e.stopPropagation(); // カードのクリックイベントを停止
    const today = new Date().toISOString().split('T')[0];
    navigate(`/desktop/attendance?classId=${classId}&date=${today}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 各クラスの連絡状況 */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {classStats.map((stat) => (
              <ClassNotificationCard
                key={stat.classId}
                classId={stat.classId}
                className={stat.className}
                absence={stat.absenceCount}
                late={stat.lateCount}
                pickup={stat.pickupCount}
                onClassClick={handleClassClick}
                onAttendanceClick={handleAttendanceClick}
              />
            ))}
          </div>
        </div>

        {/* 最近の活動 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-md shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">最近の連絡帳</h2>
            <div className="space-y-3">
              {recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <ActivityItem
                    key={report.reportId}
                    title={`${report.className} - ${report.childName}`}
                    time={report.timeAgo}
                    status={report.statusDisplay}
                    statusColor={report.status === 'published' ? 'green' : 'gray'}
                  />
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  まだ連絡帳がありません
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-md shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">今日の予定</h2>
            <div className="space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <EventItem
                    key={event.eventId}
                    title={event.title}
                    time={event.timeRange}
                    type={event.eventTypeDisplay}
                  />
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  今日の予定はありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton iconType="document" label="連絡帳作成" href="/desktop/dailyreports/create" />
            <QuickActionButton iconType="user-add" label="園児登録" href="/desktop/children/create" />
            {photoFunctionEnabled && (
              <QuickActionButton iconType="camera" label="写真アップロード" href="/desktop/photos/upload" />
            )}
            <QuickActionButton iconType="megaphone" label="お知らせ作成" href="/desktop/announcements/create" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// サブコンポーネント

interface ClassNotificationCardProps {
  classId: string;
  className: string;
  absence: number;
  late: number;
  pickup: number;
  onClassClick: (classId: string) => void;
  onAttendanceClick: (e: React.MouseEvent, classId: string) => void;
}

function ClassNotificationCard({
  classId,
  className,
  absence,
  late,
  pickup,
  onClassClick,
  onAttendanceClick,
}: ClassNotificationCardProps) {
  return (
    <div
      onClick={() => onClassClick(classId)}
      className="bg-white rounded-md shadow-md p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-800 font-semibold text-base">{className}</h3>
        <button
          onClick={(e) => onAttendanceClick(e, classId)}
          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="出欠表を開く"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-red-600 font-medium">欠席連絡</span>
          <span className="text-sm font-bold text-red-600">{absence}件</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-orange-600 font-medium">遅刻連絡</span>
          <span className="text-sm font-bold text-orange-600">{late}件</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-600 font-medium">お迎え連絡</span>
          <span className="text-sm font-bold text-blue-600">{pickup}件</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  time: string;
  status: string;
  statusColor: 'green' | 'gray';
}

function ActivityItem({ title, time, status, statusColor }: ActivityItemProps) {
  const statusColors = {
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[statusColor]}`}>
        {status}
      </span>
    </div>
  );
}

interface EventItemProps {
  title: string;
  time: string;
  type: string;
}

function EventItem({ title, time, type }: EventItemProps) {
  return (
    <div className="flex items-start space-x-3 py-2 px-3 border-b border-gray-100 last:border-0">
      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-xs text-gray-500">{time}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500">{type}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  iconType: 'document' | 'user-add' | 'camera' | 'megaphone';
  label: string;
  href: string;
}

function QuickActionButton({ iconType, label, href }: QuickActionButtonProps) {
  const getQuickIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'user-add':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'camera':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'megaphone':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 group"
    >
      <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-white mb-3 group-hover:scale-110 transition-transform duration-200">
        {getQuickIcon(iconType)}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </a>
  );
}
