import apiClient from '../desktop/services/apiClient';
import type {
  ClassStaffAssignment,
  AvailableStaff,
  AssignStaffToClassRequest,
  UnassignStaffFromClassRequest,
  UpdateAssignmentRoleRequest,
  StaffClassAssignment,
} from '../types/staffClassAssignment';

const API_BASE_URL = '/api/staff-class-assignments';

/**
 * スタッフクラス割り当てサービス
 */
class StaffClassAssignmentService {
  /**
   * クラス別担任割り当て一覧を取得
   */
  async getClassStaffAssignments(nurseryId: number, academicYear: number): Promise<ClassStaffAssignment[]> {
    const response = await apiClient.get<ClassStaffAssignment[]>(`${API_BASE_URL}/${nurseryId}/${academicYear}`);
    return response.data;
  }

  /**
   * 利用可能なスタッフ一覧を取得
   */
  async getAvailableStaff(nurseryId: number, academicYear: number): Promise<AvailableStaff[]> {
    const response = await apiClient.get<AvailableStaff[]>(`${API_BASE_URL}/${nurseryId}/${academicYear}/available-staff`);
    return response.data;
  }

  /**
   * スタッフをクラスに割り当て
   */
  async assignStaffToClass(request: AssignStaffToClassRequest): Promise<StaffClassAssignment> {
    const response = await apiClient.post<StaffClassAssignment>(`${API_BASE_URL}/assign`, request);
    return response.data;
  }

  /**
   * スタッフのクラス割り当てを解除
   */
  async unassignStaffFromClass(request: UnassignStaffFromClassRequest): Promise<void> {
    await apiClient.post(`${API_BASE_URL}/unassign`, request);
  }

  /**
   * スタッフの割り当て役割を更新
   */
  async updateAssignmentRole(
    nurseryId: number,
    academicYear: number,
    staffId: number,
    classId: string,
    request: UpdateAssignmentRoleRequest
  ): Promise<StaffClassAssignment> {
    const response = await apiClient.put<StaffClassAssignment>(
      `${API_BASE_URL}/${nurseryId}/${academicYear}/${staffId}/${classId}/role`,
      request
    );
    return response.data;
  }
}

export const staffClassAssignmentService = new StaffClassAssignmentService();
