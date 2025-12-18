/**
 * Photo Service
 * 写真管理APIサービス
 */

import apiClient from './apiClient';
import type {
  PhotoDto,
  UploadPhotoRequestDto,
  UpdatePhotoRequestDto,
  PhotoFilterDto,
  ValidateChildrenForPhotoRequestDto,
  ValidateChildrenForPhotoResponseDto,
} from '../types/photo';

/**
 * 写真管理サービス
 */
export const photoService = {
  /**
   * 写真一覧を取得
   * @param filter フィルタ条件
   */
  async getPhotos(filter?: PhotoFilterDto): Promise<PhotoDto[]> {
    const response = await apiClient.get<{ data: PhotoDto[] }>('/api/desktop/photos', {
      params: filter,
    });
    return response.data.data;
  },

  /**
   * 写真詳細を取得
   * @param id 写真ID
   */
  async getPhotoById(id: number): Promise<PhotoDto> {
    const response = await apiClient.get<{ data: PhotoDto }>(`/api/desktop/photos/${id}`);
    return response.data.data;
  },

  /**
   * 写真をアップロード
   * @param request アップロードリクエスト
   */
  async uploadPhoto(request: UploadPhotoRequestDto): Promise<PhotoDto> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.description) {
      formData.append('description', request.description);
    }
    formData.append('publishedAt', request.publishedAt);
    formData.append('visibilityLevel', request.visibilityLevel);

    if (request.targetClassId) {
      formData.append('targetClassId', request.targetClassId);
    }
    formData.append('status', request.status);
    formData.append('requiresConsent', String(request.requiresConsent));
    formData.append('staffId', String(request.staffId));

    // 配列の送信（複数のchildIdを送信）
    request.childIds.forEach((childId) => {
      formData.append('childIds', String(childId));
    });

    if (request.primaryChildId !== undefined) {
      formData.append('primaryChildId', String(request.primaryChildId));
    }

    const response = await apiClient.post<{ data: PhotoDto }>('/api/desktop/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * 写真メタデータを更新
   * @param id 写真ID
   * @param request 更新リクエスト
   */
  async updatePhoto(id: number, request: UpdatePhotoRequestDto): Promise<PhotoDto> {
    const response = await apiClient.put<{ data: PhotoDto }>(`/api/desktop/photos/${id}`, request);
    return response.data.data;
  },

  /**
   * 写真を削除
   * @param id 写真ID
   */
  async deletePhoto(id: number): Promise<void> {
    await apiClient.delete(`/api/desktop/photos/${id}`);
  },

  /**
   * 園児の写真一覧を取得
   * @param childId 園児ID
   */
  async getPhotosByChild(childId: number): Promise<PhotoDto[]> {
    const response = await apiClient.get<{ data: PhotoDto[] }>(`/api/desktop/photos/child/${childId}`);
    return response.data.data;
  },

  /**
   * クラスの写真一覧を取得
   * @param classId クラスID
   */
  async getPhotosByClass(classId: string): Promise<PhotoDto[]> {
    const response = await apiClient.get<{ data: PhotoDto[] }>(`/api/desktop/photos/class/${classId}`);
    return response.data.data;
  },

  /**
   * 園児の撮影禁止チェック
   * @param request チェック対象の園児IDリスト
   */
  async validateChildrenForPhoto(
    request: ValidateChildrenForPhotoRequestDto
  ): Promise<ValidateChildrenForPhotoResponseDto> {
    const response = await apiClient.post<{ data: ValidateChildrenForPhotoResponseDto }>(
      '/api/desktop/photos/validate-children',
      request
    );
    return response.data.data;
  },
};
