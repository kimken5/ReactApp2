import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { PhotoDetailModal } from '../components/common/PhotoDetailModal';
import { photoService } from '../services/photoService';
import { masterService } from '../services/masterService';
import type { PhotoDto, PhotoFilterDto } from '../types/photo';
import type { ChildDto, ClassDto, StaffDto } from '../types/master';

/**
 * 写真一覧ページ
 * 写真の表示・検索・削除を行う
 */

// Demo data generator
const generateDemoPhotos = (): PhotoDto[] => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  const descriptions = [
    '朝のお遊び時間',
    '給食の様子',
    '外遊びの風景',
    'お昼寝タイム',
    '製作活動',
    '読み聞かせ',
    'リトミック教室',
    'お誕生日会',
    '運動会練習',
    '水遊び',
    '遠足',
    'クリスマス会'
  ];
  const statuses = ['published', 'draft'];
  const visibilityLevels = ['class', 'grade', 'all'];

  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    fileName: `photo_${i + 1}.jpg`,
    filePath: `/photos/photo_${i + 1}.jpg`,
    description: descriptions[i % descriptions.length],
    thumbnailPath: `https://via.placeholder.com/300/${colors[i % colors.length].replace('#', '')}/FFFFFF?text=${encodeURIComponent(descriptions[i % descriptions.length])}`,
    originalFileName: `original_photo_${i + 1}.jpg`,
    fileSize: 1024 * (100 + i * 50),
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    uploadedByStaffId: Math.floor(i / 3) + 1,
    uploadedByStaffName: `田中 ${['花子', '太郎', '次郎', '三郎', '四郎'][Math.floor(i / 3) % 5]}`,
    uploadedAt: new Date(2025, 0, 15 - i, 9, 0).toISOString(),
    publishedAt: new Date(2025, 0, 15 - i).toISOString(),
    status: statuses[i % 2],
    visibilityLevel: visibilityLevels[i % 3],
    viewCount: Math.floor(Math.random() * 100),
    downloadCount: Math.floor(Math.random() * 20),
    isActive: true,
    uploadedByAdminUser: false,
    children: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
      childId: j + 1,
      childName: `園児${j + 1}`,
      isPrimarySubject: j === 0
    }))
  }));
};

const generateDemoChildren = (): ChildDto[] => {
  return Array.from({ length: 8 }, (_, i) => ({
    nurseryId: 1,
    childId: i + 1,
    familyName: `園児${i + 1}`,
    firstName: `太郎`,
    name: `園児${i + 1} 太郎`,
    classId: `class${Math.floor(i / 3) + 1}`,
    className: ['さくら組', 'ひまわり組', 'つき組'][Math.floor(i / 3)],
    dateOfBirth: new Date(2020, i % 12, (i + 1) * 3).toISOString(),
    gender: i % 2 === 0 ? '男' : '女',
    isActive: true,
    noPhoto: false,
    age: 4,
    createdAt: new Date(2024, 3, 1).toISOString(),
    parents: []
  }));
};

const generateDemoClasses = (): ClassDto[] => {
  return [
    { nurseryId: 1, classId: 'class1', name: 'さくら組', ageGroupMin: 4, ageGroupMax: 5, maxCapacity: 20, isActive: true, createdAt: new Date().toISOString(), currentEnrollment: 0, assignedStaffNames: [] },
    { nurseryId: 1, classId: 'class2', name: 'ひまわり組', ageGroupMin: 3, ageGroupMax: 4, maxCapacity: 20, isActive: true, createdAt: new Date().toISOString(), currentEnrollment: 0, assignedStaffNames: [] },
    { nurseryId: 1, classId: 'class3', name: 'つき組', ageGroupMin: 5, ageGroupMax: 6, maxCapacity: 20, isActive: true, createdAt: new Date().toISOString(), currentEnrollment: 0, assignedStaffNames: [] }
  ];
};

const generateDemoStaff = (): StaffDto[] => {
  return Array.from({ length: 5 }, (_, i) => ({
    nurseryId: 1,
    staffId: i + 1,
    name: `田中 ${['花子', '太郎', '次郎', '三郎', '四郎'][i]}`,
    phoneNumber: `090-1234-${(5678 + i).toString().padStart(4, '0')}`,
    email: `staff${i + 1}@example.com`,
    role: '担任',
    isActive: true,
    createdAt: new Date().toISOString(),
    classAssignments: []
  }));
};

