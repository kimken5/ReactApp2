import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/auth';
import type {
  NurseryDto,
  UpdateNurseryRequestDto,
  ClassDto,
  CreateClassRequestDto,
  UpdateClassRequestDto,
  ClassFilterDto,
  ClassCompositionDto,
  UpdateClassCompositionRequestDto,
  ChildDto,
  CreateChildRequestDto,
  UpdateChildRequestDto,
  ChildFilterDto,
  ParentDto,
  CreateParentRequestDto,
  UpdateParentRequestDto,
  ParentFilterDto,
  StaffDto,
  CreateStaffRequestDto,
  UpdateStaffRequestDto,
  StaffFilterDto,
  StaffClassAssignmentDto,
  StaffClassAssignmentRequestDto,
} from '../types/master';

// ===== 保育園情報管理 =====
export const masterService = {
  // 保育園情報取得
  async getNursery(): Promise<NurseryDto> {
    const response = await apiClient.get<ApiResponse<NurseryDto>>('/api/desktop/master/nursery');
    return response.data.data!;
  },

  // 保育園情報更新
  async updateNursery(request: UpdateNurseryRequestDto): Promise<NurseryDto> {
    const response = await apiClient.put<ApiResponse<NurseryDto>>('/api/desktop/master/nursery', request);
    return response.data.data!;
  },

  // ===== クラス管理 =====
  // クラス一覧取得
  async getClasses(filter?: ClassFilterDto): Promise<ClassDto[]> {
    const response = await apiClient.get<ApiResponse<ClassDto[]>>('/api/desktop/master/classes', {
      params: filter,
    });
    return response.data.data!;
  },

  // クラス詳細取得
  async getClass(classId: string): Promise<ClassDto> {
    const response = await apiClient.get<ApiResponse<ClassDto>>(`/api/desktop/master/classes/${classId}`);
    return response.data.data!;
  },

  // クラス作成
  async createClass(request: CreateClassRequestDto): Promise<ClassDto> {
    const response = await apiClient.post<ApiResponse<ClassDto>>('/api/desktop/master/classes', request);
    return response.data.data!;
  },

  // クラス更新
  async updateClass(classId: string, request: UpdateClassRequestDto): Promise<ClassDto> {
    const response = await apiClient.put<ApiResponse<ClassDto>>(`/api/desktop/master/classes/${classId}`, request);
    return response.data.data!;
  },

  // クラス削除
  async deleteClass(classId: string): Promise<void> {
    await apiClient.delete(`/api/desktop/master/classes/${classId}`);
  },

  // ===== クラス構成管理 =====
  // クラス構成取得
  async getClassComposition(classId: string): Promise<ClassCompositionDto> {
    const response = await apiClient.get<ApiResponse<ClassCompositionDto>>(
      `/api/desktop/master/classes/${classId}/composition`
    );
    return response.data.data!;
  },

  // クラス構成更新
  async updateClassComposition(
    classId: string,
    request: UpdateClassCompositionRequestDto
  ): Promise<ClassCompositionDto> {
    const response = await apiClient.put<ApiResponse<ClassCompositionDto>>(
      `/api/desktop/master/classes/${classId}/composition`,
      request
    );
    return response.data.data!;
  },

  // ===== 園児管理 =====
  // 園児一覧取得
  async getChildren(filter?: ChildFilterDto): Promise<ChildDto[]> {
    const response = await apiClient.get<ApiResponse<ChildDto[]>>('/api/desktop/master/children', {
      params: filter,
    });
    return response.data.data!;
  },

  // 園児詳細取得
  async getChild(childId: number): Promise<ChildDto> {
    const response = await apiClient.get<ApiResponse<ChildDto>>(`/api/desktop/master/children/${childId}`);
    return response.data.data!;
  },

  // 園児作成
  async createChild(request: CreateChildRequestDto): Promise<ChildDto> {
    const response = await apiClient.post<ApiResponse<ChildDto>>('/api/desktop/master/children', request);
    return response.data.data!;
  },

  // 園児更新
  async updateChild(childId: number, request: UpdateChildRequestDto): Promise<ChildDto> {
    const response = await apiClient.put<ApiResponse<ChildDto>>(`/api/desktop/master/children/${childId}`, request);
    return response.data.data!;
  },

  // 園児削除
  async deleteChild(childId: number): Promise<void> {
    await apiClient.delete(`/api/desktop/master/children/${childId}`);
  },

  // ===== 保護者管理 =====
  // 保護者一覧取得
  async getParents(filter?: ParentFilterDto): Promise<ParentDto[]> {
    const response = await apiClient.get<ApiResponse<ParentDto[]>>('/api/desktop/master/parents', {
      params: filter,
    });
    return response.data.data!;
  },

  // 保護者詳細取得
  async getParent(parentId: number): Promise<ParentDto> {
    const response = await apiClient.get<ApiResponse<ParentDto>>(`/api/desktop/master/parents/${parentId}`);
    return response.data.data!;
  },

  // 保護者作成
  async createParent(request: CreateParentRequestDto): Promise<ParentDto> {
    const response = await apiClient.post<ApiResponse<ParentDto>>('/api/desktop/master/parents', request);
    return response.data.data!;
  },

  // 保護者更新
  async updateParent(parentId: number, request: UpdateParentRequestDto): Promise<ParentDto> {
    const response = await apiClient.put<ApiResponse<ParentDto>>(`/api/desktop/master/parents/${parentId}`, request);
    return response.data.data!;
  },

  // 保護者削除
  async deleteParent(parentId: number): Promise<void> {
    await apiClient.delete(`/api/desktop/master/parents/${parentId}`);
  },

  // ===== 職員管理 =====
  // 職員一覧取得
  async getStaff(filter?: StaffFilterDto): Promise<StaffDto[]> {
    const response = await apiClient.get<ApiResponse<StaffDto[]>>('/api/desktop/master/staff', {
      params: filter,
    });
    return response.data.data!;
  },

  // 職員詳細取得
  async getStaffById(staffId: number): Promise<StaffDto> {
    const response = await apiClient.get<ApiResponse<StaffDto>>(`/api/desktop/master/staff/${staffId}`);
    return response.data.data!;
  },

  // 職員作成
  async createStaff(request: CreateStaffRequestDto): Promise<StaffDto> {
    const response = await apiClient.post<ApiResponse<StaffDto>>('/api/desktop/master/staff', request);
    return response.data.data!;
  },

  // 職員更新
  async updateStaff(staffId: number, request: UpdateStaffRequestDto): Promise<StaffDto> {
    const response = await apiClient.put<ApiResponse<StaffDto>>(`/api/desktop/master/staff/${staffId}`, request);
    return response.data.data!;
  },

  // 職員削除
  async deleteStaff(staffId: number): Promise<void> {
    await apiClient.delete(`/api/desktop/master/staff/${staffId}`);
  },

  // 職員クラス担当取得
  async getStaffClassAssignments(staffId: number): Promise<StaffClassAssignmentDto[]> {
    const response = await apiClient.get<ApiResponse<StaffClassAssignmentDto[]>>(
      `/api/desktop/master/staff/${staffId}/class-assignments`
    );
    return response.data.data!;
  },

  // 職員クラス担当更新
  async updateStaffClassAssignments(
    staffId: number,
    assignments: StaffClassAssignmentRequestDto[]
  ): Promise<StaffClassAssignmentDto[]> {
    const response = await apiClient.put<ApiResponse<StaffClassAssignmentDto[]>>(
      `/api/desktop/master/staff/${staffId}/class-assignments`,
      assignments
    );
    return response.data.data!;
  },
};
