import { apiClient } from '../desktop/services/apiClient';
import type {
  AttendanceStatisticsRequest,
  AttendanceStatisticsResponse,
  MonthlyAttendanceStats
} from '../types/attendanceStatistics';

/**
 * 出席統計レポートを取得
 */
export const getAttendanceStatistics = async (
  request: AttendanceStatisticsRequest
): Promise<AttendanceStatisticsResponse> => {
  const response = await apiClient.post<AttendanceStatisticsResponse>(
    '/api/AttendanceStatistics/report',
    request
  );
  return response.data;
};

/**
 * 月別統計データを取得（グラフ用）
 */
export const getMonthlyStatistics = async (
  nurseryId: number,
  dateFrom: string,
  dateTo: string,
  classIds?: string[]
): Promise<MonthlyAttendanceStats[]> => {
  const params = new URLSearchParams({
    nurseryId: nurseryId.toString(),
    dateFrom,
    dateTo,
  });

  if (classIds && classIds.length > 0) {
    params.append('classIds', classIds.join(','));
  }

  const response = await apiClient.get<MonthlyAttendanceStats[]>(
    '/api/AttendanceStatistics/monthly',
    { params }
  );
  return response.data;
};
