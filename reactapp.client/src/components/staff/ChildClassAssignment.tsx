import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../desktop/components/layout/DashboardLayout';
import { childClassAssignmentService } from '../../services/childClassAssignmentService';
import { academicYearService } from '../../services/academicYearService';
import type { ClassWithChildren, AvailableChild } from '../../types/childClassAssignment';
import type { AcademicYear } from '../../types/academicYear';

/**
 * クラス別園児割り当て画面
 */
export default function ChildClassAssignment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [nurseryId] = useState(1); // TODO: 実際のnurseryIdを取得
  const [academicYear, setAcademicYear] = useState<number>(new Date().getFullYear() + 1);
  const [futureYears, setFutureYears] = useState<AcademicYear[]>([]);

  const [classes, setClasses] = useState<ClassWithChildren[]>([]);
  const [availableChildren, setAvailableChildren] = useState<AvailableChild[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // フィルター状態
  const [nameFilter, setNameFilter] = useState<string>('');
  const [currentClassFilter, setCurrentClassFilter] = useState<string>('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (academicYear) {
      loadAssignmentData();
    }
  }, [academicYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // 未来年度一覧を取得
      const allYears = await academicYearService.getAcademicYears(nurseryId);
      const futures = allYears.filter(y => y.isFuture);
      setFutureYears(futures);

      if (futures.length > 0) {
        setAcademicYear(futures[0].year);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentData = async (showLoadingScreen: boolean = true) => {
    try {
      if (showLoadingScreen) {
        setLoading(true);
      }
      setError(null);

      const [classesData, childrenData] = await Promise.all([
        childClassAssignmentService.getClassesWithChildren(nurseryId, academicYear),
        childClassAssignmentService.getAvailableChildren(nurseryId, academicYear),
      ]);

      setClasses(classesData);
      setAvailableChildren(childrenData);

      // デバッグ: APIレスポンスの中身を確認
      console.log('=== API Response Debug ===');
      console.log('Classes data:', classesData);
      console.log('Available children data:', childrenData);
      console.log('First child sample:', childrenData[0]);

      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].classId);
      }
    } catch (err) {
      console.error('Failed to load assignment data:', err);
      setError('割り当て情報の取得に失敗しました');
    } finally {
      if (showLoadingScreen) {
        setLoading(false);
      }
    }
  };

  const handleAssignChild = async (childId: number, classId: string) => {
    try {
      setIsOperating(true);
      setError(null);

      await childClassAssignmentService.assignChildToClass({
        academicYear,
        nurseryId,
        childId,
        classId,
      });

      // リロード時は画面を消さない
      await loadAssignmentData(false);
    } catch (err) {
      console.error('Failed to assign child:', err);
      setError('割り当てに失敗しました');
    } finally {
      setIsOperating(false);
    }
  };

  const handleUnassignChild = async (childId: number) => {
    try {
      setIsOperating(true);
      setError(null);

      await childClassAssignmentService.unassignChildFromClass(nurseryId, academicYear, childId);

      // リロード時は画面を消さない
      await loadAssignmentData(false);
    } catch (err) {
      console.error('Failed to unassign child:', err);
      setError('割り当て解除に失敗しました');
    } finally {
      setIsOperating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (futureYears.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">未来年度が設定されていません</h3>
            <p className="text-sm text-yellow-800 mb-4">
              クラス別園児割り当てを行うには、まず未来年度を作成してください。
            </p>
            <button
              onClick={() => navigate('/desktop/academic-years/create')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              未来年度を作成する
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedClass = classes.find(c => c.classId === selectedClassId);

  // 現在のクラス一覧を取得（フィルター用）
  const currentClasses: Array<{ classId: string; className: string }> = [];

  // 未所属の園児がいるかチェック
  const hasUnassigned = availableChildren.some(c => !c.currentClassId || c.currentClassId === '');
  if (hasUnassigned) {
    currentClasses.push({ classId: 'UNASSIGNED', className: '未所属' });
  }

  // クラスIDとクラス名のマップを作成
  const classMap = new Map<string, string>();
  availableChildren.forEach(child => {
    // currentClassIdが存在し、空文字列でない場合のみ追加
    if (child.currentClassId && child.currentClassId !== '' && !classMap.has(child.currentClassId)) {
      classMap.set(child.currentClassId, child.currentClassName || child.currentClassId);
    }
  });

  // デバッグログ
  console.log('Available children:', availableChildren.length);
  console.log('Class map size:', classMap.size);
  console.log('Class map entries:', Array.from(classMap.entries()));

  // マップからクラス一覧を作成
  classMap.forEach((className, classId) => {
    currentClasses.push({ classId, className });
  });

  // クラス名でソート（未所属は先頭に残す）
  const unassignedClass = currentClasses.find(c => c.classId === 'UNASSIGNED');
  const otherClasses = currentClasses.filter(c => c.classId !== 'UNASSIGNED')
    .sort((a, b) => a.className.localeCompare(b.className));
  const sortedCurrentClasses = unassignedClass
    ? [unassignedClass, ...otherClasses]
    : otherClasses;

  console.log('Sorted current classes:', sortedCurrentClasses);

  // フィルタリング処理
  const unassignedChildren = availableChildren
    .filter(c => !c.isAssignedToFuture)
    .filter(c => {
      // 名前フィルター（あいまい検索）
      if (nameFilter && !c.childName.includes(nameFilter)) {
        return false;
      }
      // 現在のクラスフィルター
      if (currentClassFilter) {
        if (currentClassFilter === 'UNASSIGNED') {
          // 未所属フィルター
          if (c.currentClassId && c.currentClassId !== '') {
            return false;
          }
        } else {
          // 通常のクラスフィルター
          if (c.currentClassId !== currentClassFilter) {
            return false;
          }
        }
      }
      return true;
    });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">クラス別園児割り当て</h1>
          <p className="text-sm text-gray-600">
            翌年度のクラスに園児を個別に割り当てます
          </p>
        </div>

        {/* 年度選択 */}
        <div className="mb-6 bg-white rounded-md shadow-md p-4">
          <label htmlFor="yearSelect" className="block text-sm font-medium text-gray-700 mb-2">
            対象年度
          </label>
          <select
            id="yearSelect"
            value={academicYear}
            onChange={(e) => setAcademicYear(parseInt(e.target.value))}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {futureYears.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}年度
              </option>
            ))}
          </select>
        </div>

        {/* メッセージ表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* クラス一覧 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md shadow-md p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-4">クラス一覧</h2>
              <div className="space-y-2">
                {classes.map((classItem) => (
                  <button
                    key={classItem.classId}
                    onClick={() => setSelectedClassId(classItem.classId)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      selectedClassId === classItem.classId
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{classItem.className}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {classItem.assignedCount}名 割り当て済み
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 割り当て済み園児 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md shadow-md p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                {selectedClass?.className || 'クラスを選択'} - 割り当て済み ({selectedClass?.assignedCount || 0}名)
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedClass?.children.map((child) => (
                  <div
                    key={child.childId}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">{child.childName}</div>
                      <div className="text-xs text-gray-600">{child.age}歳 / {child.currentClassName}</div>
                    </div>
                    <button
                      onClick={() => handleUnassignChild(child.childId)}
                      disabled={isOperating}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {isOperating ? '処理中...' : '解除'}
                    </button>
                  </div>
                ))}
                {selectedClass?.children.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    割り当てられている園児はいません
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 未割り当て園児 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md shadow-md p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                未割り当て園児 ({unassignedChildren.length}名)
              </h2>

              {/* フィルター */}
              <div className="mb-4 space-y-3">
                {/* 名前検索 */}
                <div>
                  <label htmlFor="nameFilter" className="block text-xs font-medium text-gray-700 mb-1">
                    園児名で検索
                  </label>
                  <input
                    type="text"
                    id="nameFilter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="例: 田中"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 現在のクラスフィルター */}
                <div>
                  <label htmlFor="currentClassFilter" className="block text-xs font-medium text-gray-700 mb-1">
                    現在のクラス
                  </label>
                  <select
                    id="currentClassFilter"
                    value={currentClassFilter}
                    onChange={(e) => setCurrentClassFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">すべて</option>
                    {sortedCurrentClasses.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* フィルタークリアボタン */}
                {(nameFilter || currentClassFilter) && (
                  <button
                    onClick={() => {
                      setNameFilter('');
                      setCurrentClassFilter('');
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    フィルターをクリア
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedChildren.map((child) => (
                  <div
                    key={child.childId}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">{child.childName}</div>
                      <div className="text-xs text-gray-600">{child.age}歳 / {child.currentClassName}</div>
                    </div>
                    <button
                      onClick={() => handleAssignChild(child.childId, selectedClassId)}
                      disabled={!selectedClassId || isOperating}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {isOperating ? '処理中...' : '追加'}
                    </button>
                  </div>
                ))}
                {unassignedChildren.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    全ての園児が割り当て済みです
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/desktop/academic-years')}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            戻る
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
