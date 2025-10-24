import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { ChildDto, ClassDto } from '../types/master';

/**
 * 園児一覧ページ
 * 園児の一覧表示・検索・フィルタ・削除機能を提供
 */
export function ChildrenPage() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // フィルタ状態
  const [filters, setFilters] = useState({
    classId: '',
    graduationStatus: '',
    isActive: '',
    searchKeyword: '',
  });

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [childrenData, classesData] = await Promise.all([
        masterService.getChildren({
          classId: filters.classId || undefined,
          graduationStatus: filters.graduationStatus || undefined,
          isActive: filters.isActive ? filters.isActive === 'true' : undefined,
          searchKeyword: filters.searchKeyword || undefined,
        }),
        masterService.getClasses({ isActive: true }),
      ]);
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

  // フィルタリセット
  const handleResetFilters = () => {
    setFilters({
      classId: '',
      graduationStatus: '',
      isActive: '',
      searchKeyword: '',
    });
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">園児管理</h1>
            <p className="text-gray-600">園児の一覧・作成・編集・削除</p>
          </div>
          <button
            onClick={() => navigate('/desktop/children/create')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition"
          >
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                onChange={handleFilterChange}
                placeholder="氏名で検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                卒園ステータス
              </label>
              <select
                id="graduationStatus"
                name="graduationStatus"
                value={filters.graduationStatus}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">すべて</option>
                <option value="Active">在籍中</option>
                <option value="Graduated">卒園済み</option>
              </select>
            </div>

            {/* 有効/無効フィルタ */}
            <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">
                有効/無効
              </label>
              <select
                id="isActive"
                name="isActive"
                value={filters.isActive}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">すべて</option>
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>
          </div>

          {/* フィルタリセット・表示切替 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleResetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              フィルタをリセット
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'card'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                カード表示
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                テーブル表示
              </button>
            </div>
          </div>
        </div>

        {/* 件数表示 */}
        <div className="mb-4 text-sm text-gray-600">
          {children.length}件の園児
        </div>

        {/* カード表示 */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map(child => (
              <div key={child.childId} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="p-6">
                  {/* ヘッダー: 氏名とステータス */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                      <p className="text-sm text-gray-500">ID: {child.childId}</p>
                    </div>
                    <StatusBadge child={child} />
                  </div>

                  {/* 詳細情報 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">年齢:</span>
                      <span className="font-medium text-gray-800">{calculateAge(child.dateOfBirth)}歳</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">性別:</span>
                      <span className="font-medium text-gray-800">{getGenderLabel(child.gender)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">クラス:</span>
                      <span className="font-medium text-gray-800">{child.className || '未所属'}</span>
                    </div>
                    {child.bloodType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">血液型:</span>
                        <span className="font-medium text-gray-800">{child.bloodType}型</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">保護者:</p>
                      <p className="text-sm font-medium text-gray-800">
                        {child.parents.length > 0
                          ? child.parents.map(p => p.name).join(', ')
                          : '未登録'}
                      </p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/desktop/children/edit/${child.childId}`)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(child)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* テーブル表示 */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      氏名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      年齢
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      性別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クラス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      保護者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {children.map(child => (
                    <tr key={child.childId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {child.childId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {child.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateAge(child.dateOfBirth)}歳
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getGenderLabel(child.gender)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {child.className || '未所属'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {child.parents.length > 0
                          ? child.parents.map(p => p.name).join(', ')
                          : '未登録'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge child={child} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/desktop/children/edit/${child.childId}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(child)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* データなし */}
        {children.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">園児が見つかりませんでした</p>
            <button
              onClick={() => navigate('/desktop/children/create')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              新規作成
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
