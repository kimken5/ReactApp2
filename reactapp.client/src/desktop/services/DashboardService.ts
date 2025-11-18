import apiClient from './apiClient';

const DASHBOARD_BASE_URL = '/api/desktop/dashboard';

export interface ClassContactStatistics {
  classId: string;
  className: string;
  absenceCount: number;
  lateCount: number;
  pickupCount: number;
}

export interface RecentDailyReport {
  reportId: number;
  className: string;
  childName: string;
  status: string;
  statusDisplay: string;
  createdAt: string;
  timeAgo: string;
}

export interface TodayEvent {
  eventId: number;
  title: string;
  timeRange: string;
  eventType: string;
  eventTypeDisplay: string;
}

export interface DashboardSummary {
  totalChildren: number;
  totalStaff: number;
  totalClasses: number;
  todayAbsenceCount: number;
  unacknowledgedNotificationCount: number;
  draftReportCount: number;
}

export class DesktopDashboardService {
  /**
   * クラス別連絡通知統計を取得
   */
  async getClassContactStatistics(date?: string): Promise<ClassContactStatistics[]> {
    const params = date ? { date } : {};
    const response = await apiClient.get(`${DASHBOARD_BASE_URL}/class-contact-statistics`, { params });
    return response.data.data;
  }

  /**
   * 最近の日報一覧を取得
   */
  async getRecentDailyReports(limit: number = 5): Promise<RecentDailyReport[]> {
    const response = await apiClient.get(`${DASHBOARD_BASE_URL}/recent-reports`, {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * 今日のカレンダーイベント一覧を取得
   */
  async getTodayEvents(): Promise<TodayEvent[]> {
    const response = await apiClient.get(`${DASHBOARD_BASE_URL}/today-events`);
    return response.data.data;
  }

  /**
   * ダッシュボードサマリー統計を取得
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get(`${DASHBOARD_BASE_URL}/summary`);
    return response.data.data;
  }
}

export const dashboardService = new DesktopDashboardService();
