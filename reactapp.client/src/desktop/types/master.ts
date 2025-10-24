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
  capacity?: number;
  operatingHours?: string;
  website?: string;
  description?: string;
}

export interface UpdateNurseryRequestDto {
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  principalName?: string;
  establishedDate?: string;
  capacity?: number;
  operatingHours?: string;
  website?: string;
  description?: string;
}

// ===== クラス管理 =====
export interface ClassDto {
  nurseryId: number;
  classId: string;
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
  academicYear: number;
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
  academicYear?: number;
}

export interface UpdateClassRequestDto {
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  maxCapacity: number;
  academicYear?: number;
  isActive?: boolean;
}

export interface ClassFilterDto {
  academicYear?: number;
  ageGroupMin?: number;
  ageGroupMax?: number;
  isActive?: boolean;
  searchKeyword?: string;
}

// ===== 園児管理 =====
export interface ChildDto {
  nurseryId: number;
  childId: number;
  name: string;
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
  dateOfBirth: string;
  gender: string;
  classId?: string;
  bloodType?: string;
  medicalNotes?: string;
  specialInstructions?: string;
  parentIds: number[];
}

export interface UpdateChildRequestDto {
  name: string;
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
  email?: string;
  address?: string;
  pushNotificationsEnabled: boolean;
  absenceConfirmationEnabled: boolean;
  dailyReportEnabled: boolean;
  eventNotificationEnabled: boolean;
  announcementEnabled: boolean;
  fontSize: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  children: ChildBasicInfoDto[];
}

export interface CreateParentRequestDto {
  phoneNumber: string;
  name?: string;
  email?: string;
  address?: string;
  childIds: ChildIdentifier[];
}

export interface UpdateParentRequestDto {
  name?: string;
  email?: string;
  address?: string;
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
}

export interface UpdateStaffRequestDto {
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  position?: string;
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
