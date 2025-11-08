/**
 * Daily Report Type Definitions
 * 日報管理の型定義
 */

/**
 * 日報情報DTO
 */
export interface DailyReportDto {
  id: number;
  nurseryId: number;
  childId: number;
  childName: string;
  className?: string;
  staffNurseryId: number;
  staffId: number;
  staffName: string;
  reportDate: string; // ISO date string
  reportKind: string;
  title: string;
  content: string;
  photos: string[];
  status: string; // "draft" | "published" | "archived"
  publishedAt?: string; // ISO datetime string
  parentAcknowledged: boolean;
  acknowledgedAt?: string; // ISO datetime string
  createdByAdminUser: boolean;
  createdAt: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
  responseCount: number;
}

/**
 * 日報作成リクエストDTO
 */
export interface CreateDailyReportRequestDto {
  childId: number;
  staffId: number;
  reportDate: string; // ISO date string
  reportKind: string;
  title: string;
  content: string;
  photos: string[];
  status: string; // "draft" or "published"
}

/**
 * 日報更新リクエストDTO
 */
export interface UpdateDailyReportRequestDto {
  reportDate: string;
  reportKind: string;
  title: string;
  content: string;
  photos: string[];
  status?: string;
}

/**
 * 日報一覧フィルタDTO
 */
export interface DailyReportFilterDto {
  childId?: number;
  classId?: string;
  staffId?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  reportKind?: string;
  status?: string;
  parentAcknowledged?: boolean;
  searchKeyword?: string;
}

/**
 * 日報公開リクエストDTO
 */
export interface PublishDailyReportRequestDto {
  reportId: number;
}
