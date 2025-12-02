/**
 * スタッフクラス割り当て型定義
 */

export interface StaffClassAssignment {
  academicYear: number;
  nurseryId: number;
  staffId: number;
  staffName: string;
  classId: string;
  className: string;
  assignmentRole?: string;
  isCurrent: boolean;
  isFuture: boolean;
  isActive: boolean;
  notes?: string;
  assignedAt: string;
}

export interface ClassStaffAssignment {
  classId: string;
  className: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
  assignedStaff: AssignedStaff[];
}

export interface AssignedStaff {
  staffId: number;
  staffName: string;
  role?: string;
  assignmentRole?: string;
  notes?: string;
  assignedAt: string;
}

export interface AvailableStaff {
  staffId: number;
  name: string;
  role: string;
  position?: string;
  currentAssignedClasses: string[];
}

export interface AssignStaffToClassRequest {
  nurseryId: number;
  academicYear: number;
  staffId: number;
  classId: string;
  assignmentRole?: string;
  notes?: string;
  assignedByUserId?: number;
}

export interface UnassignStaffFromClassRequest {
  nurseryId: number;
  academicYear: number;
  staffId: number;
  classId: string;
}

export interface UpdateAssignmentRoleRequest {
  assignmentRole?: string;
  notes?: string;
}

export const AssignmentRoles = {
  MainTeacher: 'MainTeacher',
  AssistantTeacher: 'AssistantTeacher',
} as const;

export const AssignmentRoleLabels: Record<string, string> = {
  MainTeacher: '主担任',
  AssistantTeacher: '副担任',
};
