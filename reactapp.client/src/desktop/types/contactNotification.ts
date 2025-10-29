/**
 * Contact Notification Type Definitions (Desktop)
 * 連絡通知の型定義（デスクトップアプリ用）
 */

/**
 * 連絡通知情報DTO
 */
export interface ContactNotificationDto {
  id: number;
  parentId: number;
  parentName: string;
  nurseryId: number;
  childId: number;
  childName: string;
  className?: string;
  notificationType: 'absence' | 'lateness' | 'pickup';
  ymd: string; // ISO date string
  expectedArrivalTime?: string; // Time string (HH:mm:ss)
  reason: 'illness' | 'appointment' | 'family_event' | 'other';
  additionalNotes?: string;
  submittedAt: string; // ISO datetime string
  status: 'submitted' | 'acknowledged' | 'processed';
  staffResponse?: string;
  acknowledgedAt?: string; // ISO datetime string
  acknowledgedBy?: number;
  acknowledgedByAdminUser: boolean;
  respondedByStaffId?: number;
  respondedByStaffName?: string;
  acknowledgedByAdminAt?: string; // ISO datetime string
  latestResponse?: ContactNotificationResponseDto;
}

/**
 * 連絡通知返信情報DTO
 */
export interface ContactNotificationResponseDto {
  id: number;
  absenceNotificationId: number;
  nurseryId: number;
  staffId: number;
  staffName: string;
  responseType: 'acknowledged' | 'approved' | 'rejected' | 'requires_clarification';
  responseMessage?: string;
  responseAt: string; // ISO datetime string
  isActive: boolean;
}

/**
 * 連絡通知一覧フィルタDTO
 */
export interface ContactNotificationFilterDto {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  notificationType?: 'absence' | 'lateness' | 'pickup';
  status?: 'submitted' | 'acknowledged' | 'processed';
  childId?: number;
  classId?: string;
  searchKeyword?: string;
  acknowledgedByAdminUser?: boolean;
}

/**
 * 連絡通知返信作成リクエストDTO
 */
export interface CreateResponseRequestDto {
  responseType: 'acknowledged' | 'approved' | 'rejected' | 'requires_clarification';
  responseMessage?: string;
  staffId: number;
}

/**
 * 連絡通知確認更新リクエストDTO
 */
export interface AcknowledgeNotificationRequestDto {
  respondedByStaffId?: number;
  staffResponse?: string;
}
