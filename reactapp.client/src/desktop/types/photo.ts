/**
 * Photo Management Type Definitions
 * 写真管理の型定義
 */

/**
 * 写真情報DTO
 */
export interface PhotoDto {
  id: number;
  fileName: string;
  filePath: string;
  thumbnailPath: string;
  originalFileName?: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  description?: string;
  uploadedByStaffId: number;
  uploadedByStaffName: string;
  uploadedAt: string; // ISO datetime string
  publishedAt: string; // ISO datetime string
  visibilityLevel: string; // "class" | "grade" | "all"
  targetClassId?: string;
  targetClassName?: string;
  targetGrade?: number; // 0-5: 0歳児～5歳児
  status: string; // "draft" | "published" | "archived"
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  uploadedByAdminUser: boolean;
  updatedAt?: string; // ISO datetime string
  children: PhotoChildInfoDto[];
}

/**
 * 写真に写っている園児情報DTO
 */
export interface PhotoChildInfoDto {
  childId: number;
  childName: string;
  className?: string;
  isPrimarySubject: boolean;
}

/**
 * 写真アップロードリクエストDTO
 */
export interface UploadPhotoRequestDto {
  file: File;
  description?: string;
  publishedAt: string; // ISO datetime string
  visibilityLevel: string; // "class" | "grade" | "all"
  targetClassId?: string;
  targetGrade?: number; // 0-5: 0歳児～5歳児
  status: string; // "draft" | "published"
  staffId: number;
  childIds: number[];
  primaryChildId?: number;
}

/**
 * 写真更新リクエストDTO
 */
export interface UpdatePhotoRequestDto {
  description?: string;
  publishedAt: string;
  visibilityLevel: string;
  targetClassId?: string;
  targetGrade?: number; // 0-5: 0歳児～5歳児
  status: string;
  childIds?: number[];
  primaryChildId?: number;
}

/**
 * 写真一覧フィルタDTO
 */
export interface PhotoFilterDto {
  childId?: number;
  classId?: string;
  staffId?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  visibilityLevel?: string;
  status?: string;
  searchKeyword?: string;
}

/**
 * 園児の撮影禁止チェックリクエストDTO
 */
export interface ValidateChildrenForPhotoRequestDto {
  childIds: number[];
}

/**
 * 園児の撮影禁止チェックレスポンスDTO
 */
export interface ValidateChildrenForPhotoResponseDto {
  hasNoPhotoChildren: boolean;
  noPhotoChildren: NoPhotoChildInfoDto[];
  warningMessage?: string;
}

/**
 * 撮影禁止園児情報DTO
 */
export interface NoPhotoChildInfoDto {
  childId: number;
  childName: string;
  className?: string;
}
