import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitApplication } from '../../services/applicationService';
import type { ApplicationFormData } from '../../types/application';
import {
  RELATIONSHIP_OPTIONS,
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
} from '../../types/application';

export function ApplicationConfirm() {
  const navigate = useNavigate();
  const [nurseryName, setNurseryName] = useState('');
  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // ApplicationKeyと保育園情報の確認
    const key = sessionStorage.getItem('applicationKey');
    const name = sessionStorage.getItem('nurseryName');
    const dataStr = sessionStorage.getItem('applicationFormData');

    if (!key || !name || !dataStr) {
      // データが不完全な場合は最初に戻る
      navigate('/application');
      return;
    }

    setNurseryName(name);

    try {
      setFormData(JSON.parse(dataStr));
    } catch (e) {
      console.error('Failed to parse form data', e);
      navigate('/application');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    if (!formData) return;

    const key = sessionStorage.getItem('applicationKey');
    if (!key) {
      setError('ApplicationKeyが見つかりません。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitApplication(formData, key);

      // 送信成功: 下書きを削除して完了画面へ
      localStorage.removeItem('application-form-draft');
      sessionStorage.removeItem('applicationFormData');

      navigate('/application/complete');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('申込の送信に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return null;
  }

  // ラベル取得ヘルパー関数
  const getRelationshipLabel = (value: string) => {
    return RELATIONSHIP_OPTIONS.find((r) => r.value === value)?.label || value;
  };

  const getGenderLabel = (value: string) => {
    return GENDER_OPTIONS.find((g) => g.value === value)?.label || value;
  };

  const getBloodTypeLabel = (value: string) => {
    return BLOOD_TYPE_OPTIONS.find((b) => b.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {nurseryName} 入園申込 - 確認
          </h1>
          <p className="text-sm text-gray-600">
            以下の内容で申込を送信します。内容を確認してください。
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-red-600 font-medium">エラー</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* 申請保護者情報 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            申請保護者情報
          </h2>

          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">お名前</dt>
              <dd className="mt-1 text-base text-gray-900">{formData.applicantName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">フリガナ</dt>
              <dd className="mt-1 text-base text-gray-900">{formData.applicantNameKana}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">生年月日</dt>
              <dd className="mt-1 text-base text-gray-900">
                {new Date(formData.dateOfBirth).toLocaleDateString('ja-JP')}
              </dd>
            </div>

            {formData.postalCode && (
              <div>
                <dt className="text-sm font-medium text-gray-500">郵便番号</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.postalCode}</dd>
              </div>
            )}

            {formData.prefecture && (
              <div>
                <dt className="text-sm font-medium text-gray-500">都道府県</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.prefecture}</dd>
              </div>
            )}

            {formData.city && (
              <div>
                <dt className="text-sm font-medium text-gray-500">市区町村</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.city}</dd>
              </div>
            )}

            {formData.addressLine && (
              <div>
                <dt className="text-sm font-medium text-gray-500">番地・建物名</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.addressLine}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">携帯電話番号</dt>
              <dd className="mt-1 text-base text-gray-900">{formData.mobilePhone}</dd>
            </div>

            {formData.homePhone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">固定電話番号</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.homePhone}</dd>
              </div>
            )}

            {formData.emergencyContact && (
              <div>
                <dt className="text-sm font-medium text-gray-500">緊急連絡先</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.emergencyContact}</dd>
              </div>
            )}

            {formData.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-base text-gray-900">{formData.email}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">続柄</dt>
              <dd className="mt-1 text-base text-gray-900">
                {getRelationshipLabel(formData.relationshipToChild)}
              </dd>
            </div>
          </dl>
        </section>

        {/* 園児情報 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
            園児情報
          </h2>

          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">お名前</dt>
              <dd className="mt-1 text-base text-gray-900">{formData.childName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">フリガナ</dt>
              <dd className="mt-1 text-base text-gray-900">{formData.childNameKana}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">生年月日</dt>
              <dd className="mt-1 text-base text-gray-900">
                {new Date(formData.childDateOfBirth).toLocaleDateString('ja-JP')}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">性別</dt>
              <dd className="mt-1 text-base text-gray-900">
                {getGenderLabel(formData.childGender)}
              </dd>
            </div>

            {formData.childBloodType && (
              <div>
                <dt className="text-sm font-medium text-gray-500">血液型</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {getBloodTypeLabel(formData.childBloodType)}
                </dd>
              </div>
            )}

            {formData.childMedicalNotes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">健康に関する特記事項</dt>
                <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
                  {formData.childMedicalNotes}
                </dd>
              </div>
            )}

            {formData.childSpecialInstructions && (
              <div>
                <dt className="text-sm font-medium text-gray-500">その他の特記事項</dt>
                <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
                  {formData.childSpecialInstructions}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* ボタンエリア */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/application/form')}
            disabled={isSubmitting}
            className="flex-1 bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            戻って修正する
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                送信中...
              </span>
            ) : (
              '申込を送信する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
