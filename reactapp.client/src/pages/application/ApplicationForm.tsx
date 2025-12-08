import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField } from '../../components/application/FormField';
import { applicationFormSchema } from '../../utils/applicationValidation';
import type { ApplicationFormData } from '../../types/application';
import {
  RELATIONSHIP_OPTIONS,
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  PREFECTURE_OPTIONS,
} from '../../types/application';
import { z } from 'zod';

export function ApplicationForm() {
  const navigate = useNavigate();
  const [nurseryName, setNurseryName] = useState('');
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicantName: '',
    applicantNameKana: '',
    dateOfBirth: '',
    postalCode: '',
    prefecture: '',
    city: '',
    addressLine: '',
    mobilePhone: '',
    homePhone: '',
    emergencyContact: '',
    email: '',
    relationshipToChild: '',
    childName: '',
    childNameKana: '',
    childDateOfBirth: '',
    childGender: '',
    childBloodType: '',
    childMedicalNotes: '',
    childSpecialInstructions: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // ApplicationKeyと保育園情報の確認
    const key = sessionStorage.getItem('applicationKey');
    const name = sessionStorage.getItem('nurseryName');

    if (!key || !name) {
      // ApplicationKey未入力の場合は入力画面へ
      navigate('/application');
      return;
    }

    setNurseryName(name);

    // LocalStorageから下書きデータを復元
    const savedData = localStorage.getItem('application-form-draft');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse saved form data', e);
      }
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('application-form-draft', JSON.stringify(formData));
    alert('下書きを保存しました');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // バリデーション
    try {
      applicationFormSchema.parse(formData);

      // バリデーション成功: 確認画面へ
      sessionStorage.setItem('applicationFormData', JSON.stringify(formData));
      navigate('/application/confirm');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          const path = error.path.join('.');
          newErrors[path] = error.message;
        });
        setErrors(newErrors);

        // 最初のエラーフィールドにスクロール
        const firstErrorField = document.querySelector('[aria-invalid="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {nurseryName} 入園申込
          </h1>
          <p className="text-sm text-gray-600">
            以下の情報を入力してください。<span className="text-red-500">*</span>は必須項目です。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 申請保護者情報 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              申請保護者情報
            </h2>

            <FormField
              label="お名前"
              name="applicantName"
              value={formData.applicantName}
              onChange={handleChange}
              error={errors.applicantName}
              required
              placeholder="例: 山田 太郎"
              maxLength={100}
            />

            <FormField
              label="フリガナ"
              name="applicantNameKana"
              value={formData.applicantNameKana}
              onChange={handleChange}
              error={errors.applicantNameKana}
              required
              placeholder="例: ヤマダ タロウ"
              helpText="全角カタカナで入力してください"
              maxLength={100}
            />

            <FormField
              label="生年月日"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              error={errors.dateOfBirth}
              required
            />

            <FormField
              label="郵便番号"
              name="postalCode"
              value={formData.postalCode || ''}
              onChange={handleChange}
              error={errors.postalCode}
              placeholder="例: 123-4567"
              helpText="ハイフンあり/なし両方可"
            />

            <FormField
              label="都道府県"
              name="prefecture"
              value={formData.prefecture || ''}
              onChange={handleChange}
              error={errors.prefecture}
              as="select"
              options={PREFECTURE_OPTIONS.map((pref) => ({ value: pref, label: pref }))}
            />

            <FormField
              label="市区町村"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              error={errors.city}
              placeholder="例: 千代田区"
              maxLength={50}
            />

            <FormField
              label="番地・建物名"
              name="addressLine"
              value={formData.addressLine || ''}
              onChange={handleChange}
              error={errors.addressLine}
              placeholder="例: 千代田1-1-1 マンション名 101号室"
              maxLength={200}
            />

            <FormField
              label="携帯電話番号"
              name="mobilePhone"
              type="tel"
              value={formData.mobilePhone}
              onChange={handleChange}
              error={errors.mobilePhone}
              required
              placeholder="例: 090-1234-5678"
              helpText="ハイフンあり/なし両方可"
              maxLength={20}
            />

            <FormField
              label="固定電話番号"
              name="homePhone"
              type="tel"
              value={formData.homePhone || ''}
              onChange={handleChange}
              error={errors.homePhone}
              placeholder="例: 03-1234-5678"
              maxLength={20}
            />

            <FormField
              label="緊急連絡先"
              name="emergencyContact"
              type="tel"
              value={formData.emergencyContact || ''}
              onChange={handleChange}
              error={errors.emergencyContact}
              placeholder="例: 090-9876-5432"
              helpText="保護者以外の緊急連絡先"
              maxLength={20}
            />

            <FormField
              label="メールアドレス"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              error={errors.email}
              placeholder="例: example@example.com"
              maxLength={255}
            />

            <FormField
              label="続柄"
              name="relationshipToChild"
              value={formData.relationshipToChild}
              onChange={handleChange}
              error={errors.relationshipToChild}
              required
              as="select"
              options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            />
          </section>

          {/* 園児情報 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
              園児情報
            </h2>

            <FormField
              label="お名前"
              name="childName"
              value={formData.childName}
              onChange={handleChange}
              error={errors.childName}
              required
              placeholder="例: 山田 花子"
              maxLength={100}
            />

            <FormField
              label="フリガナ"
              name="childNameKana"
              value={formData.childNameKana}
              onChange={handleChange}
              error={errors.childNameKana}
              required
              placeholder="例: ヤマダ ハナコ"
              helpText="全角カタカナで入力してください"
              maxLength={100}
            />

            <FormField
              label="生年月日"
              name="childDateOfBirth"
              type="date"
              value={formData.childDateOfBirth}
              onChange={handleChange}
              error={errors.childDateOfBirth}
              required
            />

            <FormField
              label="性別"
              name="childGender"
              value={formData.childGender}
              onChange={handleChange}
              error={errors.childGender}
              required
              as="select"
              options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
            />

            <FormField
              label="血液型"
              name="childBloodType"
              value={formData.childBloodType || ''}
              onChange={handleChange}
              error={errors.childBloodType}
              as="select"
              options={BLOOD_TYPE_OPTIONS.map((b) => ({ value: b.value, label: b.label }))}
            />

            <FormField
              label="健康に関する特記事項"
              name="childMedicalNotes"
              value={formData.childMedicalNotes || ''}
              onChange={handleChange}
              error={errors.childMedicalNotes}
              as="textarea"
              placeholder="アレルギー、持病、服薬中の薬などがあれば記入してください"
              helpText="アレルギーや持病などがあれば記入してください"
              maxLength={1000}
            />

            <FormField
              label="その他の特記事項"
              name="childSpecialInstructions"
              value={formData.childSpecialInstructions || ''}
              onChange={handleChange}
              error={errors.childSpecialInstructions}
              as="textarea"
              placeholder="保育園に伝えておきたいことがあれば記入してください"
              maxLength={1000}
            />
          </section>

          {/* ボタンエリア */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/application')}
              className="flex-1 bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              戻る
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 bg-yellow-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            >
              下書き保存
            </button>

            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              確認画面へ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
