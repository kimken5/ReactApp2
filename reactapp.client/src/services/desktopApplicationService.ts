/**
 * デスクトップアプリ - 入園申込管理 APIサービス
 */

import { apiClient } from '../desktop/services/apiClient';
import type {
  ApplicationWorkDto,
  ApplicationListItemDto,
  ImportApplicationRequest,
  ImportApplicationResult,
  RejectApplicationRequest,
  PaginatedResult,
  GetApplicationListParams,
} from '../types/desktopApplication';

const API_BASE_URL = '/api/desktop/application';

/**
 * 申込一覧を取得
 */
export async function getApplicationList(
  params: GetApplicationListParams
): Promise<PaginatedResult<ApplicationListItemDto>> {
  const queryParams: Record<string, string | number> = {
    page: params.page,
    pageSize: params.pageSize,
  };

  if (params.status && params.status !== 'All') {
    queryParams.status = params.status;
  }

  // Backend doesn't support search, sortBy, sortOrder yet
  // TODO: Add these parameters to backend API if needed

  const response = await apiClient.get<{ success: boolean; data: PaginatedResult<ApplicationListItemDto> }>(
    API_BASE_URL,
    { params: queryParams }
  );

  return response.data.data;
}

/**
 * 申込詳細を取得
 */
export async function getApplicationDetail(id: number): Promise<ApplicationWorkDto> {
  const response = await apiClient.get<{ success: boolean; data: ApplicationWorkDto }>(`${API_BASE_URL}/${id}`);
  return response.data.data;
}

/**
 * 申込をインポート
 */
export async function importApplication(
  id: number,
  request: ImportApplicationRequest
): Promise<ImportApplicationResult> {
  const response = await apiClient.post<{ success: boolean; data: ImportApplicationResult }>(
    `${API_BASE_URL}/${id}/import`,
    request
  );
  return response.data.data;
}

/**
 * 申込を却下
 */
export async function rejectApplication(
  id: number,
  request: RejectApplicationRequest
): Promise<void> {
  await apiClient.post<{ success: boolean }>(`${API_BASE_URL}/${id}/reject`, request);
}
