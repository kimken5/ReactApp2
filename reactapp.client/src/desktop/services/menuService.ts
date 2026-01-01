import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/auth';
import type {
  MenuMasterDto,
  CreateMenuMasterDto,
  UpdateMenuMasterDto,
  MenuMasterSearchDto,
  DailyMenuDto,
  CreateDailyMenuDto,
  UpdateDailyMenuDto,
  BulkCreateDailyMenusDto,
} from '../types/menu';

export const menuService = {
  // ===== 献立マスター管理 =====

  // 献立マスター一覧取得
  async getMenuMasters(): Promise<MenuMasterDto[]> {
    const response = await apiClient.get<ApiResponse<MenuMasterDto[]>>('/api/desktop/menus/masters');
    return response.data.data!;
  },

  // 献立マスター検索（オートコンプリート）
  async searchMenuMasters(query: string): Promise<MenuMasterSearchDto[]> {
    const response = await apiClient.get<ApiResponse<MenuMasterSearchDto[]>>('/api/desktop/menus/masters/search', {
      params: { query },
    });
    return response.data.data!;
  },

  // 献立マスター詳細取得
  async getMenuMasterById(id: number): Promise<MenuMasterDto> {
    const response = await apiClient.get<ApiResponse<MenuMasterDto>>(`/api/desktop/menus/masters/${id}`);
    return response.data.data!;
  },

  // 献立マスター作成
  async createMenuMaster(data: CreateMenuMasterDto): Promise<MenuMasterDto> {
    const response = await apiClient.post<ApiResponse<MenuMasterDto>>('/api/desktop/menus/masters', data);
    return response.data.data!;
  },

  // 献立マスター更新
  async updateMenuMaster(id: number, data: UpdateMenuMasterDto): Promise<MenuMasterDto> {
    const response = await apiClient.put<ApiResponse<MenuMasterDto>>(`/api/desktop/menus/masters/${id}`, data);
    return response.data.data!;
  },

  // 献立マスター削除
  async deleteMenuMaster(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/menus/masters/${id}`);
  },

  // ===== 日別献立管理 =====

  // 日別献立一覧取得（期間指定）
  async getDailyMenus(startDate: string, endDate: string): Promise<DailyMenuDto[]> {
    const response = await apiClient.get<ApiResponse<DailyMenuDto[]>>('/api/desktop/menus/daily', {
      params: { startDate, endDate },
    });
    return response.data.data!;
  },

  // 特定日の日別献立取得
  async getDailyMenusByDate(date: string): Promise<DailyMenuDto[]> {
    const response = await apiClient.get<ApiResponse<DailyMenuDto[]>>(`/api/desktop/menus/daily/${date}`);
    return response.data.data!;
  },

  // 日別献立作成（個別）
  async createDailyMenu(data: CreateDailyMenuDto): Promise<DailyMenuDto> {
    const response = await apiClient.post<ApiResponse<DailyMenuDto>>('/api/desktop/menus/daily', data);
    return response.data.data!;
  },

  // 日別献立更新
  async updateDailyMenu(id: number, data: UpdateDailyMenuDto): Promise<DailyMenuDto> {
    const response = await apiClient.put<ApiResponse<DailyMenuDto>>(`/api/desktop/menus/daily/${id}`, data);
    return response.data.data!;
  },

  // 日別献立削除（個別）
  async deleteDailyMenu(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/menus/daily/${id}`);
  },

  // 日別献立一括登録
  async bulkCreateDailyMenus(data: BulkCreateDailyMenusDto): Promise<void> {
    await apiClient.post('/api/desktop/menus/daily/bulk', data);
  },

  // 特定日の日別献立削除
  async deleteDailyMenusByDate(date: string): Promise<void> {
    await apiClient.delete(`/api/desktop/menus/daily/date/${date}`);
  },
};
