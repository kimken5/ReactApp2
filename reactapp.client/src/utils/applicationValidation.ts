import { z } from 'zod';

/**
 * 全角カタカナのみを許可する正規表現
 */
const KATAKANA_REGEX = /^[ァ-ヶー\s]+$/;

/**
 * 電話番号の正規表現 (ハイフンあり/なし両対応)
 */
const PHONE_REGEX = /^0\d{9,10}$|^0\d{1,4}-\d{1,4}-\d{4}$/;

/**
 * 郵便番号の正規表現 (ハイフンあり/なし両対応)
 */
const POSTAL_CODE_REGEX = /^\d{7}$|^\d{3}-\d{4}$/;

/**
 * ApplicationKey検証スキーマ
 */
export const applicationKeySchema = z.object({
  applicationKey: z.string()
    .min(1, 'ApplicationKeyを入力してください')
    .max(255, 'ApplicationKeyが長すぎます'),
});

/**
 * 申込フォームバリデーションスキーマ
 */
export const applicationFormSchema = z.object({
  // 申請保護者情報
  applicantName: z.string()
    .min(1, 'お名前を入力してください')
    .max(100, 'お名前は100文字以内で入力してください'),

  applicantNameKana: z.string()
    .min(1, 'フリガナを入力してください')
    .max(100, 'フリガナは100文字以内で入力してください')
    .regex(KATAKANA_REGEX, 'フリガナは全角カタカナで入力してください'),

  dateOfBirth: z.string()
    .min(1, '生年月日を入力してください')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    }, '生年月日を正しく入力してください（18歳以上100歳以下）'),

  postalCode: z.string()
    .regex(POSTAL_CODE_REGEX, '郵便番号は7桁の数字、またはXXX-XXXX形式で入力してください')
    .optional()
    .or(z.literal('')),

  prefecture: z.string()
    .max(10, '都道府県は10文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  city: z.string()
    .max(50, '市区町村は50文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  addressLine: z.string()
    .max(200, '住所は200文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  mobilePhone: z.string()
    .min(1, '携帯電話番号を入力してください')
    .regex(PHONE_REGEX, '携帯電話番号は正しい形式で入力してください（例: 090-1234-5678）')
    .max(20, '携帯電話番号は20文字以内で入力してください'),

  homePhone: z.string()
    .regex(PHONE_REGEX, '固定電話番号は正しい形式で入力してください（例: 03-1234-5678）')
    .max(20, '固定電話番号は20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  emergencyContact: z.string()
    .regex(PHONE_REGEX, '緊急連絡先は正しい形式で入力してください（例: 090-1234-5678）')
    .max(20, '緊急連絡先は20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('メールアドレスを正しい形式で入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  relationshipToChild: z.string()
    .min(1, '続柄を選択してください')
    .max(20, '続柄は20文字以内で入力してください'),

  // 園児情報
  childName: z.string()
    .min(1, 'お子さまのお名前を入力してください')
    .max(100, 'お子さまのお名前は100文字以内で入力してください'),

  childNameKana: z.string()
    .min(1, 'お子さまのフリガナを入力してください')
    .max(100, 'お子さまのフリガナは100文字以内で入力してください')
    .regex(KATAKANA_REGEX, 'フリガナは全角カタカナで入力してください'),

  childDateOfBirth: z.string()
    .min(1, 'お子さまの生年月日を入力してください')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 10;
    }, 'お子さまの生年月日を正しく入力してください（0歳以上10歳以下）'),

  childGender: z.string()
    .min(1, 'お子さまの性別を選択してください')
    .max(2, '性別は2文字以内で入力してください'),

  childBloodType: z.string()
    .max(10, '血液型は10文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  childMedicalNotes: z.string()
    .max(1000, '健康に関する特記事項は1000文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  childSpecialInstructions: z.string()
    .max(1000, 'その他の特記事項は1000文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

/**
 * バリデーションスキーマの型を推論
 */
export type ApplicationKeyInput = z.infer<typeof applicationKeySchema>;
export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

/**
 * エラーメッセージを整形する
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
}
