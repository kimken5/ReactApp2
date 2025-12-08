/**
 * インポート処理モーダル
 */

import React, { useState, useEffect } from 'react';
import {
  getApplicationDetail,
  importApplication,
} from '../../../services/desktopApplicationService';
import type { ApplicationWorkDto } from '../../../types/desktopApplication';

interface Props {
  applicationId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportApplicationModal({ applicationId, onClose, onSuccess }: Props) {
  const [application, setApplication] = useState<ApplicationWorkDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [useExistingParent, setUseExistingParent] = useState(false);

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

    try {
      const result = await importApplication(applicationId, {
        useExistingParent,
        existingParentId: useExistingParent
          ? application.duplicateParentInfo?.existingParentId
          : undefined,
      });

      // 成功メッセージを表示してモーダルを閉じる
      alert(
        `インポートが完了しました。\n\n` +
        `保護者: ${result.parentName} (ID: ${result.parentId}) ${result.wasParentCreated ? '(新規作成)' : result.wasParentUpdated ? '(情報更新)' : '(既存)'}\n` +
        `園児: ${result.childName} (ID: ${result.childId}) (新規作成)`
      );

      onSuccess();
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-6">申込が見つかりません。</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-400"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const hasDuplicate =
    application.duplicateParentInfo && application.duplicateParentInfo.hasDuplicate;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="import-modal-title"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 id="import-modal-title" className="text-2xl font-bold text-gray-900">
            申込インポート確認
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:cursor-not-allowed"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <p className="mb-6 text-gray-700">
            以下の内容でインポートします。内容を確認してください。
          </p>

          {/* 重複保護者の選択 */}
          {hasDuplicate && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">
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
                      保護者ID: {application.duplicateParentInfo?.existingParentId} |{' '}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">インポート内容</h3>

            {/* 保護者 */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                {useExistingParent && hasDuplicate ? '✓ 既存保護者' : '+ 新規保護者'}
              </h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-600">氏名:</dt>
                  <dd className="font-medium">{application.applicantName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">フリガナ:</dt>
                  <dd className="font-medium">{application.applicantNameKana}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">携帯電話:</dt>
                  <dd className="font-medium">{application.mobilePhone}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">続柄:</dt>
                  <dd className="font-medium">{application.relationshipToChild}</dd>
                </div>
              </dl>
            </div>

            {/* 園児 */}
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">+ 新規園児</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-600">氏名:</dt>
                  <dd className="font-medium">{application.childName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">フリガナ:</dt>
                  <dd className="font-medium">{application.childNameKana}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">生年月日:</dt>
                  <dd className="font-medium">
                    {new Date(application.childDateOfBirth).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">性別:</dt>
                  <dd className="font-medium">{application.childGender}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ インポート後、この申込のステータスは「取り込み済み」に変更され、再度インポートすることはできません。
            </p>
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                インポート中...
              </span>
            ) : (
              'インポート実行'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
