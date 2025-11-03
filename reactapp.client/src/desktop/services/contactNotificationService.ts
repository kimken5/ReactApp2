import { apiClient } from './apiClient';
import type {
  ContactNotificationDto,
  ContactNotificationFilterDto,
  ContactNotificationResponseDto,
  CreateResponseRequestDto,
  AcknowledgeNotificationRequestDto,
} from '../types/contactNotification';

const API_BASE_URL = '/api/desktop/contact-notifications';

/**
 * デスクトップアプリ用連絡通知サービス
 */
export const contactNotificationService = {
  /**
   * 連絡通知一覧を取得
   */
  async getContactNotifications(
    filter: ContactNotificationFilterDto
  ): Promise<ContactNotificationDto[]> {
    const response = await apiClient.get<{ success: boolean; data: ContactNotificationDto[] }>(API_BASE_URL, {
      params: filter,
    });
    return response.data.data;
  },

  /**
   * 連絡通知詳細を取得
   */
  async getContactNotificationById(id: number): Promise<ContactNotificationDto> {
    const response = await apiClient.get<{ success: boolean; data: ContactNotificationDto }>(`${API_BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * 連絡通知を確認済みにする
   */
  async acknowledgeNotification(
    id: number,
    request: AcknowledgeNotificationRequestDto
  ): Promise<ContactNotificationDto> {
    const response = await apiClient.put<{ success: boolean; data: ContactNotificationDto }>(
      `${API_BASE_URL}/${id}/acknowledge`,
      request
    );
    return response.data.data;
  },

  /**
   * 連絡通知に返信を追加
   */
  async createResponse(
    notificationId: number,
    request: CreateResponseRequestDto
  ): Promise<ContactNotificationResponseDto> {
    const response = await apiClient.post<{ success: boolean; data: ContactNotificationResponseDto }>(
      `${API_BASE_URL}/${notificationId}/responses`,
      request
    );
    return response.data.data;
  },

  /**
   * 連絡通知を削除
   */
  async deleteContactNotification(id: number): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/${id}`);
  },

  /**
   * 未確認の連絡通知数を取得
   */
  async getUnacknowledgedCount(): Promise<number> {
    const response = await apiClient.get<{ success: boolean; data: number }>(`${API_BASE_URL}/unacknowledged/count`);
    return response.data.data;
  },
};
