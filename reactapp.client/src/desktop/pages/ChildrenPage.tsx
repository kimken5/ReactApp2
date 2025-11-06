import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ChildDto, ClassDto } from '../types/master';

// デモデータ生成
const generateDemoData = (): ChildDto[] => {
  const names = [
    '佐藤 花子', '鈴木 太郎', '高橋 美咲', '田中 健太', '渡辺 結衣',
    '伊藤 蓮', '山本 あかり', '中村 大輝', '小林 さくら', '加藤 陽向',
    '吉田 心春', '山田 颯太', '佐々木 陽菜', '山口 悠真', '松本 愛莉',
    '井上 樹', '木村 莉子', '林 颯人', '清水 凛', '山崎 奏太'
  ];
  const furiganas = [
    'さとう はなこ', 'すずき たろう', 'たかはし みさき', 'たなか けんた', 'わたなべ ゆい',
    'いとう れん', 'やまもと あかり', 'なかむら だいき', 'こばやし さくら', 'かとう ひなた',
    'よしだ こはる', 'やまだ そうた', 'ささき ひな', 'やまぐち ゆうま', 'まつもと あいり',
    'いのうえ いつき', 'きむら りこ', 'はやし はやと', 'しみず りん', 'やまざき そうた'
  ];
  const classes = [
    { id: 1, name: 'さくら組' },
    { id: 2, name: 'ひまわり組' },
    { id: 3, name: 'すみれ組' },
    { id: 4, name: 'ばら組' },
    { id: 5, name: 'もも組' },
    { id: 6, name: 'たんぽぽ組' }
  ];
  const bloodTypes = ['A', 'B', 'O', 'AB'];

  return names.map((name, index) => {
    const age = Math.floor(Math.random() * 7); // 0-6歳
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const selectedClass = classes[index % classes.length];
    const gender = index % 2 === 0 ? 'Female' : 'Male';
    const parentName = gender === 'Female' ? name.split(' ')[0] + ' 母' : name.split(' ')[0] + ' 父';

    return {
      childId: index + 1,
      name,
      furigana: furiganas[index],
      dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      gender,
      classId: selectedClass.id,
      className: selectedClass.name,
      bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
      isActive: true,
      graduationStatus: 'Active',
      parents: [
        {
          parentId: index + 1,
          name: parentName,
          phoneNumber: `090-1234-${String(5678 + index).padStart(4, '0')}`,
          email: `parent${index + 1}@example.com`,
          relationship: gender === 'Female' ? 'Mother' : 'Father',
          isEmergencyContact: true,
          isPrimaryContact: true
        }
      ]
    };
  });
};

/**
 * 園児一覧ページ
 * 園児の一覧表示・検索・フィルタ・削除機能を提供
 */
