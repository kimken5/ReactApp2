/**
 * Daily Report Service
 * 日報管理APIサービス
 */

import apiClient from './apiClient';
import type {
  DailyReportDto,
  CreateDailyReportRequestDto,
  UpdateDailyReportRequestDto,
  DailyReportFilterDto,
} from '../types/dailyReport';

/**
 * 日報管理サービス
 */
export const dailyReportService = {
  /**
   * 日報一覧を取得
   * @param filter フィルタ条件
   */
  async getDailyReports(filter?: DailyReportFilterDto): Promise<DailyReportDto[]> {
    const response = await apiClient.get<{ data: DailyReportDto[] }>('/api/desktop/dailyreports', {
      params: filter,
    });
    return response.data.data;
  },

  /**
   * 日報詳細を取得
   * @param id 日報ID
   */
  async getDailyReportById(id: number): Promise<DailyReportDto> {
    const response = await apiClient.get<{ data: DailyReportDto }>(`/api/desktop/dailyreports/${id}`);
    return response.data.data;
  },

  /**
   * 日報を作成
   * @param request 作成リクエスト
   */
  async createDailyReport(request: CreateDailyReportRequestDto): Promise<DailyReportDto> {
    const response = await apiClient.post<{ data: DailyReportDto }>('/api/desktop/dailyreports', request);
    return response.data.data;
  },

  /**
   * 日報を更新
   * @param id 日報ID
   * @param request 更新リクエスト
   */
  async updateDailyReport(id: number, request: UpdateDailyReportRequestDto): Promise<DailyReportDto> {
    const response = await apiClient.put<{ data: DailyReportDto }>(`/api/desktop/dailyreports/${id}`, request);
    return response.data.data;
  },

  /**
   * 日報を削除
   * @param id 日報ID
   */
  async deleteDailyReport(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/dailyreports/${id}`);
  },

  /**
   * 日報を公開
   * @param id 日報ID
   */
  async publishDailyReport(id: number): Promise<DailyReportDto> {
    const response = await apiClient.post<{ data: DailyReportDto }>(`/api/desktop/dailyreports/${id}/publish`);
    return response.data.data;
  },

  /**
   * 下書き一覧を取得
   * @param staffId 職員ID
   */
  async getDraftReports(staffId: number): Promise<DailyReportDto[]> {
    const response = await apiClient.get<{ data: DailyReportDto[] }>('/api/desktop/dailyreports/drafts', {
      params: { staffId },
    });
    return response.data.data;
  },

  /**
   * 特定日の日報を取得
   * @param date 日付（ISO形式）
   */
  async getReportsByDate(date: string): Promise<DailyReportDto[]> {
    const response = await apiClient.get<{ data: DailyReportDto[] }>('/api/desktop/dailyreports/by-date', {
      params: { date },
    });
    return response.data.data;
  },
};
