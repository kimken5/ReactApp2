import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { NurseryDto, UpdateNurseryRequestDto } from '../types/master';

/**
 * 保育園情報編集ページ
 * 保育園の基本情報を表示・編集する
 */
// パスワード強度チェック結果の型
interface PasswordStrength {
  score: number; // 0-4 (弱い-強い)
  feedback: string[];
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  hasThreeTypes: boolean;
  noRepeat: boolean;
  notCommon: boolean;
}

export function NurseryInfoPage() {
  const [nursery, setNursery] = useState<NurseryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // フォーム入力値の状態
  const [formData, setFormData] = useState<UpdateNurseryRequestDto>({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    principalName: '',
    establishedDate: '',
    currentPassword: '',
    newPassword: '',
  });

  // 初期データ読み込み
  useEffect(() => {
    loadNurseryData();
  }, []);

  const loadNurseryData = async () => {
    try {
      setIsLoading(true);
      const data = await masterService.getNursery();
      console.log('=== Nursery Data Received ===', data);
      console.log('principalName:', data.principalName);
      console.log('establishedDate:', data.establishedDate);
      setNursery(data);
      setFormData({
        name: data.name,
        address: data.address,
        phoneNumber: data.phoneNumber,
        email: data.email || '',
        principalName: data.principalName || '',
        establishedDate: data.establishedDate ? data.establishedDate.split('T')[0] : '',
        currentPassword: '',
        newPassword: '',
      });
    } catch (error) {
      console.error('保育園情報の取得に失敗しました:', error);
      setErrors({ general: '保育園情報の取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // パスワード強度チェック（バランス型ポリシー）
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];

    // 各条件のチェック
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // 文字種のカウント
    let typeCount = 0;
    if (hasUpperCase) typeCount++;
    if (hasLowerCase) typeCount++;
    if (hasDigit) typeCount++;
    if (hasSpecialChar) typeCount++;

    const hasThreeTypes = typeCount >= 3;

    // 連続する同じ文字チェック
    const noRepeat = !/(.)\1{2,}/.test(password);

    // よくあるパスワードチェック
    const commonPasswords = [
      'password', 'Password', 'PASSWORD', 'Password1', 'Password123',
      '12345678', '123456789', '1234567890',
      'qwerty', 'qwerty123', 'Qwerty123',
      'abc12345', 'Abc12345',
      'admin123', 'Admin123',
      'hoikuen', 'hoikuen123', 'Hoikuen123'
    ];
    const notCommon = !commonPasswords.includes(password);

    // フィードバック生成
    if (!hasMinLength) feedback.push('8文字以上');
    if (!hasThreeTypes) feedback.push('大文字、小文字、数字、特殊文字のうち3種類以上');
    if (!noRepeat) feedback.push('同じ文字を3回以上連続して使用不可');
    if (!notCommon) feedback.push('よくあるパスワードは使用不可');

    // スコア計算 (0-4)
    let score = 0;
    if (hasMinLength) score++;
    if (hasThreeTypes) score++;
    if (noRepeat) score++;
    if (notCommon) score++;

    return {
      score,
      feedback,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasDigit,
      hasSpecialChar,
      hasThreeTypes,
      noRepeat,
      notCommon
    };
  };

  // 入力値変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'capacity') {
      // 定員は数値のみ
      const numValue = value === '' ? undefined : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // 新しいパスワードの強度をリアルタイムチェック
    if (name === 'newPassword') {
      if (value) {
        setPasswordStrength(checkPasswordStrength(value));
      } else {
        setPasswordStrength(null);
      }
    }

    // エラークリア
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '保育園名は必須です';
    }

    if (!formData.address.trim()) {
      newErrors.address = '住所は必須です';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^(\d{10,11}|\d{2,4}-\d{2,4}-\d{4})$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '電話番号の形式が正しくありません（10-11桁の数字、またはハイフン区切り）';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    // パスワード変更のバリデーション
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '現在のパスワードを入力してください';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = '新しいパスワードを入力してください';
      } else {
        // パスワード強度チェック
        const strength = checkPasswordStrength(formData.newPassword);
        if (strength.score < 4) {
          newErrors.newPassword = 'パスワードが要件を満たしていません: ' + strength.feedback.join('、');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSaving(true);
      setSuccessMessage(null);
      setErrors({});

      // パスワードフィールドが空の場合は送信しない
      const dataToSend = { ...formData };
      if (!formData.currentPassword && !formData.newPassword) {
        delete dataToSend.currentPassword;
        delete dataToSend.newPassword;
      }

      const updatedNursery = await masterService.updateNursery(dataToSend);
      setNursery(updatedNursery);

      // パスワードフィールドをクリア
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));

      setSuccessMessage('保育園情報を更新しました');

      // ページトップまでスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('保育園情報の更新に失敗しました:', error);
      setErrors({ general: '保育園情報の更新に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">保育園情報</h1>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {/* 全体エラーメッセージ */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errors.general}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-md">
          <div className="p-6 space-y-6">
            {/* 基本情報セクション */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 保育園名 */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    保育園名 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例: さくら保育園"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* 住所 */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    住所 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例: 東京都渋谷区1-2-3"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* 電話番号 */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例: 03-1234-5678"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* メールアドレス */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="例: info@sakura-hoikuen.jp"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* 園長名 */}
                <div>
                  <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-2">
                    園長名
                  </label>
                  <input
                    type="text"
                    id="principalName"
                    name="principalName"
                    value={formData.principalName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="例: 山田 太郎"
                  />
                </div>

                {/* 設立日 */}
                <div>
                  <label htmlFor="establishedDate" className="block text-sm font-medium text-gray-700 mb-2">
                    設立日
                  </label>
                  <input
                    type="date"
                    id="establishedDate"
                    name="establishedDate"
                    value={formData.establishedDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* ログイン情報セクション */}
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ログイン情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ログインID（読み取り専用） */}
                <div className="md:col-span-2">
                  <label htmlFor="loginId" className="block text-sm font-medium text-gray-700 mb-2">
                    ログインID
                  </label>
                  <input
                    type="text"
                    id="loginId"
                    value={nursery?.loginId || ''}
                    readOnly
                    className="w-full px-4 py-2 border-0 text-gray-600 cursor-default focus:outline-none"
                  />
                </div>

                {/* 現在のパスワード */}
                <div className="md:col-span-2">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    現在のパスワード
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="パスワードを変更する場合は入力してください"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                {/* 新しいパスワード */}
                <div className="md:col-span-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="新しいパスワード（8文字以上）"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}

                  {/* パスワード強度インジケーター */}
                  {passwordStrength && formData.newPassword && (
                    <div className="mt-3 space-y-2">
                      {/* 強度バー */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">強度:</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.score === 0 ? 'w-1/4 bg-red-500' :
                              passwordStrength.score === 1 ? 'w-2/4 bg-orange-500' :
                              passwordStrength.score === 2 ? 'w-3/4 bg-yellow-500' :
                              passwordStrength.score === 3 ? 'w-full bg-blue-500' :
                              'w-full bg-green-500'
                            }`}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          passwordStrength.score === 0 ? 'text-red-600' :
                          passwordStrength.score === 1 ? 'text-orange-600' :
                          passwordStrength.score === 2 ? 'text-yellow-600' :
                          passwordStrength.score === 3 ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.score === 0 ? '非常に弱い' :
                           passwordStrength.score === 1 ? '弱い' :
                           passwordStrength.score === 2 ? '普通' :
                           passwordStrength.score === 3 ? '良好' :
                           '強い'}
                        </span>
                      </div>

                      {/* チェックリスト */}
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasMinLength ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-600'}>
                            8文字以上
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {passwordStrength.hasThreeTypes ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={passwordStrength.hasThreeTypes ? 'text-green-700' : 'text-gray-600'}>
                            大文字、小文字、数字、特殊文字のうち3種類以上
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {passwordStrength.noRepeat ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={passwordStrength.noRepeat ? 'text-green-700' : 'text-gray-600'}>
                            同じ文字を3回以上連続して使用しない
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {passwordStrength.notCommon ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={passwordStrength.notCommon ? 'text-green-700' : 'text-gray-600'}>
                            よくあるパスワードではない
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="mt-1 text-sm text-gray-500">
                    パスワードを変更しない場合は空欄のままにしてください
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium transition-all duration-200 ${
                isSaving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                  保存中...
                </span>
              ) : (
                '保存する'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
