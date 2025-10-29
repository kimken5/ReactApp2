import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ClassDto, ClassFilterDto } from '../types/master';

/**
 * クラス一覧ページ
 * クラスの表示・検索・削除を行う
 */
export function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<ClassDto | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<ClassFilterDto>({
    academicYear: new Date().getFullYear(),
    searchKeyword: '',
  });

  // ソート状態
  const [sortField, setSortField] = useState<'name' | 'enrollment'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 初期データ読み込み
  useEffect(() => {
    loadClasses();
  }, []);

  // フィルタ・ソート適用
  useEffect(() => {
    applyFilterAndSort();
  }, [classes, filter, sortField, sortDirection]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // デモモード判定
      const urlParams = new URLSearchParams(window.location.search);
      const isDemoMode = urlParams.get('demo') === 'true';

      if (isDemoMode) {
        // デモデータを設定
        const demoClasses: ClassDto[] = [
          {
            classId: 'sakura-2025',
            name: 'さくら組',
            ageGroupMin: 5,
            ageGroupMax: 6,
            currentEnrollment: 18,
            maxCapacity: 20,
            academicYear: 2025,
            assignedStaffNames: ['田中 花子', '佐藤 太郎'],
            isActive: true,
          },
          {
            classId: 'himawari-2025',
            name: 'ひまわり組',
            ageGroupMin: 4,
            ageGroupMax: 5,
            currentEnrollment: 15,
            maxCapacity: 20,
            assignedStaffNames: ['鈴木 次郎'],
            isActive: true,
          },
          {
            classId: 'sumire-2025',
            name: 'すみれ組',
            ageGroupMin: 3,
            ageGroupMax: 4,
            currentEnrollment: 12,
            maxCapacity: 18,
            assignedStaffNames: ['山田 美咲', '伊藤 健一'],
            isActive: true,
          },
          {
            classId: 'bara-2025',
            name: 'ばら組',
            ageGroupMin: 2,
            ageGroupMax: 3,
            currentEnrollment: 10,
            maxCapacity: 15,
            assignedStaffNames: ['高橋 さくら'],
            isActive: true,
          },
          {
            classId: 'momo-2025',
            name: 'もも組',
            ageGroupMin: 1,
            ageGroupMax: 2,
            currentEnrollment: 8,
            maxCapacity: 12,
            assignedStaffNames: ['渡辺 京子', '中村 優子'],
            isActive: true,
          },
          {
            classId: 'tanpopo-2025',
            name: 'たんぽぽ組',
            ageGroupMin: 0,
            ageGroupMax: 1,
            currentEnrollment: 6,
            maxCapacity: 10,
            assignedStaffNames: ['小林 愛', '加藤 まり'],
            isActive: true,
          },
          {
            classId: 'yuri-2025',
            name: 'ゆり組',
            ageGroupMin: 4,
            ageGroupMax: 5,
            currentEnrollment: 16,
            maxCapacity: 20,
            assignedStaffNames: ['佐々木 明'],
            isActive: true,
          },
          {
            classId: 'tsukushi-2025',
            name: 'つくし組',
            ageGroupMin: 3,
            ageGroupMax: 4,
            currentEnrollment: 14,
            maxCapacity: 18,
            assignedStaffNames: ['松本 由美'],
            isActive: true,
          },
        ];
        setClasses(demoClasses);
      } else {
        const data = await masterService.getClasses();
        setClasses(data);
      }
    } catch (error) {
      console.error('クラス一覧の取得に失敗しました:', error);
      setErrorMessage('クラス一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilterAndSort = () => {
    let filtered = [...classes];

    // フィルタ適用
    if (filter.academicYear) {
      filtered = filtered.filter(c => c.academicYear === filter.academicYear);
    }

    // 論理削除されたクラスは除外（IsActive = true のみ表示）
    filtered = filtered.filter(c => c.isActive === true);

    if (filter.searchKeyword) {
      const keyword = filter.searchKeyword.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.classId.toLowerCase().includes(keyword) ||
          c.name.toLowerCase().includes(keyword) ||
          c.assignedStaffNames.some(name => name.toLowerCase().includes(keyword))
      );
    }

    // ソート適用
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'ja');
      } else if (sortField === 'enrollment') {
        const aRate = a.maxCapacity > 0 ? a.currentEnrollment / a.maxCapacity : 0;
        const bRate = b.maxCapacity > 0 ? b.currentEnrollment / b.maxCapacity : 0;
        comparison = aRate - bRate;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredClasses(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: 'name' | 'enrollment') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (classItem: ClassDto) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await masterService.deleteClass(classItem.classId);
      setSuccessMessage(`クラス「${classItem.name}」を削除しました`);
      setDeleteConfirmClass(null);
      loadClasses();

      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('クラスの削除に失敗しました:', error);
      setErrorMessage('クラスの削除に失敗しました');
      setDeleteConfirmClass(null);
    }
  };

  // 在籍率による色分け
  const getEnrollmentColor = (current: number, max: number): string => {
    if (max === 0) return 'text-gray-500';
    const rate = current / max;
    if (rate >= 0.8) return 'text-red-600 font-semibold';
    if (rate >= 0.5) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  // ページネーション処理
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">クラス管理</h1>
            <p className="text-gray-600 mt-2">クラスの一覧・作成・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/classes/create')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規作成</span>
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* 年度 */}
            <div className="md:col-span-3">
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                年度
              </label>
              <select
                id="academicYear"
                value={filter.academicYear || ''}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    academicYear: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
              >
                <option value="">すべて</option>
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}年度
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 検索キーワード */}
            <div className="md:col-span-6">
              <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
                検索（クラスID・名前・担当職員）
              </label>
              <input
                type="text"
                id="searchKeyword"
                value={filter.searchKeyword || ''}
                onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                placeholder="キーワードを入力"
              />
            </div>

            {/* フィルタリセット */}
            <div className="md:col-span-3">
              <button
                onClick={() => setFilter({
                  academicYear: new Date().getFullYear(),
                  searchKeyword: '',
                })}
                className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium text-sm"
              >
                フィルタをリセット
              </button>
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クラスID
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>クラス名</span>
                      {sortField === 'name' && (
                        <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    対象年齢
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('enrollment')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>在籍数/定員</span>
                      {sortField === 'enrollment' && (
                        <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当職員
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      クラスが見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  currentClasses.map(classItem => (
                    <tr key={classItem.classId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {classItem.classId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classItem.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.ageGroupMin}～{classItem.ageGroupMax}歳
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={getEnrollmentColor(
                            classItem.currentEnrollment,
                            classItem.maxCapacity
                          )}
                        >
                          {classItem.currentEnrollment} / {classItem.maxCapacity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.academicYear}年
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {classItem.assignedStaffNames.length > 0
                          ? classItem.assignedStaffNames.join(', ')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-1">
                          {/* 編集ボタン */}
                          <button
                            onClick={() => navigate(`/desktop/classes/edit/${classItem.classId}`)}
                            className="relative group p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-200"
                            title="編集"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              編集
                            </span>
                          </button>
                          {/* 削除ボタン */}
                          <button
                            onClick={() => setDeleteConfirmClass(classItem)}
                            className="relative group p-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200"
                            title="削除"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                全 {filteredClasses.length} 件中 {startIndex + 1} ～{' '}
                {Math.min(endIndex, filteredClasses.length)} 件を表示
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        currentPage === i + 1
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                          : 'text-gray-700 hover:shadow-md border border-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirmClass && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setDeleteConfirmClass(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">クラスを削除</h3>
              <p className="text-gray-600 mb-6">
                本当にクラス「{deleteConfirmClass.name}」（{deleteConfirmClass.classId}）を削除しますか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmClass(null)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:shadow-md transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmClass)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 hover:shadow-md transition-all duration-200"
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
