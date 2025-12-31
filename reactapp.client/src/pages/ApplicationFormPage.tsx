/**
 * 保護者向け入園申込フォームページ（入力→確認→完了の3ステップ）
 * URL: /application?key={ApplicationKey}
 * 最大4人の園児を同時登録可能
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  validateApplicationKey,
  submitApplication,
  fetchAddressByPostalCode,
} from '../services/publicApplicationService';
import type { CreateApplicationRequest, ChildInfo } from '../types/publicApplication';
import {
  RELATIONSHIP_OPTIONS,
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
} from '../types/publicApplication';

// 園児情報のバリデーションスキーマ
const childSchema = z.object({
  childFamilyName: z.string().min(1, '園児姓は必須です').max(50, '50文字以内で入力してください'),
  childFirstName: z.string().min(1, '園児名は必須です').max(50, '50文字以内で入力してください'),
  childFamilyNameKana: z
    .string()
    .min(1, '園児姓（ふりがな）は必須です')
    .max(50, '50文字以内で入力してください')
    .regex(/^[ぁ-ん]+$/, 'ひらがなで入力してください'),
  childFirstNameKana: z
    .string()
    .min(1, '園児名（ふりがな）は必須です')
    .max(50, '50文字以内で入力してください')
    .regex(/^[ぁ-ん]+$/, 'ひらがなで入力してください'),
  childAllergy: z.string().max(200, '200文字以内で入力してください').optional(),
  childDateOfBirth: z
    .string()
    .min(1, '園児生年月日は必須です')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の年・月・日をすべて選択してください'),
  childGender: z.enum(['M', 'F']),
  childBloodType: z.string().optional(),
  childMedicalNotes: z.string().max(500, '500文字以内で入力してください').optional(),
  childSpecialInstructions: z.string().max(500, '500文字以内で入力してください').optional(),
  childNoPhoto: z.boolean().default(false), // 撮影禁止フラグ（デフォルト: false）
});

// Zodバリデーションスキーマ
const applicationSchema = z.object({
  // 申請保護者情報
  applicantName: z.string().min(1, '申請者氏名は必須です').max(100, '100文字以内で入力してください'),
  applicantNameKana: z
    .string()
    .min(1, '申請者氏名（ふりがな）は必須です')
    .max(100, '100文字以内で入力してください')
    .regex(/^[ぁ-ん\s]+$/, 'ひらがなで入力してください'),
  dateOfBirth: z
    .string()
    .min(1, '生年月日は必須です')
    .regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の年・月・日をすべて選択してください'),
  postalCode: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  addressLine: z.string().max(200, '200文字以内で入力してください').optional(),
  mobilePhone: z
    .string()
    .min(1, '携帯電話番号は必須です')
    .regex(/^[0-9-]+$/, '数字とハイフンで入力してください'),
  homePhone: z.string().regex(/^[0-9-]*$/, '数字とハイフンで入力してください').optional(),
  email: z.string().email('メールアドレスの形式が正しくありません').optional().or(z.literal('')),
  relationshipToChild: z.string().min(1, '続柄は必須です'),

  // 園児情報（配列、最小1人、最大4人）
  children: z.array(childSchema).min(1, '最低1人の園児情報が必要です').max(4, '園児は最大4人まで登録できます'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function ApplicationFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationKey = searchParams.get('key');

  const [currentStep, setCurrentStep] = useState<'form' | 'confirm'>('form');
  const [isValidating, setIsValidating] = useState(true);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
  const [nurseryName, setNurseryName] = useState<string>('');
  const [photoFunctionEnabled, setPhotoFunctionEnabled] = useState<boolean>(true); // 写真機能の利用可否（デフォルトtrue）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema) as any,
    defaultValues: {
      children: [
        {
          childFamilyName: '',
          childFirstName: '',
          childFamilyNameKana: '',
          childFirstNameKana: '',
          childAllergy: '',
          childDateOfBirth: '',
          childGender: 'M',
          childBloodType: '',
          childMedicalNotes: '',
          childSpecialInstructions: '',
          childNoPhoto: false, // デフォルトfalse（撮影・共有を許可）
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const postalCode = watch('postalCode');

  // ApplicationKeyの検証
  useEffect(() => {
    const validate = async () => {
      if (!applicationKey) {
        setKeyValidationError('申込キーが指定されていません。');
        setIsValidating(false);
        return;
      }

      try {
        const result = await validateApplicationKey(applicationKey);
        if (result.success && result.data?.isValid && result.data?.nurseryName) {
          setNurseryName(result.data.nurseryName);
          setPhotoFunctionEnabled(result.data.photoFunction ?? true); // 写真機能の利用可否を設定（デフォルトtrue）
          setKeyValidationError(null);
        } else {
          setKeyValidationError(result.error?.message || '無効な申込キーです。');
        }
      } catch (error) {
        setKeyValidationError('申込キーの検証中にエラーが発生しました。');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [applicationKey]);

  // 郵便番号から住所を自動入力
  useEffect(() => {
    const fetchAddress = async () => {
      if (postalCode && postalCode.replace(/-/g, '').length === 7) {
        const result = await fetchAddressByPostalCode(postalCode);
        if (result) {
          setValue('prefecture', result.prefecture);
          setValue('city', result.city);
        }
      }
    };

    fetchAddress();
  }, [postalCode, setValue]);

  // 園児追加ハンドラー
  const handleAddChild = () => {
    if (fields.length < 4) {
      append({
        childFamilyName: '',
        childFirstName: '',
        childFamilyNameKana: '',
        childFirstNameKana: '',
        childAllergy: '',
        childDateOfBirth: '',
        childGender: 'M',
        childBloodType: '',
        childMedicalNotes: '',
        childSpecialInstructions: '',
        childNoPhoto: false, // デフォルトfalse（撮影・共有を許可）
      });
    }
  };

  // 園児削除ハンドラー
  const handleRemoveChild = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // 確認画面へ遷移
  const onConfirm = (data: any) => {
    setFormData(data as ApplicationFormData);
    setCurrentStep('confirm');
    window.scrollTo(0, 0);
  };

  // 入力画面に戻る
  const onBack = () => {
    setCurrentStep('form');
    window.scrollTo(0, 0);
  };

  // フォーム送信
  const onSubmit = async () => {
    if (!applicationKey || !formData) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitData: CreateApplicationRequest = {
        applicantName: formData.applicantName,
        applicantNameKana: formData.applicantNameKana,
        dateOfBirth: formData.dateOfBirth,
        postalCode: formData.postalCode || undefined,
        prefecture: formData.prefecture || undefined,
        city: formData.city || undefined,
        addressLine: formData.addressLine || undefined,
        mobilePhone: formData.mobilePhone,
        homePhone: formData.homePhone || undefined,
        email: formData.email || undefined,
        relationshipToChild: formData.relationshipToChild,
        children: formData.children.map((child) => ({
          childFamilyName: child.childFamilyName,
          childFirstName: child.childFirstName,
          childFamilyNameKana: child.childFamilyNameKana,
          childFirstNameKana: child.childFirstNameKana,
          childAllergy: child.childAllergy || undefined,
          childDateOfBirth: child.childDateOfBirth,
          childGender: child.childGender,
          childBloodType: child.childBloodType || undefined,
          childMedicalNotes: child.childMedicalNotes || undefined,
          childSpecialInstructions: child.childSpecialInstructions || undefined,
          // 写真機能が無効の場合は常にfalse（撮影OK）、有効な場合はユーザーの選択値
          childNoPhoto: photoFunctionEnabled ? child.childNoPhoto : false,
        })),
      };

      const response = await submitApplication(applicationKey, submitData);

      if (response.success && response.data) {
        navigate(`/application/complete`);
      } else {
        setSubmitError(response.error?.message || '申込の送信に失敗しました。');
      }
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.error?.message || '申込の送信中にエラーが発生しました。もう一度お試しください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング中
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">申込キーを確認中...</p>
        </div>
      </div>
    );
  }

  // キー検証エラー
  if (keyValidationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-md border border-gray-100 p-8">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">アクセスエラー</h1>
            <p className="text-gray-600 mb-6">{keyValidationError}</p>
            <p className="text-sm text-gray-500">
              正しいURLでアクセスしているか、保育園から提供されたQRコードをご確認ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 確認画面
  if (currentStep === 'confirm' && formData) {
    const relationshipLabel = RELATIONSHIP_OPTIONS.find(opt => opt.value === formData.relationshipToChild)?.label;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-md border border-gray-100 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">申込内容の確認</h1>
            <p className="text-base text-gray-700 font-medium">{nurseryName}</p>
            <p className="text-sm text-gray-600 mt-2">
              入力内容をご確認ください。修正する場合は「戻る」ボタンを押してください。
            </p>
          </div>

          {/* エラーメッセージ */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* 申請保護者情報 */}
          <div className="bg-white rounded-md border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">申請者（保護者）情報</h2>
            <dl className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">氏名</dt>
                <dd className="col-span-2 text-base text-gray-900">{formData.applicantName}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">ふりがな</dt>
                <dd className="col-span-2 text-base text-gray-900">{formData.applicantNameKana}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                <dd className="col-span-2 text-base text-gray-900">{formData.dateOfBirth}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">続柄</dt>
                <dd className="col-span-2 text-base text-gray-900">{relationshipLabel}</dd>
              </div>
              {formData.postalCode && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">郵便番号</dt>
                  <dd className="col-span-2 text-base text-gray-900">{formData.postalCode}</dd>
                </div>
              )}
              {formData.prefecture && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">住所</dt>
                  <dd className="col-span-2 text-base text-gray-900">
                    {formData.prefecture} {formData.city} {formData.addressLine}
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">携帯電話</dt>
                <dd className="col-span-2 text-base text-gray-900">{formData.mobilePhone}</dd>
              </div>
              {formData.homePhone && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">固定電話</dt>
                  <dd className="col-span-2 text-base text-gray-900">{formData.homePhone}</dd>
                </div>
              )}
              {formData.email && (
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="col-span-2 text-base text-gray-900">{formData.email}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 園児情報（複数対応） */}
          {formData.children.map((child, index) => {
            const genderLabel = GENDER_OPTIONS.find(opt => opt.value === child.childGender)?.label;
            const bloodTypeLabel = BLOOD_TYPE_OPTIONS.find(opt => opt.value === child.childBloodType)?.label;

            return (
              <div key={index} className="bg-white rounded-md border border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  園児情報 {formData.children.length > 1 ? `（${index + 1}人目）` : ''}
                </h2>
                <dl className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">氏名</dt>
                    <dd className="col-span-2 text-base text-gray-900">{child.childFamilyName} {child.childFirstName}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">ふりがな</dt>
                    <dd className="col-span-2 text-base text-gray-900">{child.childFamilyNameKana} {child.childFirstNameKana}</dd>
                  </div>
                  {child.childAllergy && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">アレルギー情報</dt>
                      <dd className="col-span-2 text-base text-gray-900">{child.childAllergy}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                    <dd className="col-span-2 text-base text-gray-900">{child.childDateOfBirth}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">性別</dt>
                    <dd className="col-span-2 text-base text-gray-900">{genderLabel}</dd>
                  </div>
                  {child.childBloodType && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">血液型</dt>
                      <dd className="col-span-2 text-base text-gray-900">{bloodTypeLabel}</dd>
                    </div>
                  )}
                  {child.childMedicalNotes && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">医療メモ</dt>
                      <dd className="col-span-2 text-base text-gray-900 whitespace-pre-wrap">{child.childMedicalNotes}</dd>
                    </div>
                  )}
                  {child.childSpecialInstructions && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">特別指示</dt>
                      <dd className="col-span-2 text-base text-gray-900 whitespace-pre-wrap">{child.childSpecialInstructions}</dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })}

          {/* ボタン */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-md transition-all duration-200 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  送信中...
                </span>
              ) : (
                '送信する'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 入力フォーム
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-md border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">入園申込フォーム</h1>
          <p className="text-base text-gray-700 font-medium">{nurseryName}</p>
          <p className="text-sm text-gray-600 mt-2">
            必須項目（<span className="text-red-600">*</span>）を入力してください。
          </p>
          <p className="text-sm text-gray-600 mt-1">
            同じ保護者で複数の園児を申し込む場合は、園児情報追加ボタンで最大4人まで登録できます。
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-6">
          {/* 申請保護者情報 */}
          <div className="bg-white rounded-md border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              申請者（保護者）情報
            </h2>

            <div className="space-y-4">
              {/* 氏名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('applicantName')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="山田 太郎"
                />
                <p className="mt-1 text-xs text-gray-500">※苗字と名前の間にスペースを入れてください</p>
                {errors.applicantName && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicantName.message}</p>
                )}
              </div>

              {/* 氏名（ふりがな） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名（ふりがな） <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('applicantNameKana')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="やまだ たろう"
                />
                <p className="mt-1 text-xs text-gray-500">※苗字と名前の間にスペースを入れてください</p>
                {errors.applicantNameKana && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicantNameKana.message}</p>
                )}
              </div>

              {/* 生年月日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日 <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-2">
                  {/* 年 */}
                  <select
                    {...register('dateOfBirth')}
                    onChange={(e) => {
                      const year = e.target.value;
                      const currentValue = watch('dateOfBirth') || '';
                      const [, month = '01', day = '01'] = currentValue.split('-');
                      setValue('dateOfBirth', year ? `${year}-${month}-${day}` : '');
                    }}
                    value={watch('dateOfBirth')?.split('-')[0] || ''}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">年</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>

                  {/* 月 */}
                  <select
                    onChange={(e) => {
                      const month = e.target.value;
                      const currentValue = watch('dateOfBirth') || '';
                      const [year = '', , day = '01'] = currentValue.split('-');
                      setValue('dateOfBirth', month && year ? `${year}-${month}-${day}` : '');
                    }}
                    value={watch('dateOfBirth')?.split('-')[1] || ''}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">月</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={String(month).padStart(2, '0')}>
                        {month}月
                      </option>
                    ))}
                  </select>

                  {/* 日 */}
                  <select
                    onChange={(e) => {
                      const day = e.target.value;
                      const currentValue = watch('dateOfBirth') || '';
                      const [year = '', month = '01'] = currentValue.split('-');
                      setValue('dateOfBirth', day && year ? `${year}-${month}-${day}` : '');
                    }}
                    value={watch('dateOfBirth')?.split('-')[2] || ''}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    <option value="">日</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={String(day).padStart(2, '0')}>
                        {day}日
                      </option>
                    ))}
                  </select>
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* 続柄 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  続柄 <span className="text-red-600">*</span>
                </label>
                <select
                  {...register('relationshipToChild')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                >
                  <option value="">選択してください</option>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.relationshipToChild && (
                  <p className="mt-1 text-sm text-red-600">{errors.relationshipToChild.message}</p>
                )}
              </div>

              {/* 郵便番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
                <input
                  type="text"
                  {...register('postalCode')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="123-4567"
                />
                <p className="mt-1 text-xs text-gray-500">
                  郵便番号を入力すると、自動的に住所が入力されます。
                </p>
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                )}
              </div>

              {/* 都道府県 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
                <input
                  type="text"
                  {...register('prefecture')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="東京都"
                />
                {errors.prefecture && (
                  <p className="mt-1 text-sm text-red-600">{errors.prefecture.message}</p>
                )}
              </div>

              {/* 市区町村 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="渋谷区"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              {/* 番地・ビル名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">番地・ビル名</label>
                <input
                  type="text"
                  {...register('addressLine')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="渋谷1-2-3 渋谷ビル101"
                />
                {errors.addressLine && (
                  <p className="mt-1 text-sm text-red-600">{errors.addressLine.message}</p>
                )}
              </div>

              {/* 携帯電話 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  携帯電話番号 <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  {...register('mobilePhone')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="090-1234-5678"
                />
                {errors.mobilePhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobilePhone.message}</p>
                )}
              </div>

              {/* 固定電話 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">固定電話番号</label>
                <input
                  type="tel"
                  {...register('homePhone')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="03-1234-5678"
                />
                {errors.homePhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.homePhone.message}</p>
                )}
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  placeholder="example@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 園児情報（動的フィールド配列） */}
          {fields.map((field, index) => (
            <div key={field.id} className="bg-white rounded-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  園児情報 {fields.length > 1 ? `（${index + 1}人目）` : ''}
                </h2>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChild(index)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200"
                  >
                    削除
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* 園児姓 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`children.${index}.childFamilyName`)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="山田"
                  />
                  {errors.children?.[index]?.childFamilyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childFamilyName?.message}</p>
                  )}
                </div>

                {/* 園児名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`children.${index}.childFirstName`)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="花子"
                  />
                  {errors.children?.[index]?.childFirstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childFirstName?.message}</p>
                  )}
                </div>

                {/* 園児姓（ふりがな） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓（ふりがな） <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`children.${index}.childFamilyNameKana`)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="やまだ"
                  />
                  {errors.children?.[index]?.childFamilyNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childFamilyNameKana?.message}</p>
                  )}
                </div>

                {/* 園児名（ふりがな） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名（ふりがな） <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`children.${index}.childFirstNameKana`)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="はなこ"
                  />
                  {errors.children?.[index]?.childFirstNameKana && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childFirstNameKana?.message}</p>
                  )}
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-4 h-[42px] items-center">
                    {GENDER_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          value={option.value}
                          {...register(`children.${index}.childGender`)}
                          className="mr-2 cursor-pointer"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.children?.[index]?.childGender && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childGender?.message}</p>
                  )}
                </div>

                {/* 園児生年月日 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* 年 */}
                    <select
                      {...register(`children.${index}.childDateOfBirth`)}
                      onChange={(e) => {
                        const year = e.target.value;
                        const currentValue = watch(`children.${index}.childDateOfBirth`) || '';
                        const [, month = '01', day = '01'] = currentValue.split('-');
                        setValue(`children.${index}.childDateOfBirth`, year ? `${year}-${month}-${day}` : '');
                      }}
                      value={watch(`children.${index}.childDateOfBirth`)?.split('-')[0] || ''}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    >
                      <option value="">年</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>

                    {/* 月 */}
                    <select
                      onChange={(e) => {
                        const month = e.target.value;
                        const currentValue = watch(`children.${index}.childDateOfBirth`) || '';
                        const [year = '', , day = '01'] = currentValue.split('-');
                        setValue(`children.${index}.childDateOfBirth`, month && year ? `${year}-${month}-${day}` : '');
                      }}
                      value={watch(`children.${index}.childDateOfBirth`)?.split('-')[1] || ''}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    >
                      <option value="">月</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <option key={month} value={String(month).padStart(2, '0')}>
                          {month}月
                        </option>
                      ))}
                    </select>

                    {/* 日 */}
                    <select
                      onChange={(e) => {
                        const day = e.target.value;
                        const currentValue = watch(`children.${index}.childDateOfBirth`) || '';
                        const [year = '', month = '01'] = currentValue.split('-');
                        setValue(`children.${index}.childDateOfBirth`, day && year ? `${year}-${month}-${day}` : '');
                      }}
                      value={watch(`children.${index}.childDateOfBirth`)?.split('-')[2] || ''}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    >
                      <option value="">日</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={String(day).padStart(2, '0')}>
                          {day}日
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.children?.[index]?.childDateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childDateOfBirth?.message}</p>
                  )}
                </div>

                {/* 血液型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">血液型</label>
                  <select
                    {...register(`children.${index}.childBloodType`)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                  >
                    {BLOOD_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.children?.[index]?.childBloodType && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childBloodType?.message}</p>
                  )}
                </div>

                {/* 食物アレルギー */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    食物アレルギー
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                    {[
                      '卵', '牛乳・乳製品', '小麦', 'そば', '落花生',
                      'えび', 'かに', '大豆', 'ごま', 'ナッツ類',
                      '魚卵', '魚類', 'りんご', 'キウイフルーツ', 'バナナ',
                      'もも', '柑橘類', 'いちご', 'ぶどう', '梨',
                      'さくらんぼ', 'パイナップル', 'マンゴー', 'メロン', 'ゼラチン',
                      '牛肉', '鶏肉', '豚肉'
                    ].map((allergen) => {
                      const currentAllergies = watch(`children.${index}.childAllergy`) || '';
                      const allergyList = currentAllergies.split('、').filter(a => a);
                      const isChecked = allergyList.includes(allergen);

                      return (
                        <label key={allergen} className="flex items-center cursor-pointer hover:bg-white px-2 py-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let newAllergies: string[];
                              if (e.target.checked) {
                                newAllergies = [...allergyList, allergen];
                              } else {
                                newAllergies = allergyList.filter(a => a !== allergen);
                              }
                              setValue(`children.${index}.childAllergy`, newAllergies.join('、'));
                            }}
                            className="mr-2 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">{allergen}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">該当する食物アレルギーをすべて選択してください</p>
                  {errors.children?.[index]?.childAllergy && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childAllergy?.message}</p>
                  )}
                </div>

                {/* 医療メモ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    医療メモ（アレルギー、持病など）
                  </label>
                  <textarea
                    {...register(`children.${index}.childMedicalNotes`)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="上記以外のアレルギーや持病がある場合は記入してください"
                  />
                  {errors.children?.[index]?.childMedicalNotes && (
                    <p className="mt-1 text-sm text-red-600">{errors.children[index]?.childMedicalNotes?.message}</p>
                  )}
                </div>

                {/* 特別指示 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    特別指示・その他
                  </label>
                  <textarea
                    {...register(`children.${index}.childSpecialInstructions`)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                    placeholder="その他、保育園にお伝えしたいことがあれば記入してください"
                  />
                  {errors.children?.[index]?.childSpecialInstructions && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.children[index]?.childSpecialInstructions?.message}
                    </p>
                  )}
                </div>

                {/* 写真共有に関する説明と撮影禁止チェックボックス（写真機能が有効な場合のみ表示） */}
                {photoFunctionEnabled && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2 flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>
                        <strong>写真共有について</strong>
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mb-3 ml-7">
                      当園では、保育園での日常の様子や行事の写真を専用アプリを通じて保護者の皆様と共有しています。
                      アプリは保護者のみがアクセス可能で、お子様の成長記録を安全にご覧いただけます。
                      クラスの集合写真なども含まれますので、ぜひご活用ください。
                    </p>

                    <label className="flex items-start cursor-pointer ml-7">
                      <input
                        type="checkbox"
                        {...register(`children.${index}.childNoPhoto`)}
                        className="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        写真の撮影・共有を希望しない
                        <span className="block text-xs text-gray-500 mt-1">
                          （チェックを入れた場合、お子様が写った写真は共有されません）
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 園児追加ボタン */}
          {fields.length < 4 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAddChild}
                className="px-6 py-2 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                園児を追加（残り{4 - fields.length}人）
              </button>
            </div>
          )}

          {/* 配列エラー */}
          {errors.children && typeof errors.children === 'object' && 'message' in errors.children && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errors.children.message}</p>
            </div>
          )}

          {/* 確認画面へボタン */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-md hover:shadow-lg transition-all duration-200"
            >
              入力内容を確認する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
