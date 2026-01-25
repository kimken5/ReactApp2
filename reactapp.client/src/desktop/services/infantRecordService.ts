/**
 * Infant Record Service
 * 乳児記録管理APIサービス
 */

import apiClient from './apiClient';
import type { ApiResponse } from '../types/auth';
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
import type {
  InfantMilkDto,
  InfantMealDto,
  InfantSleepDto,
  InfantToiletingDto,
  InfantMoodDto,
  RoomEnvironmentDto,
  CreateInfantMilkDto,
  CreateInfantMealDto,
  CreateInfantSleepDto,
  CreateInfantToiletingDto,
  CreateInfantMoodDto,
  CreateRoomEnvironmentDto,
  UpdateInfantMilkDto,
  UpdateInfantMealDto,
  UpdateInfantSleepDto,
  UpdateInfantToiletingDto,
  UpdateInfantMoodDto,
  UpdateRoomEnvironmentDto,
  ClassChildrenResponse,
} from '../types/infantRecord';

const BASE_URL = '/api/desktop/infant-records';

/**
 * 乳児記録管理サービス
 */
export const infantRecordService = {
  // ========================================
  // 体温管理（既存機能）
  // ========================================

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
    const response = await apiClient.post<ClassTemperatureBulkResponse>(
      `/api/desktop/infant-temperatures/class-bulk`,
      request
    );
    return response.data;
  },

  // ========================================
  // ミルク記録
  // ========================================

  /**
   * クラス内のミルク記録一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getMilkRecords(classId: string, date: string): Promise<InfantMilkDto[]> {
    const response = await apiClient.get<ApiResponse<InfantMilkDto[]>>(
      `${BASE_URL}/milk`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  /**
   * 乳児ミルク記録を作成
   * @param data ミルク記録作成データ
   */
  async createMilkRecord(data: CreateInfantMilkDto): Promise<InfantMilkDto> {
    const response = await apiClient.post<ApiResponse<InfantMilkDto>>(
      `${BASE_URL}/milk`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児ミルク記録を更新
   * @param data ミルク記録更新データ
   */
  async updateMilkRecord(data: UpdateInfantMilkDto): Promise<InfantMilkDto> {
    const response = await apiClient.put<ApiResponse<InfantMilkDto>>(
      `${BASE_URL}/milk`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児ミルク記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param time ミルク時刻（HH:mm）
   */
  async deleteMilkRecord(childId: number, date: string, time: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/milk/${childId}/${date}/${time}`);
  },

  // ========================================
  // 食事記録
  // ========================================

  /**
   * クラス内の食事記録一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getMealRecords(classId: string, date: string): Promise<InfantMealDto[]> {
    const response = await apiClient.get<ApiResponse<InfantMealDto[]>>(
      `${BASE_URL}/meal`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  /**
   * 乳児食事記録を作成
   * @param data 食事記録作成データ
   */
  async createMealRecord(data: CreateInfantMealDto): Promise<InfantMealDto> {
    const response = await apiClient.post<ApiResponse<InfantMealDto>>(
      `${BASE_URL}/meal`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児食事記録を更新
   * @param data 食事記録更新データ
   */
  async updateMealRecord(data: UpdateInfantMealDto): Promise<InfantMealDto> {
    const response = await apiClient.put<ApiResponse<InfantMealDto>>(
      `${BASE_URL}/meal`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児食事記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param mealType 食事種別
   */
  async deleteMealRecord(childId: number, date: string, mealType: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/meals/${childId}/${date}/${mealType}`);
  },

  // ========================================
  // 睡眠記録
  // ========================================

  /**
   * クラス内の睡眠記録一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getSleepRecords(classId: string, date: string): Promise<InfantSleepDto[]> {
    const response = await apiClient.get<ApiResponse<InfantSleepDto[]>>(
      `${BASE_URL}/sleep`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  /**
   * 乳児睡眠記録を作成
   * @param data 睡眠記録作成データ
   */
  async createSleepRecord(data: CreateInfantSleepDto): Promise<InfantSleepDto> {
    const response = await apiClient.post<ApiResponse<InfantSleepDto>>(
      `${BASE_URL}/sleep`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児睡眠記録を更新
   * @param data 睡眠記録更新データ
   */
  async updateSleepRecord(data: UpdateInfantSleepDto): Promise<InfantSleepDto> {
    const response = await apiClient.put<ApiResponse<InfantSleepDto>>(
      `${BASE_URL}/sleep`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児睡眠記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param sequence 睡眠順序
   */
  async deleteSleepRecord(childId: number, date: string, sequence: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/sleep/${childId}/${date}/${sequence}`);
  },

  // ========================================
  // 排泄記録
  // ========================================

  /**
   * クラス内の排泄記録一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getToiletingRecords(classId: string, date: string): Promise<InfantToiletingDto[]> {
    const response = await apiClient.get<ApiResponse<InfantToiletingDto[]>>(
      `${BASE_URL}/toileting`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  /**
   * 乳児排泄記録を作成
   * @param data 排泄記録作成データ
   */
  async createToiletingRecord(data: CreateInfantToiletingDto): Promise<InfantToiletingDto> {
    const response = await apiClient.post<ApiResponse<InfantToiletingDto>>(
      `${BASE_URL}/toileting`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児排泄記録を更新
   * @param data 排泄記録更新データ
   */
  async updateToiletingRecord(data: UpdateInfantToiletingDto): Promise<InfantToiletingDto> {
    const response = await apiClient.put<ApiResponse<InfantToiletingDto>>(
      `${BASE_URL}/toileting`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児排泄記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   */
  async deleteToiletingRecord(childId: number, date: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/toileting/${childId}/${date}`);
  },

  // ========================================
  // 機嫌記録
  // ========================================

  /**
   * クラス内の機嫌記録一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getMoodRecords(classId: string, date: string): Promise<InfantMoodDto[]> {
    const response = await apiClient.get<ApiResponse<InfantMoodDto[]>>(
      `${BASE_URL}/mood`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  /**
   * 乳児機嫌記録を作成
   * @param data 機嫌記録作成データ
   */
  async createMoodRecord(data: CreateInfantMoodDto): Promise<InfantMoodDto> {
    const response = await apiClient.post<ApiResponse<InfantMoodDto>>(
      `${BASE_URL}/mood`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児機嫌記録を更新
   * @param data 機嫌記録更新データ
   */
  async updateMoodRecord(data: UpdateInfantMoodDto): Promise<InfantMoodDto> {
    const response = await apiClient.put<ApiResponse<InfantMoodDto>>(
      `${BASE_URL}/mood`,
      data
    );
    return response.data.data!;
  },

  /**
   * 乳児機嫌記録を削除
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param time 機嫌時刻（HH:mm）
   */
  async deleteMoodRecord(childId: number, date: string, time: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/mood/${childId}/${date}/${time}`);
  },

  // ========================================
  // 室温・湿度記録
  // ========================================

  /**
   * クラスの室温・湿度記録を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getRoomEnvironment(classId: string, date: string): Promise<RoomEnvironmentDto | null> {
    try {
      const response = await apiClient.get<RoomEnvironmentDto>(
        `${BASE_URL}/environment`,
        { params: { classId, date } }
      );
      return response.data || null;
    } catch (error: any) {
      // 404エラー（データが存在しない）の場合はnullを返す
      if (error.response?.status === 404) {
        return null;
      }
      // その他のエラーは再スロー
      throw error;
    }
  },

  /**
   * 室温・湿度記録を保存（作成または更新）
   * @param data 室温・湿度記録データ
   */
  async saveRoomEnvironment(data: CreateRoomEnvironmentDto | UpdateRoomEnvironmentDto): Promise<RoomEnvironmentDto> {
    const response = await apiClient.post<ApiResponse<RoomEnvironmentDto>>(
      `${BASE_URL}/environment`,
      data
    );
    return response.data.data!;
  },

  /**
   * 室温・湿度記録を削除
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async deleteRoomEnvironment(classId: string, date: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/environment/${classId}/${date}`);
  },

  // ========================================
  // ヘルパーメソッド
  // ========================================

  /**
   * クラス内の園児一覧を取得
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async getClassChildren(classId: string, date: string): Promise<ClassChildrenResponse> {
    const response = await apiClient.get<ApiResponse<ClassChildrenResponse>>(
      `${BASE_URL}/children`,
      { params: { classId, date } }
    );
    return response.data.data!;
  },

  // ========================================
  // 午睡チェック（既存機能）
  // ========================================

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

  // ========================================
  // 旧型ミルク記録（下位互換）
  // ========================================

  /**
   * 乳児ミルク記録を取得（旧型）
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
   * 乳児ミルク記録を作成（旧型）
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
   * 乳児ミルク記録を削除（旧型）
   * @param childId 園児ID
   * @param date 日付（YYYY-MM-DD）
   * @param milkTime ミルク時刻（HH:mm:ss）
   */
  async deleteInfantMilk(childId: number, date: string, milkTime: string): Promise<void> {
    await apiClient.delete(`/api/desktop/infant-milks/${childId}/${date}/${milkTime}`);
  },

  // ========================================
  // 旧型室温記録（下位互換）
  // ========================================

  /**
   * 室温・湿度記録を取得（旧型）
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
   * 室温・湿度記録を作成（旧型）
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
   * 室温・湿度記録を削除（旧型）
   * @param classId クラスID
   * @param date 日付（YYYY-MM-DD）
   */
  async deleteRoomEnvironmentRecord(classId: string, date: string): Promise<void> {
    await apiClient.delete(`/api/desktop/room-environment/${classId}/${date}`);
  },
};
