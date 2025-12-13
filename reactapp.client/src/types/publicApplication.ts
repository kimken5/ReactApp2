/**
 * 保護者向け入園申込フォーム - 型定義
 */

/**
 * 園児情報（単体）
 */
export interface ChildInfo {
  childName: string;
  childNameKana: string;
  childDateOfBirth: string; // YYYY-MM-DD形式
  childGender: 'M' | 'F';
  childBloodType?: string;
  childMedicalNotes?: string;
  childSpecialInstructions?: string;
}

/**
 * 申込フォーム送信リクエスト（複数園児対応）
 */
export interface CreateApplicationRequest {
  // 申請保護者情報 (13フィールド)
  applicantName: string;
  applicantNameKana: string;
  dateOfBirth: string; // YYYY-MM-DD形式
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  mobilePhone: string;
  homePhone?: string;
  email?: string;
  relationshipToChild: string;

  // 園児情報（配列、最大4人）
  children: ChildInfo[];
}

/**
 * 申込完了レスポンス（APIレスポンス構造）
 */
export interface CreateApplicationResponse {
  success: boolean;
  data?: {
    applicationIds: number[]; // 複数園児分のID配列
    childCount: number; // 登録された園児数
    message: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * ApplicationKey検証レスポンス（APIレスポンス構造）
 */
export interface ValidateKeyResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    nurseryId?: number;
    nurseryName?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 郵便番号検索レスポンス（郵便番号API用）
 */
export interface PostalCodeResponse {
  prefecture: string;
  city: string;
  addressLine?: string;
}

/**
 * 続柄の選択肢
 */
export const RELATIONSHIP_OPTIONS = [
  { value: 'Father', label: '父' },
  { value: 'Mother', label: '母' },
  { value: 'Grandfather', label: '祖父' },
  { value: 'Grandmother', label: '祖母' },
  { value: 'Other', label: 'その他' },
] as const;

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS = [
  { value: 'M', label: '男' },
  { value: 'F', label: '女' },
] as const;

/**
 * 血液型の選択肢
 */
export const BLOOD_TYPE_OPTIONS = [
  { value: '', label: '未選択' },
  { value: 'A', label: 'A型' },
  { value: 'B', label: 'B型' },
  { value: 'O', label: 'O型' },
  { value: 'AB', label: 'AB型' },
] as const;
