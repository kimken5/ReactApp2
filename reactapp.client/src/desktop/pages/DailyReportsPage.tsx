import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { DailyReportDetailModal } from '../components/DailyReportDetailModal';
import { DailyReportEditModal } from '../components/DailyReportEditModal';
import { dailyReportService } from '../services/dailyReportService';
import { masterService } from '../services/masterService';
import type { DailyReportDto, DailyReportFilterDto } from '../types/dailyReport';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

// Demo data
const DEMO_REPORTS: DailyReportDto[] = [
  {
    id: 101,
    nurseryId: 1,
    childId: 1,
    childName: '山田太郎',
    className: 'ひまわり組',
    staffNurseryId: 1,
    staffId: 1,
    staffName: '佐藤花子',
    reportDate: '2025-10-26T00:00:00',
    reportKind: 'meal',
    title: '給食完食しました',
    content: '今日の給食は全部食べることができました。苦手な野菜も頑張って食べていました。',
    photos: [],
    status: 'Published',
    parentAcknowledged: true,
    createdByAdminUser: false,
    createdAt: '2025-10-26T09:00:00',
    updatedAt: '2025-10-26T09:00:00',
    responseCount: 0,
  },
  {
    id: 102,
    nurseryId: 1,
    childId: 2,
    childName: '鈴木花子',
    className: 'さくら組',
    staffNurseryId: 1,
    staffId: 2,
    staffName: '田中一郎',
    reportDate: '2025-10-26T00:00:00',
    reportKind: 'activity',
    title: 'お絵描きが上手になりました',
    content: 'クレヨンを使って、お母さんとお父さんの絵を描きました。色使いが上手になってきています。',
    photos: [],
    status: 'Published',
    parentAcknowledged: false,
    createdByAdminUser: false,
    createdAt: '2025-10-26T10:30:00',
    updatedAt: '2025-10-26T10:30:00',
    responseCount: 0,
  },
  {
    id: 103,
    nurseryId: 1,
    childId: 3,
    childName: '佐々木次郎',
    className: 'ひまわり組',
    staffNurseryId: 1,
    staffId: 1,
    staffName: '佐藤花子',
    reportDate: '2025-10-25T00:00:00',
    reportKind: 'sleep',
    title: 'お昼寝の様子',
    content: 'お昼寝は2時間ぐっすり眠っていました。起きた後も機嫌が良かったです。',
    photos: [],
    status: 'Published',
    parentAcknowledged: true,
    createdByAdminUser: false,
    createdAt: '2025-10-25T14:30:00',
    updatedAt: '2025-10-25T14:30:00',
    responseCount: 0,
  },
  {
    id: 104,
    nurseryId: 1,
    childId: 1,
    childName: '山田太郎',
    className: 'ひまわり組',
    staffNurseryId: 1,
    staffId: 3,
    staffName: '高橋美咲',
    reportDate: '2025-10-25T00:00:00',
    reportKind: 'health',
    title: '体調について',
    content: '朝少し咳が出ていましたが、日中は元気に過ごしていました。水分補給もしっかりしています。',
    photos: [],
    status: 'Published',
    parentAcknowledged: false,
    createdByAdminUser: false,
    createdAt: '2025-10-25T15:00:00',
    updatedAt: '2025-10-25T15:00:00',
    responseCount: 0,
  },
  {
    id: 105,
    nurseryId: 1,
    childId: 4,
    childName: '中村春子',
    className: 'たんぽぽ組',
    staffNurseryId: 1,
    staffId: 2,
    staffName: '田中一郎',
    reportDate: '2025-10-24T00:00:00',
    reportKind: 'activity',
    title: 'ブロック遊びで集中力発揮',
    content: 'ブロックで大きなお城を作りました。30分以上集中して取り組んでいて、完成度も高かったです。',
    photos: [],
    status: 'Published',
    parentAcknowledged: true,
    createdByAdminUser: false,
    createdAt: '2025-10-24T11:00:00',
    updatedAt: '2025-10-24T11:00:00',
    responseCount: 0,
  },
  {
    id: 106,
    nurseryId: 1,
    childId: 2,
    childName: '鈴木花子',
    className: 'さくら組',
    staffNurseryId: 1,
    staffId: 1,
    staffName: '佐藤花子',
    reportDate: '2025-10-24T00:00:00',
    reportKind: 'behavior',
    title: 'トイレトレーニング順調',
    content: 'トイレに自分から行けるようになりました。今日は失敗なく過ごせました。',
    photos: [],
    status: 'Draft',
    parentAcknowledged: false,
    createdByAdminUser: false,
    createdAt: '2025-10-24T13:30:00',
    updatedAt: '2025-10-24T13:30:00',
    responseCount: 0,
  },
  {
    id: 107,
    nurseryId: 1,
    childId: 5,
    childName: '小林優斗',
    className: 'ひまわり組',
    staffNurseryId: 1,
    staffId: 3,
    staffName: '高橋美咲',
    reportDate: '2025-10-23T00:00:00',
    reportKind: 'meal',
    title: '野菜を頑張って食べました',
    content: 'ピーマンが苦手でしたが、小さく切ってあげると全部食べることができました。',
    photos: [],
    status: 'Published',
    parentAcknowledged: true,
    createdByAdminUser: false,
    createdAt: '2025-10-23T12:00:00',
    updatedAt: '2025-10-23T12:00:00',
    responseCount: 0,
  },
  {
    id: 108,
    nurseryId: 1,
    childId: 3,
    childName: '佐々木次郎',
    className: 'ひまわり組',
    staffNurseryId: 1,
    staffId: 2,
    staffName: '田中一郎',
    reportDate: '2025-10-23T00:00:00',
    reportKind: 'behavior',
    title: 'お友達と仲良く遊びました',
    content: 'お友達と砂場で遊び、協力して大きな山を作りました。仲良く遊べていました。',
    photos: [],
    status: 'Draft',
    parentAcknowledged: false,
    createdByAdminUser: false,
    createdAt: '2025-10-23T16:00:00',
    updatedAt: '2025-10-23T16:00:00',
    responseCount: 0,
  },
];

