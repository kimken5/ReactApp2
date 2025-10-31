/**
 * Calendar Service
 * カレンダー管理APIサービス
 */

import apiClient from './apiClient';
import type {
  CalendarEventDto,
  CreateEventRequestDto,
  UpdateEventRequestDto,
} from '../types/calendar';

/**
 * カレンダー管理サービス
 */
export const calendarService = {
  /**
   * イベント一覧を取得（日付範囲指定）
   * @param startDate 開始日 (YYYY-MM-DD)
   * @param endDate 終了日 (YYYY-MM-DD)
   */
  async getEvents(startDate: string, endDate: string): Promise<CalendarEventDto[]> {
    const response = await apiClient.get<{ data: CalendarEventDto[] }>(
      `/api/desktop/calendar?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },

  /**
   * イベント詳細を取得
   * @param id イベントID
   */
  async getEventById(id: number): Promise<CalendarEventDto> {
    const response = await apiClient.get<{ data: CalendarEventDto }>(`/api/desktop/calendar/${id}`);
    return response.data.data;
  },

  /**
   * イベントを作成
   * @param request 作成リクエスト
   */
  async createEvent(request: CreateEventRequestDto): Promise<CalendarEventDto> {
    const response = await apiClient.post<{ data: CalendarEventDto }>(
      '/api/desktop/calendar',
      request
    );
    return response.data.data;
  },

  /**
   * イベントを更新
   * @param id イベントID
   * @param request 更新リクエスト
   */
  async updateEvent(id: number, request: UpdateEventRequestDto): Promise<CalendarEventDto> {
    const response = await apiClient.put<{ data: CalendarEventDto }>(
      `/api/desktop/calendar/${id}`,
      request
    );
    return response.data.data;
  },

  /**
   * イベントを削除
   * @param id イベントID
   */
  async deleteEvent(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/calendar/${id}`);
  },
};
