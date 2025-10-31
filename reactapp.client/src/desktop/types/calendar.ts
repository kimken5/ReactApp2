/**
 * Calendar Management Type Definitions
 * カレンダー管理の型定義
 */

/**
 * イベントカテゴリタイプ
 */
export type EventCategoryType =
  | 'general_announcement'
  | 'general_event'
  | 'grade_activity'
  | 'class_activity'
  | 'nursery_holiday';

/**
 * カテゴリ情報
 */
export interface CategoryInfo {
  name: string;
  color: string;
  bgColor: string;
}

/**
 * カレンダーイベントDTO
 */
export interface CalendarEventDto {
  id: number;
  title: string;
  category: EventCategoryType;
  startDateTime: string; // ISO datetime string
  endDateTime: string; // ISO datetime string
  description?: string;
  location?: string;
  isAllDay: boolean;
  targetClassId?: string;
  targetGrade?: number;
  createdBy?: number;
  createdByName?: string;
}

/**
 * イベント作成リクエストDTO
 */
export interface CreateEventRequestDto {
  title: string;
  category: EventCategoryType;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  targetClassId?: string;
  targetGrade?: number;
}

/**
 * イベント更新リクエストDTO
 */
export interface UpdateEventRequestDto {
  title: string;
  category: EventCategoryType;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  targetClassId?: string;
  targetGrade?: number;
}

/**
 * イベントカテゴリ定義（デスクトップ用・固定日本語）
 */
export const eventCategoriesDesktop: Record<EventCategoryType, CategoryInfo> = {
  general_announcement: {
    name: '全体お知らせ',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  general_event: {
    name: '全体行事',
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  grade_activity: {
    name: '学年活動',
    color: '#10b981',
    bgColor: '#d1fae5',
  },
  class_activity: {
    name: 'クラス活動',
    color: '#6366f1',
    bgColor: '#e0e7ff',
  },
  nursery_holiday: {
    name: '園休日',
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
};