const DEMO_CHILDREN: ChildDto[] = [
  { childId: 1, name: '山田太郎', classId: 'C1', className: 'ひまわり組', grade: 'Pre-K', dateOfBirth: '2020-04-15', gender: 'Male', allergies: [] },
  { childId: 2, name: '鈴木花子', classId: 'C2', className: 'さくら組', grade: 'K1', dateOfBirth: '2021-05-20', gender: 'Female', allergies: [] },
  { childId: 3, name: '佐々木次郎', classId: 'C1', className: 'ひまわり組', grade: 'Pre-K', dateOfBirth: '2020-06-10', gender: 'Male', allergies: [] },
  { childId: 4, name: '中村春子', classId: 'C3', className: 'たんぽぽ組', grade: 'K2', dateOfBirth: '2019-08-25', gender: 'Female', allergies: [] },
  { childId: 5, name: '小林優斗', classId: 'C1', className: 'ひまわり組', grade: 'Pre-K', dateOfBirth: '2020-09-12', gender: 'Male', allergies: [] },
];

const DEMO_CLASSES: ClassDto[] = [
  { classId: 'C1', name: 'ひまわり組', grade: 'Pre-K', academicYear: '2025' },
  { classId: 'C2', name: 'さくら組', grade: 'K1', academicYear: '2025' },
  { classId: 'C3', name: 'たんぽぽ組', grade: 'K2', academicYear: '2025' },
];

const DEMO_STAFF: StaffDto[] = [
  { staffId: 1, name: '佐藤花子', role: 'Teacher', assignedClasses: ['C1'] },
  { staffId: 2, name: '田中一郎', role: 'Teacher', assignedClasses: ['C2', 'C3'] },
  { staffId: 3, name: '高橋美咲', role: 'Assistant', assignedClasses: ['C1'] },
];

/**
 * 日報一覧ページ
 * 日報の表示・検索・削除・公開を行う
 */
