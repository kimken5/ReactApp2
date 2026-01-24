/**
 * Infant Record Service
 * 乳児記録管理APIサービス
 */

import apiClient from './apiClient';
import type {
  ClassTemperatureBulkRequest,
  ClassTemperatureBulkResponse,
  ClassTemperatureListResponse,
  CreateInfantMilkRequest,
  CreateInfantSleepCheckRequest,
  CreateRoomEnvironmentRecordRequest,
  InfantMilk,
  InfantSleepCheck,
  RoomEnvironmentRecord,
} from '../../types/infantRecords';

/**
 * 乳児記録管理サービス
 */
export const infantRecordService = {
  /**
   * クラス全員の体温一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getClassTemperatures(classId: string, date: string): Promise<ClassTemperatureListResponse> {
    const response = await apiClient.get<ClassTemperatureListResponse>(
      `/api/desktop/infant-temperatures/class-bulk`,
      {
        params: { classId, date },
      }
    );
    return response.data;
  },

  /**
   * クラス全員の体温を一括保存
   * @param request 一括体温入力リクエスト
   */
  async saveClassTemperatures(
    request: ClassTemperatureBulkRequest
  ): Promise<ClassTemperatureBulkResponse> {
    const response = await apiClient.post<{ data: ClassTemperatureBulkResponse }>(
      `/api/desktop/infant-temperatures/class-bulk`,
      request
    );
    return response.data.data;
  },

  /**
   * 乳児ミルク記録を取得
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   */
  async getInfantMilks(childId: number, date: string): Promise<InfantMilk[]> {
    const response = await apiClient.get<{ data: InfantMilk[] }>(
      `/api/desktop/infant-milks/${childId}/${date}`
    );
    return response.data.data;
  },

  /**
   * 乳児ミルク記録を作成
   * @param request ミルク記録作成リクエスト
   */
  async createInfantMilk(request: CreateInfantMilkRequest): Promise<InfantMilk> {
    const response = await apiClient.post<{ data: InfantMilk }>(
      `/api/desktop/infant-milks`,
      request
    );
    return response.data.data;
  },

  /**
   * 乳児ミルク記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param milkTime ミルク時刻（HH:mm:ss）
   */
  async deleteInfantMilk(childId: number, date: string, milkTime: string): Promise<void> {
    await apiClient.delete(`/api/desktop/infant-milks/${childId}/${date}/${milkTime}`);
  },

  /**
   * 午睡チェック記録を取得
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   */
  async getInfantSleepChecks(childId: number, date: string): Promise<InfantSleepCheck[]> {
    const response = await apiClient.get<{ data: InfantSleepCheck[] }>(
      `/api/desktop/infant-sleep-checks/${childId}/${date}`
    );
    return response.data.data;
  },

  /**
   * 午睡チェック記録を作成
   * @param request 午睡チェック作成リクエスト
   */
  async createInfantSleepCheck(request: CreateInfantSleepCheckRequest): Promise<InfantSleepCheck> {
    const response = await apiClient.post<{ data: InfantSleepCheck }>(
      `/api/desktop/infant-sleep-checks`,
      request
    );
    return response.data.data;
  },

  /**
   * 午睡チェック記録を削除
   * @param id 午睡チェックID
   */
  async deleteInfantSleepCheck(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/infant-sleep-checks/${id}`);
  },

  /**
   * 室温・湿度記録を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getRoomEnvironmentRecords(classId: string, date: string): Promise<RoomEnvironmentRecord[]> {
    const response = await apiClient.get<{ data: RoomEnvironmentRecord[] }>(
      `/api/desktop/room-environment/${classId}/${date}`
    );
    return response.data.data;
  },

  /**
   * 室温・湿度記録を作成
   * @param request 室温・湿度記録作成リクエスト
   */
  async createRoomEnvironmentRecord(
    request: CreateRoomEnvironmentRecordRequest
  ): Promise<RoomEnvironmentRecord> {
    const response = await apiClient.post<{ data: RoomEnvironmentRecord }>(
      `/api/desktop/room-environment`,
      request
    );
    return response.data.data;
  },

  /**
   * 室温・湿度記録を削除
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async deleteRoomEnvironmentRecord(classId: string, date: string): Promise<void> {
    await apiClient.delete(`/api/desktop/room-environment/${classId}/${date}`);
  },
};
