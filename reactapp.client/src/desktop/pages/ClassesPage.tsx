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
    isActive: undefined,
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
      const data = await masterService.getClasses();
      setClasses(data);
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

    if (filter.isActive !== undefined) {
      filtered = filtered.filter(c => c.isActive === filter.isActive);
    }

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
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">クラス管理</h1>
            <p className="text-gray-600">クラスの一覧・作成・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/classes/create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:bg-green-800 transition flex items-center space-x-2"
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
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 年度 */}
            <div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

            {/* 有効/無効 */}
            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">
                状態
              </label>
              <select
                id="isActive"
                value={filter.isActive === undefined ? '' : filter.isActive ? 'true' : 'false'}
                onChange={e =>
                  setFilter(prev => ({
                    ...prev,
                    isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">すべて</option>
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>

            {/* 検索キーワード */}
            <div className="md:col-span-2">
              <label htmlFor="searchKeyword" className="block text-sm font-medium text-gray-700 mb-2">
                検索（クラスID・名前・担当職員）
              </label>
              <input
                type="text"
                id="searchKeyword"
                value={filter.searchKeyword || ''}
                onChange={e => setFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="キーワードを入力"
              />
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {classItem.isActive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            有効
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            無効
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => navigate(`/desktop/classes/edit/${classItem.classId}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => setDeleteConfirmClass(classItem)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          削除
                        </button>
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">クラスを削除</h3>
              <p className="text-gray-600 mb-6">
                本当にクラス「{deleteConfirmClass.name}」（{deleteConfirmClass.classId}）を削除しますか？
                <br />
                この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmClass(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmClass)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