export function DailyReportsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const { state } = useDesktopAuth();
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true; // 写真機能の利用可否

  const [reports, setReports] = useState<DailyReportDto[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmReport, setDeleteConfirmReport] = useState<DailyReportDto | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // モーダル状態
  const [detailModalReportId, setDetailModalReportId] = useState<number | null>(null);
  const [editModalReportId, setEditModalReportId] = useState<number | null>(null);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // フィルタ状態
  const [filter, setFilter] = useState<DailyReportFilterDto>({
    childId: undefined,
    classId: undefined,
    staffId: undefined,
    startDate: undefined,
    endDate: undefined,
    category: undefined,
    status: undefined,
    parentAcknowledged: undefined,
    searchKeyword: '',
  });

  // 日付入力フィールドのref
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 初期データ読み込み（マスタデータのみ）
  useEffect(() => {
    loadMasterData();
  }, [isDemoMode]);

  const loadMasterData = async () => {
    try {
      if (isDemoMode) {
        // Demo mode: use static data
        setChildren(DEMO_CHILDREN);
        setClasses(DEMO_CLASSES);
        setStaffList(DEMO_STAFF);
      } else {
        // Production mode: fetch from API
        const [childrenData, classesData, staffData] = await Promise.all([
          masterService.getChildren(),
          masterService.getClasses(),
          masterService.getStaff(),
        ]);

        setChildren(childrenData);
        setClasses(classesData);
        setStaffList(staffData);
      }
    } catch (error) {
      console.error('マスタデータの取得に失敗しました:', error);
      setErrorMessage('マスタデータの取得に失敗しました');
    }
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setCurrentPage(1); // フィルター実行時にページ番号を1にリセット

      if (isDemoMode) {
        // Demo mode: client-side filtering
        let filtered = [...DEMO_REPORTS];

        if (filter.childId) {
          filtered = filtered.filter(r => r.childId === filter.childId);
        }
        if (filter.classId) {
          filtered = filtered.filter(r => r.className === filter.classId);
        }
        if (filter.staffId) {
          filtered = filtered.filter(r => r.staffId === filter.staffId);
        }
        if (filter.reportKind) {
          // フィルターで選択された種別（カンマ区切り）
          const filterKinds = filter.reportKind.split(',').map(k => k.trim());
          filtered = filtered.filter(r => {
            // レポートの種別（カンマ区切りの可能性あり）
            const reportKinds = r.reportKind.split(',').map(k => k.trim());
            // フィルター種別のいずれかがレポート種別に含まれているか
            return filterKinds.some(fk => reportKinds.includes(fk));
          });
        }
        if (filter.status) {
          filtered = filtered.filter(r => r.status === filter.status);
        }
        if (filter.hasPhoto !== undefined) {
          filtered = filtered.filter(r =>
            filter.hasPhoto
              ? r.photos && r.photos.length > 0
              : !r.photos || r.photos.length === 0
          );
        }
        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filtered = filtered.filter(
            r =>
              r.title.toLowerCase().includes(keyword) ||
              r.content.toLowerCase().includes(keyword) ||
              r.childName.toLowerCase().includes(keyword) ||
              r.staffName.toLowerCase().includes(keyword)
          );
        }

        setFilteredReports(filtered);
        setHasSearched(true);
      } else {
        // Production mode: API filtering
        const filtered = await dailyReportService.getDailyReports(filter);
        console.log('=== API Response ===');
        console.log('Filter sent:', filter);
        console.log('Results count:', filtered.length);
        console.log('Results:', filtered.map(r => ({ id: r.id, reportKind: r.reportKind, title: r.title })));
        setFilteredReports(filtered);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('日報の取得に失敗しました:', error);
      setErrorMessage('日報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 日付変更ハンドラ（フォーカスセット付き）
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const fieldName = e.target === startDateRef.current ? 'startDate' : 'endDate';
    setFilter(prev => ({ ...prev, [fieldName]: value || undefined }));
    // カレンダーで日付を選択した後、フォーカスをセット
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };

  // 日付クリアハンドラ
  const handleClearDate = (fieldName: 'startDate' | 'endDate') => {
    setFilter(prev => ({ ...prev, [fieldName]: undefined }));
    // クリア後、対応する入力フィールドにフォーカスをセット
    setTimeout(() => {
      if (fieldName === 'startDate' && startDateRef.current) {
        startDateRef.current.focus();
      } else if (fieldName === 'endDate' && endDateRef.current) {
        endDateRef.current.focus();
      }
    }, 0);
  };

  const handleDelete = async (report: DailyReportDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await dailyReportService.deleteDailyReport(report.id);
      setSuccessMessage(`日報「${report.title}」を削除しました`);
      setDeleteConfirmReport(null);
      loadReports();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('日報の削除に失敗しました:', error);
      setErrorMessage('日報の削除に失敗しました');
      setDeleteConfirmReport(null);
    }
  };

  const handlePublish = async (report: DailyReportDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await dailyReportService.publishDailyReport(report.id);
      setSuccessMessage(`日報「${report.title}」を公開しました`);
      loadReports();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('日報の公開に失敗しました:', error);
      setErrorMessage('日報の公開に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            下書き
          </span>
        );
      case 'published':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
            送信済み
          </span>
        );
      case 'archived':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            アーカイブ済み
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getReportKindLabel = (reportKind: string) => {
    const kindMap: Record<string, string> = {
      'activity': '活動',
      'meal': '食事',
      'sleep': '睡眠',
      'health': '健康',
      'incident': '事故',
      'behavior': '行動',
    };

    // カンマ区切りの場合は分割して変換
    const kinds = reportKind.split(',').filter(k => k.trim());
    return kinds.map(k => kindMap[k.trim()] || k).join(', ');
  };

  const getAcknowledgedBadge = (acknowledged: boolean) => {
    return acknowledged ? (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
        確認済み
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
        未確認
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return dateString.split('T')[0]; // YYYY-MM-DD
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

  const isDraft = (status: string) => {
    return status.toLowerCase() === 'draft';
  };

  // ページネーション処理
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Demo mode badge */}
        {isDemoMode && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            デモモード: サンプルデータを表示しています
          </div>
        )}

        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">レポート管理</h1>
            <p className="text-gray-600 mt-2">レポートの一覧・作成・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/dailyreports/create')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-yellow-600 active:from-orange-700 active:to-yellow-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規作成</span>
          </button>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center shadow-sm">
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center shadow-sm">
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

        {/* フィルタ */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* クラス選択 */}
            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                クラス選択
              </label>
              <select
                id="classId"
                value={filter.classId || ''}
                onChange={e => {
                  setFilter(prev => ({
                    ...prev,
                    classId: e.target.value || undefined,
                    childId: undefined // クラス変更時に園児選択をリセット
                  }));
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                {classes.map(classItem => (
                  <option key={classItem.classId} value={classItem.classId}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 園児選択 */}
            <div>
              <label htmlFor="childId" className="block text-sm font-medium text-gray-700 mb-2">
                園児選択
              </label>
              <select
                id="childId"
                value={filter.childId || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    childId: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                disabled={!filter.classId}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">すべて</option>
                {children
                  .filter(child => !filter.classId || child.classId === filter.classId)
                  .map(child => (
                    <option key={child.childId} value={child.childId}>
                      {child.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 職員選択 */}
            <div>
              <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-2">
                職員選択
              </label>
              <select
                id="staffId"
                value={filter.staffId || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    staffId: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                {staffList.map(staff => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            {/* レポート種別選択 */}
            <div>
              <label htmlFor="reportKind" className="block text-sm font-medium text-gray-700 mb-2">
                レポート種別
              </label>
              <select
                id="reportKind"
                value={filter.reportKind || ''}
                onChange={e => setFilter(prev => ({ ...prev, reportKind: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                <option value="activity">活動</option>
                <option value="meal">食事</option>
                <option value="sleep">睡眠</option>
                <option value="health">健康</option>
                <option value="incident">事故</option>
                <option value="behavior">行動</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 開始日 */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <div className="relative">
                <input
                  ref={startDateRef}
                  type="date"
                  id="startDate"
                  value={filter.startDate || ''}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                />
                {filter.startDate && (
                  <button
                    type="button"
                    onClick={() => handleClearDate('startDate')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="クリア"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 終了日 */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <div className="relative">
                <input
                  ref={endDateRef}
                  type="date"
                  id="endDate"
                  value={filter.endDate || ''}
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                />
                {filter.endDate && (
                  <button
                    type="button"
                    onClick={() => handleClearDate('endDate')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="クリア"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ステータス選択 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス選択
              </label>
              <select
                id="status"
                value={filter.status || ''}
                onChange={e => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="published">送信済み</option>
              </select>
            </div>

            {/* 保護者確認 */}
            <div>
              <label htmlFor="parentAcknowledged" className="block text-sm font-medium text-gray-700 mb-2">
                保護者確認
              </label>
              <select
                id="parentAcknowledged"
                value={
                  filter.parentAcknowledged === undefined
                    ? ''
                    : filter.parentAcknowledged
                      ? 'true'
                      : 'false'
                }
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    parentAcknowledged:
                      e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              >
                <option value="">すべて</option>
                <option value="true">確認済み</option>
                <option value="false">未確認</option>
              </select>
            </div>
          </div>

          {/* 写真・キーワード検索 */}
          <div className={`grid gap-4 ${photoFunctionEnabled ? 'grid-cols-4' : 'grid-cols-1'}`}>
            {/* 写真フィルター - 写真機能が有効な場合のみ表示 */}
            {photoFunctionEnabled && (
              <div>
                <label htmlFor="hasPhoto" className="block text-sm font-medium text-gray-700 mb-2">
                  写真
                </label>
                <select
                  id="hasPhoto"
                  value={
                    filter.hasPhoto === undefined
                      ? ''
                      : filter.hasPhoto
                        ? 'true'
                        : 'false'
                  }
                  onChange={e =>
                    setFilter(prev => ({
                      ...prev,
                      hasPhoto:
                        e.target.value === '' ? undefined : e.target.value === 'true',
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                >
                  <option value="">すべて</option>
                  <option value="true">有</option>
                  <option value="false">－</option>
                </select>
              </div>
            )}

            {/* キーワード検索 */}
            <div className={photoFunctionEnabled ? 'col-span-3' : ''}>
              <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                id="searchKeyword"
                value={filter.searchKeyword || ''}
                onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
                placeholder="園児名、職員名、タイトル、内容で検索"
              />
            </div>
          </div>

          {/* 表示ボタン */}
          <div className="flex justify-center mt-6">
            <button
              onClick={loadReports}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  読み込み中...
                </>
              ) : (
                '表示'
              )}
            </button>
          </div>
        </div>

        {/* テーブル */}
        {hasSearched && (
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    園児名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    職員名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    レポート種別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  {photoFunctionEnabled && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      写真
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保護者確認
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      日報が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  currentReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const date = new Date(report.reportDate);
                          const yy = String(date.getFullYear()).slice(-2);
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          return `${yy}/${mm}/${dd}`;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.childName}
                        {report.className && (
                          <span className="text-gray-500"> ({report.className})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.staffName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getReportKindLabel(report.reportKind)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{report.title}</td>
                      {photoFunctionEnabled && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {report.photos && report.photos.length > 0 ? '有' : 'ー'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAcknowledgedBadge(report.parentAcknowledged)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-1">
                          {/* 詳細ボタン */}
                          <button
                            onClick={() => setDetailModalReportId(report.id)}
                            className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                            title="詳細"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              詳細
                            </span>
                          </button>

                          {/* 編集ボタン */}
                          <button
                            onClick={() => setEditModalReportId(report.id)}
                            className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                            title="編集"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              編集
                            </span>
                          </button>

                          {/* 削除ボタン */}
                          <button
                            onClick={() => setDeleteConfirmReport(report)}
                            className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                            title="削除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              削除
                            </span>
                          </button>

                          {/* 送信ボタン */}
                          {isDraft(report.status) && (
                            <button
                              onClick={() => handlePublish(report)}
                              className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                              title="送信"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                送信
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                全 {filteredReports.length} 件中 {startIndex + 1} ～{' '}
                {Math.min(endIndex, filteredReports.length)} 件を表示
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  前へ
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirmReport && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDeleteConfirmReport(null)}
          />

          {/* モーダル */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-300 max-w-md w-full overflow-hidden">
              {/* ヘッダー */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                <h3 className="text-lg font-semibold text-gray-900">レポートを削除</h3>
              </div>

              {/* コンテンツ */}
              <div className="px-6 py-6">
                <p className="text-gray-600 mb-6">
                  本当にレポート「{deleteConfirmReport.title}」を削除しますか？
                  <br />
                  この操作は取り消せません。
                </p>

                {/* ボタン */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirmReport(null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmReport)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    削除する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 詳細モーダル */}
      {detailModalReportId && (
        <DailyReportDetailModal
          reportId={detailModalReportId}
          onClose={() => setDetailModalReportId(null)}
          onEdit={(reportId) => {
            setDetailModalReportId(null);
            setEditModalReportId(reportId);
          }}
        />
      )}

      {/* 編集モーダル */}
      {editModalReportId && (
        <DailyReportEditModal
          reportId={editModalReportId}
          onClose={() => setEditModalReportId(null)}
          onSuccess={() => {
            setEditModalReportId(null);
            loadReports();
            setSuccessMessage('日報を更新しました');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </DashboardLayout>
  );
}
