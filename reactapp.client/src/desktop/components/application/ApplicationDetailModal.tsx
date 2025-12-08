/**
 * 申込詳細モーダル
 */

import React, { useState, useEffect } from 'react';
import { getApplicationDetail } from '../../../services/desktopApplicationService';
import type { ApplicationWorkDto } from '../../../types/desktopApplication';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_ICONS,
} from '../../../types/desktopApplication';

interface Props {
  applicationId: number;
  onClose: () => void;
  onImport?: () => void;
  onReject?: () => void;
}

export function ApplicationDetailModal({ applicationId, onClose, onImport, onReject }: Props) {
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-700 mb-6">{error || '申込が見つかりません。'}</p>
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

  const isPending = application.applicationStatus === 'Pending';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            申込詳細 (ID: {application.id})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* ステータス */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ステータス</h3>
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

            {application.applicationStatus === 'Rejected' && application.rejectedAt && (
              <div className="mt-2">
                <p className="text-sm text-red-600">
                  ✗ {new Date(application.rejectedAt).toLocaleString('ja-JP')} に却下
                </p>
                {application.rejectionReason && (
                  <p className="mt-1 text-sm text-gray-700 bg-red-50 p-2 rounded">
                    <strong>却下理由:</strong> {application.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 重複保護者情報 */}
          {application.duplicateParentInfo && application.duplicateParentInfo.hasDuplicate && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                ⚠️ 重複保護者情報
              </h3>
              <p className="text-sm text-orange-800">
                電話番号が一致する保護者が見つかりました。
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-sm">
                <div>
                  <dt className="font-medium text-orange-900">保護者ID:</dt>
                  <dd className="text-orange-800">{application.duplicateParentInfo.existingParentId}</dd>
                </div>
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

          {/* 申請保護者情報 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              申請保護者情報
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">お名前</dt>
                <dd className="mt-1 text-base text-gray-900">{application.applicantName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">フリガナ</dt>
                <dd className="mt-1 text-base text-gray-900">{application.applicantNameKana}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {new Date(application.dateOfBirth).toLocaleDateString('ja-JP')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">続柄</dt>
                <dd className="mt-1 text-base text-gray-900">{application.relationshipToChild}</dd>
              </div>
              {application.postalCode && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">郵便番号</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.postalCode}</dd>
                </div>
              )}
              {application.prefecture && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">都道府県</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.prefecture}</dd>
                </div>
              )}
              {application.city && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">市区町村</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.city}</dd>
                </div>
              )}
              {application.addressLine && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">番地・建物名</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.addressLine}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">携帯電話</dt>
                <dd className="mt-1 text-base text-gray-900">{application.mobilePhone}</dd>
              </div>
              {application.homePhone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">固定電話</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.homePhone}</dd>
                </div>
              )}
              {application.emergencyContact && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">緊急連絡先</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.emergencyContact}</dd>
                </div>
              )}
              {application.email && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.email}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 園児情報 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-green-500">
              園児情報
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">お名前</dt>
                <dd className="mt-1 text-base text-gray-900">{application.childName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">フリガナ</dt>
                <dd className="mt-1 text-base text-gray-900">{application.childNameKana}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {new Date(application.childDateOfBirth).toLocaleDateString('ja-JP')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">性別</dt>
                <dd className="mt-1 text-base text-gray-900">{application.childGender}</dd>
              </div>
              {application.childBloodType && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">血液型</dt>
                  <dd className="mt-1 text-base text-gray-900">{application.childBloodType}</dd>
                </div>
              )}
              {application.childMedicalNotes && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">健康に関する特記事項</dt>
                  <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
                    {application.childMedicalNotes}
                  </dd>
                </div>
              )}
              {application.childSpecialInstructions && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">その他の特記事項</dt>
                  <dd className="mt-1 text-base text-gray-900 whitespace-pre-wrap">
                    {application.childSpecialInstructions}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400"
          >
            閉じる
          </button>
          {isPending && onImport && (
            <button
              onClick={onImport}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
            >
              インポート
            </button>
          )}
          {isPending && onReject && (
            <button
              onClick={onReject}
              className="px-6 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700"
            >
              却下
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
