import apiClient from '../desktop/services/apiClient';
import type {
  ClassWithChildren,
  AvailableChild,
  ChildClassAssignment,
  AssignChildToClassRequest,
  BulkAssignChildrenRequest,
} from '../types/childClassAssignment';

const API_BASE_URL = '/api/childclassassignment';

/**
 * 園児クラス割り当てAPIサービス
 */
export const childClassAssignmentService = {
  /**
   * 指定年度の全クラスと割り当て済み園児を取得
   */
  async getClassesWithChildren(nurseryId: number, academicYear: number): Promise<ClassWithChildren[]> {
    const response = await apiClient.get<{ success: boolean; data: ClassWithChildren[] }>(
      `${API_BASE_URL}/${nurseryId}/${academicYear}/classes`
    );
    return response.data.data;
  },

  /**
   * 指定年度の割り当て可能な園児一覧を取得
   */
  async getAvailableChildren(nurseryId: number, academicYear: number): Promise<AvailableChild[]> {
    const response = await apiClient.get<{ success: boolean; data: AvailableChild[] }>(
      `${API_BASE_URL}/${nurseryId}/${academicYear}/children`
    );
    return response.data.data;
  },

  /**
   * 園児をクラスに割り当て
   */
  async assignChildToClass(request: AssignChildToClassRequest): Promise<ChildClassAssignment> {
    const response = await apiClient.post<{ success: boolean; data: ChildClassAssignment }>(
      `${API_BASE_URL}/assign`,
      request
    );
    return response.data.data;
  },

  /**
   * 園児のクラス割り当てを解除
   */
  async unassignChildFromClass(nurseryId: number, academicYear: number, childId: number): Promise<void> {
    await apiClient.delete(`${API_BASE_URL}/${nurseryId}/${academicYear}/${childId}`);
  },

  /**
   * 一括で園児をクラスに割り当て
   */
  async bulkAssignChildren(request: BulkAssignChildrenRequest): Promise<ChildClassAssignment[]> {
    const response = await apiClient.post<{ success: boolean; data: ChildClassAssignment[] }>(
      `${API_BASE_URL}/bulk-assign`,
      request
    );
    return response.data.data;
  },
};
