import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { contactNotificationService } from '../services/contactNotificationService';
import { masterService } from '../services/masterService';
import type { ContactNotificationDto, CreateResponseRequestDto } from '../types/contactNotification';
import type { StaffDto } from '../types/master';

/**
 * 連絡通知詳細・返信ページ（デスクトップアプリ用）
 */
export function ContactNotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [notification, setNotification] = useState<ContactNotificationDto | null>(null);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 返信フォーム状態
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseType, setResponseType] = useState<'acknowledged' | 'approved' | 'rejected' | 'requires_clarification'>('acknowledged');
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else {
      loadNotificationDetail();
      loadStaffList();
    }
  }, [id]);

  const loadDemoData = () => {
    const demoNotification: ContactNotificationDto = {
      id: 1,
      parentId: 1,
      parentName: '田中 太郎',
      nurseryId: 1,
      childId: 1,
      childName: '田中 花子',
      className: 'さくら組',
      notificationType: 'absence',
      ymd: '2025-10-30',
      expectedArrivalTime: undefined,
      reason: 'illness',
      additionalNotes: '風邪のため欠席します。熱が38度あります。',
      submittedAt: '2025-10-29T20:30:00',
      status: 'submitted',
      staffResponse: undefined,
      acknowledgedAt: undefined,
      acknowledgedBy: undefined,
      acknowledgedByAdminUser: false,
      respondedByStaffId: undefined,
      respondedByStaffName: undefined,
      acknowledgedByAdminAt: undefined,
      latestResponse: undefined,
    };

    const demoStaff: StaffDto[] = [
      {
        staffId: 1,
        name: '山田 先生',
        email: 'yamada@example.com',
        phone: '090-1111-1111',
        isActive: true,
        classAssignments: [],
      },
      {
        staffId: 2,
        name: '佐々木 先生',
        email: 'sasaki@example.com',
        phone: '090-2222-2222',
        isActive: true,
        classAssignments: [],
      },
    ];

    setNotification(demoNotification);
    setStaffList(demoStaff);
    setIsLoading(false);
  };

  const loadNotificationDetail = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await contactNotificationService.getContactNotificationById(parseInt(id));
      setNotification(data);
    } catch (error: any) {
      console.error('連絡通知詳細の取得に失敗:', error);
      setErrorMessage('連絡通知詳細の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffList = async () => {
    try {
      const data = await masterService.getStaff({});
      setStaffList(data);
    } catch (error: any) {
      console.error('職員リストの取得に失敗:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!notification || !selectedStaffId) {
      setErrorMessage('職員を選択してください');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isDemoMode) {
        setNotification({
          ...notification,
          acknowledgedByAdminUser: true,
          acknowledgedByAdminAt: new Date().toISOString(),
          status: 'acknowledged',
          respondedByStaffId: selectedStaffId,
          respondedByStaffName: staffList.find(s => s.staffId === selectedStaffId)?.name,
          staffResponse: responseMessage,
        });
        setSuccessMessage('返信を送信しました');
        setShowResponseForm(false);
        setResponseMessage('');
        setSelectedStaffId(null);
        return;
      }

      const request: CreateResponseRequestDto = {
        responseType,
        responseMessage: responseMessage.trim() || undefined,
        staffId: selectedStaffId,
      };

      await contactNotificationService.createResponse(notification.id, request);
      setSuccessMessage('返信を送信しました');
      setShowResponseForm(false);
      setResponseMessage('');
      setSelectedStaffId(null);
      loadNotificationDetail();
    } catch (error: any) {
      console.error('返信の送信に失敗:', error);
      setErrorMessage('返信の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!notification) return;

    try {
      if (isDemoMode) {
        setNotification({
          ...notification,
          acknowledgedByAdminUser: true,
          acknowledgedByAdminAt: new Date().toISOString(),
          status: 'acknowledged',
        });
        setSuccessMessage('確認済みにしました');
        return;
      }

      await contactNotificationService.acknowledgeNotification(notification.id, {});
      setSuccessMessage('確認済みにしました');
      loadNotificationDetail();
    } catch (error: any) {
      console.error('確認処理に失敗:', error);
      setErrorMessage('確認処理に失敗しました');
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'absence':
        return '欠席';
      case 'lateness':
        return '遅刻';
      case 'pickup':
        return 'お迎え';
      default:
        return type;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'illness':
        return '体調不良';
      case 'appointment':
        return '通院';
      case 'family_event':
        return '家庭の都合';
      case 'other':
        return 'その他';
      default:
        return reason;
    }
  };

  const getResponseTypeLabel = (type: string) => {
    switch (type) {
      case 'acknowledged':
        return '確認しました';
      case 'approved':
        return '承認しました';
      case 'rejected':
        return '承認できません';
      case 'requires_clarification':
        return '追加情報が必要です';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!notification) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">連絡通知が見つかりません</p>
          <button
            onClick={() => navigate('/desktop/contact-notifications')}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            一覧に戻る
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">連絡通知詳細</h1>
            <p className="text-gray-600">保護者からの連絡内容の確認と返信</p>
          </div>
          <button
            onClick={() => navigate('/desktop/contact-notifications')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            一覧に戻る
          </button>
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

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* 連絡通知詳細 */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 mb-6">
          <div className="p-6 space-y-6">
            {/* ステータス */}
            <div className="flex items-center justify-between pb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mr-2">
                  {getNotificationTypeLabel(notification.notificationType)}
                </span>
                {notification.acknowledgedByAdminUser ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    確認済み
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    未確認
                  </span>
                )}
              </div>
              {!notification.acknowledgedByAdminUser && (
                <button
                  onClick={handleAcknowledge}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md"
                >
                  確認済みにする
                </button>
              )}
            </div>

            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">対象日</label>
                <p className="text-gray-900">{new Date(notification.ymd).toLocaleDateString('ja-JP')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">提出日時</label>
                <p className="text-gray-900">
                  {new Date(notification.submittedAt).toLocaleString('ja-JP')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">園児名</label>
                <p className="text-gray-900">
                  {notification.childName}
                  {notification.className && (
                    <span className="ml-2 text-sm text-gray-500">({notification.className})</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">保護者名</label>
                <p className="text-gray-900">{notification.parentName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">理由</label>
                <p className="text-gray-900">{getReasonLabel(notification.reason)}</p>
              </div>
              {notification.expectedArrivalTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">予定時刻</label>
                  <p className="text-gray-900">{notification.expectedArrivalTime}</p>
                </div>
              )}
            </div>

            {/* 備考 */}
            {notification.additionalNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">備考</label>
                <p className="text-gray-900 whitespace-pre-wrap">{notification.additionalNotes}</p>
              </div>
            )}

            {/* 返信情報 */}
            {notification.latestResponse && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">スタッフ返信</label>
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.latestResponse.staffName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.latestResponse.responseAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {getResponseTypeLabel(notification.latestResponse.responseType)}
                    </span>
                  </div>
                  {notification.latestResponse.responseMessage && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {notification.latestResponse.responseMessage}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 返信フォーム */}
        {!showResponseForm ? (
          <div className="flex justify-end">
            <button
              onClick={() => setShowResponseForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg transition-all duration-200"
            >
              返信を作成
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">返信作成</h2>

            <div className="space-y-4">
              {/* 対応職員選択 */}
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                  対応職員 <span className="text-red-500">*</span>
                </label>
                <select
                  id="staffId"
                  value={selectedStaffId ?? ''}
                  onChange={e => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">職員を選択してください</option>
                  {staffList.map(staff => (
                    <option key={staff.staffId} value={staff.staffId}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 返信タイプ */}
              <div>
                <label htmlFor="responseType" className="block text-sm font-medium text-gray-700 mb-2">
                  返信タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  id="responseType"
                  value={responseType}
                  onChange={e => setResponseType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="acknowledged">確認しました</option>
                  <option value="approved">承認しました</option>
                  <option value="rejected">承認できません</option>
                  <option value="requires_clarification">追加情報が必要です</option>
                </select>
              </div>

              {/* 返信メッセージ */}
              <div>
                <label htmlFor="responseMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  返信メッセージ
                </label>
                <textarea
                  id="responseMessage"
                  value={responseMessage}
                  onChange={e => setResponseMessage(e.target.value)}
                  rows={4}
                  placeholder="保護者への返信メッセージを入力してください"
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {responseMessage.length} / 500文字
                </p>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseMessage('');
                    setSelectedStaffId(null);
                  }}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-md font-medium hover:shadow-md"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !selectedStaffId}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '送信中...' : '返信を送信'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
