/**
 * Announcement Service
 * お知らせ管理APIサービス
 */

import apiClient from './apiClient';
import type {
  AnnouncementDto,
  CreateAnnouncementRequestDto,
  UpdateAnnouncementRequestDto,
  AnnouncementFilterDto,
  UnreadParentDto,
} from '../types/announcement';

/**
 * お知らせ管理サービス
 */
export const announcementService = {
  /**
   * お知らせ一覧を取得
   * @param filter フィルター条件
   */
  async getAnnouncements(filter?: AnnouncementFilterDto): Promise<AnnouncementDto[]> {
    const params = new URLSearchParams();

    if (filter?.category) params.append('category', filter.category);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.targetAudience) params.append('targetAudience', filter.targetAudience);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.searchKeyword) params.append('searchKeyword', filter.searchKeyword);

    const queryString = params.toString();
    const url = queryString
      ? `/api/desktop/announcements?${queryString}`
      : '/api/desktop/announcements';

    const response = await apiClient.get<{ data: AnnouncementDto[] }>(url);
    return response.data.data;
  },

  /**
   * お知らせ詳細を取得
   * @param id お知らせID
   */
  async getAnnouncementById(id: number): Promise<AnnouncementDto> {
    const response = await apiClient.get<{ data: AnnouncementDto }>(
      `/api/desktop/announcements/${id}`
    );
    return response.data.data;
  },

  /**
   * お知らせを作成
   * @param request 作成リクエスト
   */
  async createAnnouncement(request: CreateAnnouncementRequestDto): Promise<AnnouncementDto> {
    const response = await apiClient.post<{ data: AnnouncementDto }>(
      '/api/desktop/announcements',
      request
    );
    return response.data.data;
  },

  /**
   * お知らせを更新
   * @param id お知らせID
   * @param request 更新リクエスト
   */
  async updateAnnouncement(
    id: number,
    request: UpdateAnnouncementRequestDto
  ): Promise<AnnouncementDto> {
    const response = await apiClient.put<{ data: AnnouncementDto }>(
      `/api/desktop/announcements/${id}`,
      request
    );
    return response.data.data;
  },

  /**
   * お知らせを削除
   * @param id お知らせID
   */
  async deleteAnnouncement(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/announcements/${id}`);
  },

  /**
   * お知らせを即時配信
   * @param id お知らせID
   */
  async publishAnnouncement(id: number): Promise<AnnouncementDto> {
    const response = await apiClient.post<{ data: AnnouncementDto }>(
      `/api/desktop/announcements/${id}/publish`
    );
    return response.data.data;
  },

  /**
   * 未読保護者リストを取得
   * @param id お知らせID
   */
  async getUnreadParents(id: number): Promise<UnreadParentDto[]> {
    const response = await apiClient.get<{ data: UnreadParentDto[] }>(
      `/api/desktop/announcements/${id}/unread-parents`
    );
    return response.data.data;
  },
};
