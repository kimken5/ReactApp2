/**
 * デスクトップアプリ - 入園申込管理 型定義
 */

/**
 * 重複保護者情報
 */
export interface DuplicateParentInfo {
  hasDuplicate: boolean;
  existingParentId?: number;
  existingParentName?: string;
  childCount: number;
}

/**
 * 申込ステータス
 */
export type ApplicationStatus = 'Pending' | 'Imported' | 'Rejected';

/**
 * 申込ワーク DTO
 */
export interface ApplicationWorkDto {
  id: number;
  nurseryId: number;

  // 申請保護者情報 (13フィールド)
  applicantName: string;
  applicantNameKana: string;
  dateOfBirth: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  mobilePhone: string;
  homePhone?: string;
  email?: string;
  relationshipToChild: string;

  // 園児情報 (9フィールド)
  childFamilyName: string;
  childFirstName: string;
  childFamilyNameKana: string;
  childFirstNameKana: string;
  childAllergy?: string;
  childDateOfBirth: string;
  childGender: string;
  childBloodType?: string;
  childMedicalNotes?: string;
  childSpecialInstructions?: string;
  childNoPhoto: boolean;

  // 申込管理情報 (7フィールド)
  applicationStatus: ApplicationStatus;
  isImported: boolean;
  importedAt?: string;
  importedByUserId?: number;
  rejectedAt?: string;
  rejectedByUserId?: number;
  rejectionReason?: string;

  // 申込日時
  createdAt: string;

  // 重複保護者情報
  duplicateParentInfo?: DuplicateParentInfo;
}

/**
 * 申込一覧アイテム DTO
 */
export interface ApplicationListItemDto {
  id: number;
  applicantName: string;
  childFamilyName: string;
  childFirstName: string;
  childDateOfBirth: string;
  relationshipToChild: string;
  mobilePhone: string;
  applicationStatus: ApplicationStatus;
  createdAt: string;
  hasDuplicateParent: boolean;
}

/**
 * インポート申込リクエスト
 */
export interface ImportApplicationRequest {
  overwriteParent: boolean;
}

/**
 * インポート申込結果
 */
export interface ImportApplicationResult {
  parentId: number;
  parentName: string;
  childId: number;
  childName: string;
  wasParentCreated: boolean;
  wasParentUpdated: boolean;
}

/**
 * 却下申込リクエスト
 */
export interface RejectApplicationRequest {
  rejectionReason: string;
}

/**
 * ページネーション結果 (既存型を再利用)
 */
export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * 申込一覧取得パラメータ
 */
export interface GetApplicationListParams {
  page: number;
  pageSize: number;
  status?: ApplicationStatus | 'All';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * ステータス表示ラベル
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  Pending: '保留中',
  Imported: '取込済',
  Rejected: '却下済',
};

/**
 * ステータス表示色
 */
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Imported: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

/**
 * ステータス絵文字
 */
export const APPLICATION_STATUS_ICONS: Record<ApplicationStatus, string> = {
  Pending: '',
  Imported: '',
  Rejected: '',
};
