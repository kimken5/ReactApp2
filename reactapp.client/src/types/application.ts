// 入園申込関連の型定義

/**
 * 申込フォームデータ
 */
export interface ApplicationFormData {
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

  // 園児情報 (7フィールド)
  childName: string;
  childNameKana: string;
  childDateOfBirth: string;
  childGender: string;
  childBloodType?: string;
  childMedicalNotes?: string;
  childSpecialInstructions?: string;
}

/**
 * ApplicationKey検証結果
 */
export interface ValidateApplicationKeyResult {
  isValid: boolean;
  nurseryId?: number;
  nurseryName?: string;
}

/**
 * 申込送信結果
 */
export interface SubmitApplicationResult {
  applicationId: number;
}

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * API成功レスポンス
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * APIレスポンス型
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 続柄の選択肢
 */
export const RELATIONSHIP_OPTIONS = [
  { value: '父', label: '父' },
  { value: '母', label: '母' },
  { value: '祖父', label: '祖父' },
  { value: '祖母', label: '祖母' },
  { value: 'その他', label: 'その他' },
] as const;

/**
 * 性別の選択肢
 */
export const GENDER_OPTIONS = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
] as const;

/**
 * 血液型の選択肢
 */
export const BLOOD_TYPE_OPTIONS = [
  { value: 'A', label: 'A型' },
  { value: 'B', label: 'B型' },
  { value: 'O', label: 'O型' },
  { value: 'AB', label: 'AB型' },
  { value: '不明', label: '不明' },
] as const;

/**
 * 都道府県の選択肢
 */
export const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;
