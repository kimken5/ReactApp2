import { apiClient } from './apiClient';
import type {
  NurseryDayTypeDto,
  CreateNurseryDayTypeRequest,
  UpdateNurseryDayTypeRequest,
} from '../types/calendar';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 休園日・休日保育サービス
 */
class NurseryDayTypeService {
  private baseUrl = '/api/desktop/nursery-day-types';

  /**
   * 期間内の休園日・休日保育一覧を取得
   */
  async getNurseryDayTypes(startDate: string, endDate: string): Promise<NurseryDayTypeDto[]> {
    const response = await apiClient.get<ApiResponse<NurseryDayTypeDto[]>>(
      `${this.baseUrl}?startDate=${startDate}&endDate=${endDate}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '休園日・休日保育の取得に失敗しました');
    }

    return response.data.data;
  }

  /**
   * 特定日付の休園日・休日保育を取得
   */
  async getNurseryDayTypeByDate(date: string): Promise<NurseryDayTypeDto | null> {
    try {
      const response = await apiClient.get<ApiResponse<NurseryDayTypeDto>>(
        `${this.baseUrl}/${date}`
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      // 404の場合はnullを返す
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 休園日・休日保育を作成
   */
  async createNurseryDayType(request: CreateNurseryDayTypeRequest): Promise<NurseryDayTypeDto> {
    const response = await apiClient.post<ApiResponse<NurseryDayTypeDto>>(
      this.baseUrl,
      request
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '休園日・休日保育の作成に失敗しました');
    }

    return response.data.data;
  }

  /**
   * 休園日・休日保育を更新
   */
  async updateNurseryDayType(id: number, request: UpdateNurseryDayTypeRequest): Promise<NurseryDayTypeDto> {
    const response = await apiClient.put<ApiResponse<NurseryDayTypeDto>>(
      `${this.baseUrl}/${id}`,
      request
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || '休園日・休日保育の更新に失敗しました');
    }

    return response.data.data;
  }

  /**
   * 休園日・休日保育を削除
   */
  async deleteNurseryDayType(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `${this.baseUrl}/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || '休園日・休日保育の削除に失敗しました');
    }
  }
}

export const nurseryDayTypeService = new NurseryDayTypeService();
