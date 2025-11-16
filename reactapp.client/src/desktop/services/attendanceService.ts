/**
 * Attendance Service
 * 出欠表管理APIサービス
 */

import apiClient from './apiClient';
import type {
  AttendanceDto,
  AttendanceHistoryResponseDto,
  UpdateAttendanceRequest,
  UpdateAttendanceNotesRequest,
  BulkPresentRequest,
  BulkPresentResponse,
} from '../types/attendance';

/**
 * 出欠表管理サービス
 */
export const attendanceService = {
  /**
   * 指定日・クラスの出欠状況を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getAttendanceByClassAndDate(classId: string, date: string): Promise<AttendanceDto[]> {
    const response = await apiClient.get<{ data: AttendanceDto[] }>(
      `/api/desktop/attendance/${classId}/${date}`
    );
    return response.data.data;
  },

  /**
   * 出欠履歴を取得
   * @param classId クラスID
   * @param startDate 開始日（YYYY-MM-DD）
   * @param endDate 終了日（YYYY-MM-DD）
   * @param childId 園児ID（オプション）
   */
  async getAttendanceHistory(
    classId: string,
    startDate: string,
    endDate: string,
    childId?: number
  ): Promise<AttendanceHistoryResponseDto> {
    const params: Record<string, string | number> = {
      startDate,
      endDate,
    };
    if (childId !== undefined) {
      params.childId = childId;
    }

    const response = await apiClient.get<{ data: AttendanceHistoryResponseDto }>(
      `/api/desktop/attendance/${classId}/history`,
      { params }
    );
    return response.data.data;
  },

  /**
   * 出欠ステータスを更新
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param request 更新リクエスト
   */
  async updateAttendance(
    childId: number,
    date: string,
    request: UpdateAttendanceRequest
  ): Promise<AttendanceDto> {
    const response = await apiClient.put<{ data: AttendanceDto }>(
      `/api/desktop/attendance/${childId}/${date}`,
      request
    );
    return response.data.data;
  },

  /**
   * 備考のみを更新
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param request 更新リクエスト
   */
  async updateAttendanceNotes(
    childId: number,
    date: string,
    request: UpdateAttendanceNotesRequest
  ): Promise<AttendanceDto> {
    const response = await apiClient.put<{ data: AttendanceDto }>(
      `/api/desktop/attendance/${childId}/${date}/notes`,
      request
    );
    return response.data.data;
  },

  /**
   * クラス全員を一括で出席に登録
   * @param request 一括登録リクエスト
   */
  async bulkPresent(request: BulkPresentRequest): Promise<BulkPresentResponse> {
    const response = await apiClient.post<{ data: BulkPresentResponse }>(
      '/api/desktop/attendance/bulk-present',
      request
    );
    return response.data.data;
  },
};

export default attendanceService;
