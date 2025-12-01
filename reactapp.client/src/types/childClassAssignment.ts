/**
 * 園児クラス割り当て型定義
 */

export interface ChildClassAssignment {
  academicYear: number;
  nurseryId: number;
  childId: number;
  childName: string;
  classId: string;
  className: string;
  isCurrent: boolean;
  isFuture: boolean;
  assignedAt: string;
  notes?: string;
}

export interface ClassWithChildren {
  classId: string;
  className: string;
  grade: number;
  assignedCount: number;
  children: ChildAssignmentInfo[];
}

export interface ChildAssignmentInfo {
  childId: number;
  childName: string;
  age: number;
  currentClassId: string;
  currentClassName: string;
  isAssigned: boolean;
}

export interface AvailableChild {
  childId: number;
  childName: string;
  age: number;
  currentClassId: string;
  currentClassName: string;
  futureClassId?: string;
  futureClassName?: string;
  isAssignedToFuture: boolean;
}

export interface AssignChildToClassRequest {
  academicYear: number;
  nurseryId: number;
  childId: number;
  classId: string;
  notes?: string;
}

export interface BulkAssignChildrenRequest {
  academicYear: number;
  nurseryId: number;
  assignments: ChildClassPair[];
}

export interface ChildClassPair {
  childId: number;
  classId: string;
}
