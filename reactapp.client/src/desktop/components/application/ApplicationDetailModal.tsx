/**
 * 申込詳細モーダル
 */

import React, { useState, useEffect } from 'react';
import { getApplicationDetail } from '../../../services/desktopApplicationService';
import { useDesktopAuth } from '../../contexts/DesktopAuthContext';
import type { ApplicationWorkDto } from '../../../types/desktopApplication';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_ICONS,
} from '../../../types/desktopApplication';

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
 * 続柄を日本語に変換する関数
 */
function formatRelationship(relationship: string): string {
  return RELATIONSHIP_LABEL_MAP[relationship] || relationship;
}

/**
 * 性別の英語値を日本語に変換するマッピング
 */
const GENDER_LABEL_MAP: Record<string, string> = {
  'M': '男',
  'F': '女',
};

/**
 * 性別を日本語に変換する関数
 */
function formatGender(gender: string): string {
  return GENDER_LABEL_MAP[gender] || gender;
}

interface Props {
  applicationId: number;
  onClose: () => void;
  onImport?: () => void;
  onReject?: () => void;
}

export function ApplicationDetailModal({ applicationId, onClose, onImport, onReject }: Props) {
  const { state } = useDesktopAuth();
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true; // 写真機能の利用可否

  const [application, setApplication] = useState<ApplicationWorkDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getApplicationDetail(applicationId);
        setApplication(data);
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

  // Escキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isPending = application?.applicationStatus === 'Pending';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-800">
              申込詳細
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
          {error && !isLoading && (
            <div className="py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold text-red-600 mb-2">エラー</h3>
                <p className="text-gray-700">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && application && (
            <>
          {/* ステータス */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ステータス</h3>
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${APPLICATION_STATUS_COLORS[application.applicationStatus]}`}>
                <span className="mr-1">{APPLICATION_STATUS_ICONS[application.applicationStatus]}</span>
                {APPLICATION_STATUS_LABELS[application.applicationStatus]}
              </span>
              <span className="text-sm text-gray-500">
                申込日時: {new Date(application.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            {application.isImported && application.importedAt && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {new Date(application.importedAt).toLocaleString('ja-JP')} にインポート済み
              </p>
            )}

          </div>

          {/* 却下情報（却下済の場合のみ表示） */}
          {application.applicationStatus === 'Rejected' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                ✗ 却下済み申込
              </h3>
              {application.rejectedAt && (
                <p className="text-sm text-red-700 mb-2">
                  <strong>却下日時:</strong> {new Date(application.rejectedAt).toLocaleString('ja-JP')}
                </p>
              )}
              {application.rejectionReason && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-800 mb-1">却下理由:</p>
                  <p className="text-sm text-red-700 bg-white p-3 rounded border border-red-200 whitespace-pre-wrap">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 重複保護者情報（取込済・却下済の場合は非表示） */}
          {application.applicationStatus !== 'Imported' && application.applicationStatus !== 'Rejected' && application.duplicateParentInfo && application.duplicateParentInfo.hasDuplicate && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                ⚠️ 重複保護者情報
              </h3>
              <p className="text-sm text-orange-800">
                電話番号が一致する保護者が見つかりました。
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-sm">
                <div>
                  <dt className="font-medium text-orange-900">保護者名:</dt>
                  <dd className="text-orange-800">{application.duplicateParentInfo.existingParentName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-orange-900">登録済み園児数:</dt>
                  <dd className="text-orange-800">{application.duplicateParentInfo.childCount}人</dd>
                </div>
              </dl>
            </div>
          )}

          {/* 4カラムレイアウト: 申請保護者情報(2列) | 園児情報(2列) */}
          <div className="grid grid-cols-4 gap-6">
            {/* 申請保護者情報 - 左2列 */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                申請保護者情報
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">お名前</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.applicantName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ふりがな</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.applicantNameKana}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(application.dateOfBirth).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">続柄</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatRelationship(application.relationshipToChild)}</dd>
                </div>
                {application.postalCode && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">郵便番号</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.postalCode}</dd>
                  </div>
                )}
                {application.prefecture && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">都道府県</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.prefecture}</dd>
                  </div>
                )}
                {application.city && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">市区町村</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.city}</dd>
                  </div>
                )}
                {application.addressLine && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">番地・建物名</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.addressLine}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">携帯電話</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.mobilePhone}</dd>
                </div>
                {application.homePhone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">固定電話</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.homePhone}</dd>
                  </div>
                )}
                {application.email && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.email}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 園児情報 - 右2列 */}
            <div className="col-span-2 relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
              <div className="pl-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  園児情報
                </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">お名前</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.childName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ふりがな</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.childNameKana}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(application.childDateOfBirth).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">性別</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatGender(application.childGender)}</dd>
                </div>
                {application.childBloodType && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">血液型</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.childBloodType}</dd>
                  </div>
                )}
                {application.childMedicalNotes && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">健康に関する特記事項</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {application.childMedicalNotes}
                    </dd>
                  </div>
                )}
                {application.childSpecialInstructions && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">その他の特記事項</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {application.childSpecialInstructions}
                    </dd>
                  </div>
                )}
                {/* NoPhoto (撮影禁止) 情報 - 写真機能が有効な場合のみ表示 */}
                {photoFunctionEnabled && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">写真撮影・共有</dt>
                    <dd className="mt-1">
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
          </div>
          </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && application && (
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            閉じる
          </button>
          {isPending && onImport && (
            <button
              onClick={onImport}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-sm"
            >
              インポート
            </button>
          )}
          {isPending && onReject && (
            <button
              onClick={onReject}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-sm"
            >
              却下
            </button>
          )}
        </div>
        )}
      </div>
      </div>
    </>
  );
}