export function ChildrenPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 日付入力フィールドのref
  const graduationDateFromRef = useRef<HTMLInputElement>(null);
  const graduationDateToRef = useRef<HTMLInputElement>(null);
  const dateOfBirthFromRef = useRef<HTMLInputElement>(null);
  const dateOfBirthToRef = useRef<HTMLInputElement>(null);

  // フィルタ状態
  const [filters, setFilters] = useState({
    classId: '',
    graduationStatus: 'Active',
    searchKeyword: '',
    graduationDateFrom: '',
    graduationDateTo: '',
    dateOfBirthFrom: '',
    dateOfBirthTo: '',
  });

  // デモデータ
  const demoChildren = useMemo(() => generateDemoData(), []);

  // 初期データ読み込み
  useEffect(() => {
    if (isDemoMode) {
      // デモモード: デモデータを使用
      setChildren(demoChildren);
      setClasses([
        { classId: 1, name: 'さくら組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        { classId: 2, name: 'ひまわり組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        { classId: 3, name: 'すみれ組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        { classId: 4, name: 'ばら組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        { classId: 5, name: 'もも組', gradeLevel: 'Nursery', capacity: 20, isActive: true },
        { classId: 6, name: 'たんぽぽ組', gradeLevel: 'Nursery', capacity: 20, isActive: true }
      ]);
      setIsLoading(false);
    } else {
      loadData();
    }
  }, [filters.classId, filters.graduationStatus, isDemoMode, demoChildren]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const filterParams = {
        classId: filters.classId || undefined,
        graduationStatus: filters.graduationStatus ? filters.graduationStatus : undefined,
        searchKeyword: filters.searchKeyword || undefined,
        graduationDateFrom: filters.graduationDateFrom || undefined,
        graduationDateTo: filters.graduationDateTo || undefined,
        dateOfBirthFrom: filters.dateOfBirthFrom || undefined,
        dateOfBirthTo: filters.dateOfBirthTo || undefined,
      };

      console.log('=== 園児一覧取得 フィルターパラメータ ===', filterParams);

      const [childrenData, classesData] = await Promise.all([
        masterService.getChildren(filterParams),
        masterService.getClasses({ isActive: true }),
      ]);

      console.log('=== 園児一覧取得 結果 ===', childrenData.length, '件');

      setChildren(childrenData);
      setClasses(classesData);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setErrorMessage('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタ変更ハンドラ
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 日付フィルタ変更ハンドラ
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // カレンダーで日付を選択した後、フォーカスをセット
    setTimeout(() => {
      e.target.focus();
    }, 0);
  };

  // 日付フィールドクリアハンドラ
  const handleClearDate = (fieldName: string) => {
    setFilters(prev => ({ ...prev, [fieldName]: '' }));
    // クリア後、対応する入力フィールドにフォーカスをセット
    setTimeout(() => {
      const refMap: { [key: string]: React.RefObject<HTMLInputElement> } = {
        graduationDateFrom: graduationDateFromRef,
        graduationDateTo: graduationDateToRef,
        dateOfBirthFrom: dateOfBirthFromRef,
        dateOfBirthTo: dateOfBirthToRef,
      };
      const ref = refMap[fieldName];
      if (ref?.current) {
        ref.current.focus();
      }
    }, 0);
  };

  const handleSearchKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, searchKeyword: value }));
    // 検索キーワードの変更では自動検索しない
  };

  const handleSearchKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isDemoMode) {
        loadData();
      }
    }
  };

  // 日付入力のEnterキーハンドラ（手入力時のトリガー用）
  const handleDateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // 手入力時はEnterキーでフィルターを実行
      if (!isDemoMode) {
        loadData();
      }
    }
  };

  // フィルタリセット
  const handleResetFilters = async () => {
    const resetFilters = {
      classId: '',
      graduationStatus: 'Active',
      searchKeyword: '',
      graduationDateFrom: '',
      graduationDateTo: '',
      dateOfBirthFrom: '',
      dateOfBirthTo: '',
    };
    setFilters(resetFilters);

    // リセット後、すぐにフィルター検索を実行
    if (!isDemoMode) {
      try {
        setIsLoading(true);

        const filterParams = {
          classId: resetFilters.classId || undefined,
          graduationStatus: resetFilters.graduationStatus ? resetFilters.graduationStatus : undefined,
          searchKeyword: resetFilters.searchKeyword || undefined,
          graduationDateFrom: resetFilters.graduationDateFrom || undefined,
          graduationDateTo: resetFilters.graduationDateTo || undefined,
          dateOfBirthFrom: resetFilters.dateOfBirthFrom || undefined,
          dateOfBirthTo: resetFilters.dateOfBirthTo || undefined,
        };

        console.log('=== フィルターリセット後の検索 ===', filterParams);

        const [childrenData, classesData] = await Promise.all([
          masterService.getChildren(filterParams),
          masterService.getClasses({ isActive: true }),
        ]);

        setChildren(childrenData);
        setClasses(classesData);
      } catch (error) {
        console.error('フィルターリセット後のデータ取得に失敗しました:', error);
        alert('データの取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 削除ハンドラ
  const handleDelete = async (child: ChildDto) => {
    if (!confirm(`${child.name}を削除してもよろしいですか？この操作は取り消せません。`)) {
      return;
    }

    try {
      await masterService.deleteChild(child.childId);
      setSuccessMessage(`${child.name}を削除しました`);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('削除に失敗しました:', error);
      setErrorMessage('削除に失敗しました');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 年齢計算
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 性別表示
  const getGenderLabel = (gender: string): string => {
    return gender === 'Male' ? '男' : gender === 'Female' ? '女' : '不明';
  };

  // ステータスバッジ
  const StatusBadge = ({ child }: { child: ChildDto }) => {
    if (!child.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">無効</span>;
    }
    if (child.graduationStatus === 'Graduated') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">卒園済み</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">在籍中</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">園児管理</h1>
            <p className="text-gray-600 mt-2">園児の一覧・作成・編集・削除</p>
          </div>
          <button
            onClick={() => navigate('/desktop/children/create')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
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

        {/* フィルタ・検索バー */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 検索キーワード */}
            <div>
              <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                id="searchKeyword"
                name="searchKeyword"
                value={filters.searchKeyword}
                onChange={handleSearchKeywordChange}
                onKeyDown={handleSearchKeywordKeyDown}
                placeholder="氏名で検索（ENTERキーで検索）"
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* クラスフィルタ */}
            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
                クラス
              </label>
              <select
                id="classId"
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                {classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 卒園ステータスフィルタ */}
            <div>
              <label htmlFor="graduationStatus" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                id="graduationStatus"
                name="graduationStatus"
                value={filters.graduationStatus}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">すべて</option>
                <option value="Active">在籍中</option>
                <option value="Graduated">卒園済み</option>
                <option value="Withdrawn">退園</option>
              </select>
            </div>
          </div>

          {/* 日付フィルタ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-end">
            {/* 卒園日フィルタ */}
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                卒園日
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={graduationDateFromRef}
                    type="date"
                    id="graduationDateFrom"
                    name="graduationDateFrom"
                    value={filters.graduationDateFrom}
                    onChange={handleDateFilterChange}
                    onKeyDown={handleDateInputKeyDown}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                  {filters.graduationDateFrom && (
                    <button
                      type="button"
                      onClick={() => handleClearDate('graduationDateFrom')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="クリア"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <span className="text-gray-500">〜</span>
                <div className="flex-1 relative">
                  <input
                    ref={graduationDateToRef}
                    type="date"
                    id="graduationDateTo"
                    name="graduationDateTo"
                    value={filters.graduationDateTo}
                    onChange={handleDateFilterChange}
                    onKeyDown={handleDateInputKeyDown}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                  {filters.graduationDateTo && (
                    <button
                      type="button"
                      onClick={() => handleClearDate('graduationDateTo')}
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
            </div>

            {/* 生年月日フィルタ */}
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生年月日
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={dateOfBirthFromRef}
                    type="date"
                    id="dateOfBirthFrom"
                    name="dateOfBirthFrom"
                    value={filters.dateOfBirthFrom}
                    onChange={handleDateFilterChange}
                    onKeyDown={handleDateInputKeyDown}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                  {filters.dateOfBirthFrom && (
                    <button
                      type="button"
                      onClick={() => handleClearDate('dateOfBirthFrom')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="クリア"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <span className="text-gray-500">〜</span>
                <div className="flex-1 relative">
                  <input
                    ref={dateOfBirthToRef}
                    type="date"
                    id="dateOfBirthTo"
                    name="dateOfBirthTo"
                    value={filters.dateOfBirthTo}
                    onChange={handleDateFilterChange}
                    onKeyDown={handleDateInputKeyDown}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                  {filters.dateOfBirthTo && (
                    <button
                      type="button"
                      onClick={() => handleClearDate('dateOfBirthTo')}
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
            </div>

            {/* フィルタリセット */}
            <div className="md:col-span-2">
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium text-sm"
              >
                フィルタをリセット
              </button>
            </div>
          </div>
        </div>

        {/* テーブル表示 */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ふりがな
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生年月日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    性別
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    血液型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    卒園日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {children.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      園児が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  children
                    .sort((a, b) => {
                      // まずクラス名で年齢の小さい方から昇順（実際のクラスIDで）
                      if (a.classId !== b.classId) {
                        return a.classId - b.classId;
                      }
                      // 次に生年月日の降順（新しい方が先）
                      return new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime();
                    })
                    .map(child => (
                    <tr key={child.childId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {child.name} ({calculateAge(child.dateOfBirth)}歳)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.furigana || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(child.dateOfBirth).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getGenderLabel(child.gender)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.bloodType || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.graduationDate ? new Date(child.graduationDate).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge child={child} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {String(child.childId).padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-1">
                          {/* 編集ボタン */}
                          <button
                            onClick={() => navigate(`/desktop/children/edit/${child.childId}`)}
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
                            onClick={() => handleDelete(child)}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
