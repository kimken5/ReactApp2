/**
 * 年度管理関連の型定義
 */

/**
 * 年度情報
 */
export interface AcademicYear {
  nurseryId: number;
  year: number;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  isCurrent: boolean;
  isFuture: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 年度作成リクエスト
 */
export interface CreateAcademicYearRequest {
  nurseryId: number;
  year: number;
  startDate?: string; // ISO 8601 date string, optional
  endDate?: string; // ISO 8601 date string, optional
  isFuture?: boolean;
  notes?: string;
}

/**
 * 年度スライド実行リクエスト
 */
export interface YearSlideRequest {
  nurseryId: number;
  targetYear: number;
  confirmed: boolean;
  executedByUserId: number;
  notes?: string;
}

/**
 * クラス別園児数サマリー
 */
export interface ClassChildrenSummary {
  classId: string;
  className: string;
  childrenCount: number;
}

/**
 * クラス別職員数サマリー
 */
export interface ClassStaffSummary {
  classId: string;
  className: string;
  staffCount: number;
}

/**
 * 年度スライドプレビュー
 */
export interface YearSlidePreview {
  currentYear: number;
  targetYear: number;
  affectedChildrenCount: number;
  affectedStaffCount: number;
  classSummaries: ClassChildrenSummary[];
  staffSummaries: ClassStaffSummary[];
  warnings: string[];
}

/**
 * 年度スライド実行結果
 */
export interface YearSlideResult {
  success: boolean;
  previousYear: number;
  newYear: number;
  slidedChildrenCount: number;
  slidedStaffCount: number;
  executedAt: string;
  executedByUserId: number;
  errorMessage?: string;
  messages: string[];
}
