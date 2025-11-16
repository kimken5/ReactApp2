/**
 * Attendance Type Definitions
 * 出欠表管理の型定義
 */

/**
 * 出欠情報DTO
 */
export interface AttendanceDto {
  nurseryId: number;
  childId: number;
  childName?: string;
  attendanceDate: string; // ISO date string
  status: 'blank' | 'present' | 'absent' | 'late'; // 未記録/出席/欠席/遅刻
  arrivalTime?: string; // ISO time string (HH:mm:ss)
  notes?: string;
  absenceNotificationId?: number;
  recordedByStaffId?: number;
  recordedByStaffName?: string;
  recordedAt?: string; // ISO datetime string
  updatedByStaffId?: number;
  updatedByStaffName?: string;
  updatedAt?: string; // ISO datetime string
  isActive: boolean;
}

/**
 * 出欠履歴集計情報DTO
 */
export interface AttendanceHistorySummaryDto {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  blankDays: number;
  attendanceRate: number; // パーセンテージ (0-100)
}

/**
 * 出欠履歴レスポンスDTO
 */
export interface AttendanceHistoryResponseDto {
  Attendances: AttendanceDto[]; // バックエンドのC#は大文字始まり
  Summary: AttendanceHistorySummaryDto; // バックエンドのC#は大文字始まり
}

/**
 * 出欠ステータス更新リクエストDTO
 */
export interface UpdateAttendanceRequest {
  status: 'blank' | 'present' | 'absent' | 'late';
  arrivalTime?: string; // ISO time string (HH:mm:ss)
  notes?: string;
  recordedByStaffId: number;
  recordedByStaffNurseryId: number;
}

/**
 * 備考更新リクエストDTO
 */
export interface UpdateAttendanceNotesRequest {
  notes: string;
  updatedByStaffId: number;
  updatedByStaffNurseryId: number;
}

/**
 * 一括出席登録リクエストDTO
 */
export interface BulkPresentRequest {
  nurseryId: number;
  classId: string;
  date: string; // ISO date string
  recordedByStaffId: number;
  recordedByStaffNurseryId: number;
}

/**
 * スキップされた園児情報
 */
export interface SkippedChildInfo {
  childId: number;
  childName: string;
  currentStatus: string;
  reason: string;
}

/**
 * 一括出席登録レスポンスDTO
 */
export interface BulkPresentResponse {
  successCount: number;
  skippedCount: number;
  skippedChildren: SkippedChildInfo[];
  message: string;
}

/**
 * 出欠ステータス表示名
 */
export const AttendanceStatusDisplay: Record<AttendanceDto['status'], string> = {
  blank: '未記録',
  present: '出席',
  absent: '欠席',
  late: '遅刻',
};

/**
 * 出欠ステータス色（Tailwind CSS）
 */
export const AttendanceStatusColor: Record<AttendanceDto['status'], string> = {
  blank: 'bg-gray-100 text-gray-600',
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
};
