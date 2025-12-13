// マスタ管理用の型定義

// ===== 保育園情報 =====
export interface NurseryDto {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  principalName?: string;
  establishedDate?: string;
  loginId?: string;
  lastLoginAt?: string;
  isLocked?: boolean;
  lockedUntil?: string;
  loginAttempts?: number;
}

export interface UpdateNurseryRequestDto {
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  principalName?: string;
  establishedDate?: string;
  currentPassword?: string;
  newPassword?: string;
}

// ===== クラス管理 =====
export interface ClassDto {
  nurseryId: number;
  classId: string;
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  currentEnrollment: number;
  assignedStaffNames: string[];
}

export interface CreateClassRequestDto {
  classId: string;
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
}

export interface UpdateClassRequestDto {
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
  isActive?: boolean;
}

export interface ClassFilterDto {
  ageGroupMin?: number;
  ageGroupMax?: number;
  isActive?: boolean;
  searchKeyword?: string;
}

// ===== クラス構成管理 =====
export interface ClassCompositionDto {
  classId: string;
  className: string;
  assignedStaff: AssignedStaffDto[];
  assignedChildren: AssignedChildDto[];
}

export interface AssignedStaffDto {
  staffId: number;
  name: string;
  assignmentRole: string;
}

export interface AssignedChildDto {
  childId: number;
  name: string;
  furigana?: string;
}

export interface UpdateClassCompositionRequestDto {
  staffIds: number[];
  childIds: number[];
}

// ===== 園児管理 =====
export interface ChildDto {
  nurseryId: number;
  childId: number;
  name: string;
  furigana?: string;
  dateOfBirth: string;
  gender: string;
  classId?: string;
  className?: string;
  medicalNotes?: string;
  specialInstructions?: string;
  isActive: boolean;
  graduationDate?: string;
  graduationStatus?: string;
  withdrawalReason?: string;
  bloodType?: string;
  lastAttendanceDate?: string;
  createdAt: string;
  updatedAt?: string;
  age: number;
  parents: ParentBasicInfoDto[];
}

export interface CreateChildRequestDto {
  name: string;
  furigana?: string;
  dateOfBirth: string;
  gender: string;
  classId?: string;
  bloodType?: string;
  medicalNotes?: string;
  specialInstructions?: string;
  parentRegistrationMode: 'select' | 'create';
  parentIds: number[];
  parent1?: CreateParentWithChildDto;
  parent2?: CreateParentWithChildDto;
}

export interface CreateParentWithChildDto {
  phoneNumber: string;
  name: string;
  nameKana?: string;
  dateOfBirth?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  homePhone?: string;
  email?: string;
}

export interface UpdateChildRequestDto {
  name: string;
  furigana?: string;
  dateOfBirth: string;
  gender: string;
  classId?: string;
  bloodType?: string;
  medicalNotes?: string;
  specialInstructions?: string;
  graduationDate?: string;
  graduationStatus?: string;
  withdrawalReason?: string;
  lastAttendanceDate?: string;
  isActive: boolean;
}

export interface ChildFilterDto {
  classId?: string;
  graduationStatus?: string;
  isActive?: boolean;
  searchKeyword?: string;
}

export interface ParentBasicInfoDto {
  id: number;
  name: string;
  phoneNumber?: string;
  email?: string;
}

// ===== 保護者管理 =====
export interface ParentDto {
  id: number;
  phoneNumber: string;
  name?: string;
  nameKana?: string;
  dateOfBirth?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  homePhone?: string;
  email?: string;
  nurseryId: number;
  pushNotificationsEnabled: boolean;
  absenceConfirmationEnabled: boolean;
  dailyReportEnabled: boolean;
  eventNotificationEnabled: boolean;
  announcementEnabled: boolean;
  fontSize: string;
  language: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  children: ChildBasicInfoDto[];
}

export interface CreateParentRequestDto {
  phoneNumber: string;
  name?: string;
  nameKana?: string;
  dateOfBirth?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  homePhone?: string;
  email?: string;
  childIds: ChildIdentifier[];
}

export interface UpdateParentRequestDto {
  phoneNumber?: string;
  name?: string;
  nameKana?: string;
  dateOfBirth?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  homePhone?: string;
  email?: string;
  pushNotificationsEnabled?: boolean;
  absenceConfirmationEnabled?: boolean;
  dailyReportEnabled?: boolean;
  eventNotificationEnabled?: boolean;
  announcementEnabled?: boolean;
  fontSize?: string;
  language?: string;
  isActive?: boolean;
}

export interface ParentFilterDto {
  nurseryId?: number;
  classId?: string;
  isActive?: boolean;
  searchKeyword?: string;
}

export interface ChildBasicInfoDto {
  nurseryId: number;
  childId: number;
  name: string;
  classId?: string;
  className?: string;
  age: number;
}

export interface ChildIdentifier {
  nurseryId: number;
  childId: number;
}

// ===== 職員管理 =====
export interface StaffDto {
  nurseryId: number;
  staffId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  position?: string;
  resignationDate?: string;
  remark?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  classAssignments: StaffClassAssignmentDto[];
}

export interface CreateStaffRequestDto {
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  position?: string;
  remark?: string;
}

export interface UpdateStaffRequestDto {
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  position?: string;
  resignationDate?: string;
  remark?: string;
  isActive?: boolean;
}

export interface StaffFilterDto {
  role?: string;
  position?: string;
  classId?: string;
  academicYear?: number;
  isActive?: boolean;
  searchKeyword?: string;
}

export interface StaffClassAssignmentDto {
  classId: string;
  className?: string;
  role?: string;
  academicYear: number;
  isPrimary: boolean;
  assignedAt?: string;
}

export interface StaffClassAssignmentRequestDto {
  classId: string;
  role: string;
  academicYear: number;
}