export function PhotosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const { state } = useDesktopAuth();

  // 写真機能の利用可否をチェック
  const photoFunctionEnabled = state.nursery?.photoFunction ?? true;

  // 写真機能が無効な場合はアクセス制限
  if (!photoFunctionEnabled && !isDemoMode) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">写真機能は利用できません</h2>
            <p className="text-gray-600">
              この保育園では写真機能が有効になっていません。
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const [photos, setPhotos] = useState<PhotoDto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmPhoto, setDeleteConfirmPhoto] = useState<PhotoDto | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modal state
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // マスタデータ
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [staffList, setStaffList] = useState<StaffDto[]>([]);

  // フィルタ状態
  const [targetGrade, setTargetGrade] = useState<number | null>(null);
  const [filter, setFilter] = useState<PhotoFilterDto>({
    childId: undefined,
    classId: undefined,
    staffId: undefined,
    startDate: undefined,
    endDate: undefined,
    visibilityLevel: undefined,
    status: undefined,
    searchKeyword: '',
  });

  // 日付入力フィールドのref
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // 初期データ読み込み（マスタデータのみ）
  useEffect(() => {
    loadMasterData();
  }, []);

  // フィルタ適用（表示ボタンクリック時のみ）
  useEffect(() => {
    if (hasSearched) {
      applyFilters();
    }
  }, [photos, hasSearched]);

  const loadMasterData = async () => {
    try {
      setErrorMessage(null);

      if (isDemoMode) {
        // Demo mode: Use generated data
        setChildren(generateDemoChildren());
        setClasses(generateDemoClasses());
        setStaffList(generateDemoStaff());
      } else {
        // Real mode: API calls
        const [childrenData, classesData, staffData] = await Promise.all([
          masterService.getChildren(),
          masterService.getClasses(),
          masterService.getStaff(),
        ]);

        setChildren(childrenData);
        setClasses(classesData);
        setStaffList(staffData);
      }
    } catch (err) {
      console.error('マスタデータ読み込みエラー:', err);
      setErrorMessage('マスタデータの読み込みに失敗しました');
    }
  };

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setHasSearched(true);

      if (isDemoMode) {
        // Demo mode: Use generated data
        setTimeout(() => {
          setPhotos(generateDemoPhotos());
          setIsLoading(false);
        }, 500);
      } else {
        // Real mode: API calls
        const photosData = await photoService.getPhotos();
        setPhotos(photosData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrorMessage('データの取得に失敗しました');
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      // APIフィルタが設定されている場合はAPI呼び出し
      const hasApiFilter =
        filter.childId ||
        filter.classId ||
        filter.staffId ||
        filter.startDate ||
        filter.endDate ||
        filter.visibilityLevel ||
        filter.status;

      if (hasApiFilter) {
        const filtered = await photoService.getPhotos(filter);
        setFilteredPhotos(filtered);
      } else {
        // ローカルフィルタ（キーワード検索のみ）
        let filtered = [...photos];

        if (filter.searchKeyword) {
          const keyword = filter.searchKeyword.toLowerCase();
          filtered = filtered.filter(
            photo =>
              photo.uploadedByStaffName.toLowerCase().includes(keyword) ||
              photo.description?.toLowerCase().includes(keyword) ||
              photo.children.some(child => child.childName.toLowerCase().includes(keyword))
          );
        }

        setFilteredPhotos(filtered);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('フィルタの適用に失敗しました:', error);
      setErrorMessage('フィルタの適用に失敗しました');
    }
  };

  const handlePhotoClick = (photo: PhotoDto) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const handlePhotoUpdated = () => {
    // Reload photos after update
    loadPhotos();
  };

  // 日付変更ハンドラ（フィルター処理は実行しない）
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const fieldName = e.target === startDateRef.current ? 'startDate' : 'endDate';
    setFilter(prev => ({ ...prev, [fieldName]: value || undefined }));
  };

  // 日付クリアハンドラ（フィルター処理は実行しない）
  const handleClearDate = (fieldName: 'startDate' | 'endDate') => {
    setFilter(prev => ({ ...prev, [fieldName]: undefined }));
  };

  const handleDelete = async (photo: PhotoDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await photoService.deletePhoto(photo.id);
      setSuccessMessage(`写真を削除しました`);
      setDeleteConfirmPhoto(null);
      loadPhotos();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('写真の削除に失敗しました:', error);
      setErrorMessage('写真の削除に失敗しました');
      setDeleteConfirmPhoto(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            下書き
          </span>
        );
      case 'published':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            公開済み
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            アーカイブ済み
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getVisibilityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'class':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            クラス
          </span>
        );
      case 'grade':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            学年
          </span>
        );
      case 'all':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            全体
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {level}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return dateString.split('T')[0]; // YYYY-MM-DD
  };

  const isPublishedOrArchived = (status: string) => {
    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'published' || lowerStatus === 'archived';
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ページネーション処理
  const totalPages = Math.ceil(filteredPhotos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPhotos = filteredPhotos.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">写真管理</h1>
            <p className="text-gray-600 mt-2">写真の一覧・アップロード・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/photos/upload')}
            className="px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-lg font-medium hover:from-orange-500 hover:to-yellow-500 active:from-orange-600 active:to-yellow-600 transition flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規アップロード</span>
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

        {/* フィルタ */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 公開範囲選択 */}
            <div>
              <label htmlFor="visibilityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                公開範囲
              </label>
              <select
                id="visibilityLevel"
                value={filter.visibilityLevel || ''}
                onChange={e => {
                  const newValue = e.target.value || undefined;
                  setFilter(prev => ({ ...prev, visibilityLevel: newValue, classId: undefined }));
                  setTargetGrade(null);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                <option value="class">クラス</option>
                <option value="grade">学年</option>
                <option value="all">全体</option>
              </select>
            </div>

            {/* 条件付き選択（クラス選択 or 学年選択 or 非活性） */}
            <div>
              <label htmlFor="conditional-select" className="block text-sm font-medium text-gray-700 mb-2">
                {filter.visibilityLevel === 'class'
                  ? 'クラス選択'
                  : filter.visibilityLevel === 'grade'
                  ? '学年選択'
                  : 'ー'}
              </label>
              {filter.visibilityLevel === 'class' ? (
                <select
                  id="conditional-select"
                  value={filter.classId || ''}
                  onChange={e => setFilter(prev => ({ ...prev, classId: e.target.value || undefined }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">すべて</option>
                  {classes.map(classItem => (
                    <option key={classItem.classId} value={classItem.classId}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              ) : filter.visibilityLevel === 'grade' ? (
                <select
                  id="conditional-select"
                  value={targetGrade ?? ''}
                  onChange={e => setTargetGrade(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">すべて</option>
                  <option value="0">0歳児</option>
                  <option value="1">1歳児</option>
                  <option value="2">2歳児</option>
                  <option value="3">3歳児</option>
                  <option value="4">4歳児</option>
                  <option value="5">5歳児</option>
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value=""
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
                  readOnly
                />
              )}
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                {staffList.map(staff => (
                  <option key={staff.staffId} value={staff.staffId}>
                    {staff.name}
                  </option>
                ))}
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
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
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
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
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
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="published">公開済み</option>
              </select>
            </div>
          </div>

          {/* キーワード検索 */}
          <div>
            <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
              キーワード検索
            </label>
            <input
              type="text"
              id="searchKeyword"
              value={filter.searchKeyword || ''}
              onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="職員名、説明、園児名で検索"
            />
          </div>

          {/* 表示ボタン */}
          <div className="flex justify-center mt-6">
            <button
              onClick={loadPhotos}
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

        {/* 写真グリッド */}
        {hasSearched && (
          <>
            {isLoading ? (
              <div className="bg-white rounded-md shadow-md border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {currentPhotos.length === 0 ? (
                <div className="col-span-full bg-white rounded-md shadow-md border border-gray-200 p-12 text-center text-gray-500">
                  写真が見つかりませんでした
                </div>
              ) : (
                currentPhotos.map(photo => (
              <div
                key={photo.id}
                className="bg-white rounded-md shadow-md border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* サムネイル画像 */}
                <div
                  className="relative aspect-square bg-gray-200 cursor-pointer overflow-hidden"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img
                    src={photo.thumbnailPath}
                    alt={photo.description || '写真'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* カード内容 */}
                <div className="p-4">
                  {/* 説明文 */}
                  <p className="text-sm text-gray-900 mb-2 min-h-[40px]">
                    {truncateText(photo.description, 50) || '説明なし'}
                  </p>

                  {/* メタ情報 */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {photo.uploadedByStaffName}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(photo.publishedAt)}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      園児: {photo.children.length}人
                    </div>
                  </div>

                  {/* バッジとアクションボタン */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(photo.status)}
                      {getVisibilityBadge(photo.visibilityLevel)}
                    </div>
                    <div className="flex gap-1">
                    {/* 詳細ボタン */}
                    <button
                      onClick={() => handlePhotoClick(photo)}
                      className="relative group p-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200"
                      title="詳細"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        詳細
                      </span>
                    </button>
                    
                    {/* 削除ボタン */}
                    <button
                      onClick={() => setDeleteConfirmPhoto(photo)}
                      className="relative group p-2 rounded-md border transition-all duration-200 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-md"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        削除
                      </span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>
                ))
              )}
            </div>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="bg-white rounded-md shadow-md border border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  全 {filteredPhotos.length} 件中 {startIndex + 1} ～{' '}
                  {Math.min(endIndex, filteredPhotos.length)} 件を表示
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          currentPage === i + 1
                            ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white'
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
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Detail Modal */}
      <PhotoDetailModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdated={handlePhotoUpdated}
      />

      {/* 削除確認モーダル */}
      {deleteConfirmPhoto && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirmPhoto(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">写真を削除</h3>
              <p className="text-gray-600 mb-6">
                本当にこの写真を削除しますか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmPhoto(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmPhoto)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
