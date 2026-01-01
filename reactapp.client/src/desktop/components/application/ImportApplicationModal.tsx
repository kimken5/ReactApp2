/**
 * インポート処理モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  getApplicationDetail,
  importApplication,
} from '../../../services/desktopApplicationService';
import { fetchAllergens, type Allergen } from '../../../services/allergenService';
import { useDesktopAuth } from '../../contexts/DesktopAuthContext';
import type { ApplicationWorkDto } from '../../../types/desktopApplication';

/**
 * 続柄の英語値を日本語に変換するマッピング
 */
const RELATIONSHIP_LABEL_MAP: Record<string, string> = {
  'Father': '父',
  'Mother': '母',
  'Grandfather': '祖父',
  'Grandmother': '祖母',
  'Other': 'その他',
};

/**
 * 性別の英語値を日本語に変換するマッピング
 */
const GENDER_LABEL_MAP: Record<string, string> = {
  'M': '男',
  'F': '女',
};

/**
 * 続柄を日本語に変換する関数
 */
function formatRelationship(relationship: string): string {
  return RELATIONSHIP_LABEL_MAP[relationship] || relationship;
}

/**
 * 性別を日本語に変換する関数
 */
function formatGender(gender: string): string {
  return GENDER_LABEL_MAP[gender] || gender;
}

interface Props {
  applicationId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportApplicationModal({ applicationId, onClose, onSuccess }: Props) {
  const { state } = useDesktopAuth();
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true; // 写真機能の利用可否

  const [application, setApplication] = useState<ApplicationWorkDto | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [useExistingParent, setUseExistingParent] = useState(false);

  // アレルゲンマスター取得
  useEffect(() => {
    const loadAllergens = async () => {
      try {
        const data = await fetchAllergens();
        setAllergens(data);
      } catch (error) {
        console.error('アレルゲンマスターの取得に失敗しました:', error);
      }
    };

    loadAllergens();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getApplicationDetail(applicationId);
        setApplication(data);

        // 重複保護者がいる場合、デフォルトで既存保護者を使用
        if (data.duplicateParentInfo && data.duplicateParentInfo.hasDuplicate) {
          setUseExistingParent(true);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('申込詳細の取得に失敗しました。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [applicationId]);

  const handleImport = async () => {
    if (!application) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await importApplication(applicationId, {
        overwriteParent: useExistingParent, // 既存保護者を使う場合は上書きする
      });

      // 成功メッセージを設定（モーダル内に表示）
      const parentStatus = result.wasParentCreated ? '(新規作成)' : result.wasParentUpdated ? '(情報更新)' : '(既存)';
      setSuccessMessage(
        `インポートが完了しました。\n\n` +
        `保護者: ${result.parentName} ${parentStatus}\n` +
        `園児: ${result.childName} (新規作成)`
      );

      // 2秒後にモーダルを閉じてリストを更新
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('インポートに失敗しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  const hasDuplicate =
    application?.duplicateParentInfo && application.duplicateParentInfo.hasDuplicate;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              申込インポート確認
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        <div className="p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">読み込み中...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && !application && (
            <div className="py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold text-red-600 mb-2">エラー</h3>
                <p className="text-gray-700">申込が見つかりません。</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && application && (
            <>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 whitespace-pre-line">{successMessage}</p>
            </div>
          )}

          <p className="mb-6 text-gray-700">
            以下の内容でインポートします。内容を確認してください。
          </p>

          {/* 重複保護者の選択 */}
          {hasDuplicate && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">
                ⚠️ 重複保護者が見つかりました
              </h3>
              <p className="text-sm text-orange-800 mb-4">
                電話番号が一致する保護者が既に登録されています。どちらを使用しますか?
              </p>

              <div className="space-y-3">
                <label className="flex items-start p-3 bg-white rounded border-2 border-orange-300 cursor-pointer hover:bg-orange-50">
                  <input
                    type="radio"
                    checked={useExistingParent}
                    onChange={() => setUseExistingParent(true)}
                    disabled={isSubmitting}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">既存保護者を使用</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {application.duplicateParentInfo?.existingParentName} |{' '}
                      登録済み園児: {application.duplicateParentInfo?.childCount}人
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 既存保護者の情報が申込内容で更新されます
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-3 bg-white rounded border-2 border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    checked={!useExistingParent}
                    onChange={() => setUseExistingParent(false)}
                    disabled={isSubmitting}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">新規保護者を作成</div>
                    <div className="text-sm text-gray-600 mt-1">
                      申込内容から新しい保護者レコードを作成します
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ※ 同じ電話番号の保護者が重複して登録されます
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* インポート内容プレビュー */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">インポート内容</h3>

            {/* 保護者 */}
            <div className="mb-4 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                {useExistingParent && hasDuplicate ? '✓ 既存保護者' : '+ 新規保護者'}
              </h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-600">氏名:</dt>
                  <dd className="font-medium">{application.applicantName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">ふりがな:</dt>
                  <dd className="font-medium">{application.applicantNameKana}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">携帯電話:</dt>
                  <dd className="font-medium">{application.mobilePhone}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">続柄:</dt>
                  <dd className="font-medium">{formatRelationship(application.relationshipToChild)}</dd>
                </div>
              </dl>
            </div>

            {/* 園児 */}
            <div className="mb-4 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">+ 新規園児</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-600">氏名:</dt>
                  <dd className="font-medium">{application.childFamilyName} {application.childFirstName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">ふりがな:</dt>
                  <dd className="font-medium">{application.childFamilyNameKana} {application.childFirstNameKana}</dd>
                </div>
                {application.childAllergy && (
                  <div className="col-span-2">
                    <dt className="text-gray-600">アレルギー情報:</dt>
                    <dd className="font-medium">
                      {application.childAllergy.split(',').filter(id => id.trim()).map((allergenId) => {
                        const allergen = allergens.find(a => a.id === parseInt(allergenId));
                        return allergen ? allergen.allergenName : null;
                      }).filter(Boolean).join('、')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600">生年月日:</dt>
                  <dd className="font-medium">
                    {new Date(application.childDateOfBirth).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">性別:</dt>
                  <dd className="font-medium">{formatGender(application.childGender)}</dd>
                </div>
                {/* NoPhoto情報 - 写真機能が有効な場合のみ表示 */}
                {photoFunctionEnabled && (
                  <div className="col-span-2">
                    <dt className="text-gray-600 mb-1">写真撮影・共有:</dt>
                    <dd>
                      {application.childNoPhoto ? (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-yellow-100 border border-yellow-300">
                          <svg className="w-5 h-5 text-yellow-700 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-yellow-800">撮影・共有を希望しない</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 border border-green-300">
                          <svg className="w-5 h-5 text-green-700 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-semibold text-green-800">撮影・共有を許可</span>
                        </div>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ インポート後、この申込のステータスは「取り込み済み」に変更され、再度インポートすることはできません。
            </p>
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && application && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isSubmitting ? 'インポート中...' : 'インポート実行'}</span>
          </button>
        </div>
        )}
      </div>
      </div>
    </>
  );
}
