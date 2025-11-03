/**
 * Announcement Management Type Definitions
 * お知らせ管理の型定義
 */

/**
 * お知らせカテゴリタイプ
 */
export type AnnouncementCategoryType = 'emergency' | 'cooperation' | 'general' | 'important';

/**
 * 対象範囲タイプ
 */
export type TargetAudienceType = 'all' | 'class' | 'individual';

/**
 * 配信状態タイプ
 */
export type DeliveryStatusType = 'draft' | 'scheduled' | 'published';

/**
 * カテゴリ情報
 */
export interface CategoryInfo {
  name: string;
  color: string;
  bgColor: string;
}


/**
 * 添付ファイルDTO
 */
export interface AttachmentDto {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

/**
 * 閲覧状況DTO
 */
export interface ReadStatusDto {
  totalRecipients: number;
  readCount: number;
  readRate: number;
}

/**
 * お知らせDTO
 */
export interface AnnouncementDto {
  announcementId: number;
  title: string;
  content: string;
  category: AnnouncementCategoryType;
  targetAudience: TargetAudienceType;
  targetClassId?: string;
  targetClassName?: string;
  targetChildId?: number;
  targetChildName?: string;
  createdByStaffId?: number;
  createdByStaffName?: string;
  createdByAdminUser: boolean;
  scheduledAt?: string; // ISO datetime string
  publishedAt?: string; // ISO datetime string
  expiresAt?: string; // ISO datetime string
  attachments?: AttachmentDto[];
  readStatus?: ReadStatusDto;
  status: DeliveryStatusType;
  createdAt: string;
  updatedAt?: string;
}

/**
 * お知らせ作成リクエストDTO
 */
export interface CreateAnnouncementRequestDto {
  title: string;
  content: string;
  category: AnnouncementCategoryType;
  targetAudience: TargetAudienceType;
  targetClassId?: string;
  targetChildId?: number;
  createdByStaffId?: number;
  scheduledAt?: string;
  expiresAt?: string;
  attachments?: AttachmentDto[];
}

/**
 * お知らせ更新リクエストDTO
 */
export interface UpdateAnnouncementRequestDto {
  title: string;
  content: string;
  category: AnnouncementCategoryType;
  targetAudience: TargetAudienceType;
  targetClassId?: string;
  targetChildId?: number;
  scheduledAt?: string;
  expiresAt?: string;
  attachments?: AttachmentDto[];
}

/**
 * お知らせフィルターDTO
 */
export interface AnnouncementFilterDto {
  category?: AnnouncementCategoryType;
  targetAudience?: TargetAudienceType;
  status?: DeliveryStatusType;
  startDate?: string;
  endDate?: string;
  searchKeyword?: string;
}

/**
 * 未読保護者情報DTO
 */
export interface UnreadParentDto {
  parentId: number;
  parentName: string;
  phoneNumber: string;
  childName: string;
  className: string;
}

/**
 * 既読保護者情報DTO
 */
export interface ReadParentDto {
  parentId: number;
  parentName: string;
  phoneNumber: string;
  childName: string;
  className: string;
  readAt: string; // ISO datetime string
}

/**
 * お知らせカテゴリ定義（デスクトップ用・固定日本語）
 */
export const announcementCategoriesDesktop: Record<AnnouncementCategoryType, CategoryInfo> = {
  emergency: {
    name: '緊急連絡',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
  important: {
    name: '重要なお知らせ',
    color: '#ea580c',
    bgColor: '#ffedd5',
  },
  cooperation: {
    name: 'ご協力のお願い',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  general: {
    name: '一般のお知らせ',
    color: '#059669',
    bgColor: '#d1fae5',
  },
};

/**
 * 対象範囲の表示名
 */
export const targetAudienceNames: Record<TargetAudienceType, string> = {
  all: '全体',
  class: 'クラス別',
  individual: '個別',
};

/**
 * 配信状態の表示名
 */
export const deliveryStatusNames: Record<DeliveryStatusType, string> = {
  draft: '下書き',
  scheduled: '予約配信',
  published: '配信済み',
};
