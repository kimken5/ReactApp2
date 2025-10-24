import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { StaffDto, StaffFilterDto } from '../types/master';

/**
 * 職員一覧ページ
 * フィルタ、検索、編集、削除機能を提供
 */
export function StaffPage() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<StaffFilterDto>({
    role: undefined,
    position: undefined,
    classId: undefined,
    academicYear: new Date().getFullYear(),
    isActive: true,
    searchKeyword: undefined,
  });

  // データ読み込み
  useEffect(() => {
    loadStaff();
  }, [filter]);

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await masterService.getStaff(filter);
      setStaff(data);
    } catch (err) {
      console.error('職員一覧の取得に失敗しました:', err);
      setError('職員一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // フィルタ変更ハンドラ
  const handleFilterChange = (key: keyof StaffFilterDto, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // 検索実行
  const handleSearch = (keyword: string) => {
    setFilter(prev => ({ ...prev, searchKeyword: keyword || undefined }));
  };

  // フィルタリセット
  const handleResetFilter = () => {
    setFilter({
      role: undefined,
      position: undefined,
      classId: undefined,
      academicYear: new Date().getFullYear(),
      isActive: true,
      searchKeyword: undefined,
    });
  };

  // 削除処理
  const handleDelete = async (staffId: number, staffName: string) => {
    if (!confirm(`職員「${staffName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await masterService.deleteStaff(staffId);
      loadStaff();
    } catch (err) {
      console.error('削除に失敗しました:', err);
      alert('削除に失敗しました');
    }
  };

  // 役割バッジの色決定
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'principal':
        return 'bg-yellow-100 text-yellow-800';
      case 'nurse':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 役割の日本語表示
  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'teacher':
        return '教職員';
      case 'admin':
        return '管理者';
      case 'principal':
        return '園長';
      case 'nurse':
        return '看護師';
      default:
        return role;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">職員管理</h1>
            <p className="text-gray-600 mt-2">職員情報の登録・編集・削除を行います</p>
          </div>
          <button
            onClick={() => navigate('/desktop/staff/create')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        </div>

        {/* フィルタセクション */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 役割フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">役割</label>
              <select
                value={filter.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全て</option>
                <option value="teacher">教職員</option>
                <option value="admin">管理者</option>
                <option value="principal">園長</option>
                <option value="nurse">看護師</option>
              </select>
            </div>

            {/* 役職フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
              <input
                type="text"
                value={filter.position || ''}
                onChange={(e) => handleFilterChange('position', e.target.value || undefined)}
                placeholder="例: 主任、副主任"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 年度フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">年度</label>
              <select
                value={filter.academicYear || ''}
                onChange={(e) => handleFilterChange('academicYear', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全て</option>
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}年度
                    </option>
                  );
                })}
              </select>
            </div>

            {/* ステータスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={filter.isActive === undefined ? '' : filter.isActive.toString()}
                onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全て</option>
                <option value="true">有効</option>
                <option value="false">無効</option>
              </select>
            </div>
          </div>

          {/* 検索バー */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={filter.searchKeyword || ''}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="氏名、電話番号、メールアドレスで検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              フィルタリセット
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ローディング */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* 職員一覧テーブル */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        職員ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        氏名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        電話番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        メール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        役割
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        役職
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        担当クラス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
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
                    {staff.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          職員が見つかりませんでした
                        </td>
                      </tr>
                    ) : (
                      staff.map((s) => (
                        <tr key={s.staffId} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {s.staffId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.email || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(s.role)}`}>
                              {getRoleLabel(s.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.position || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {s.classAssignments.length > 0 ? (
                              <div className="max-w-xs">
                                {s.classAssignments
                                  .filter(a => a.academicYear === filter.academicYear || !filter.academicYear)
                                  .map((a, idx) => (
                                    <span key={idx} className="inline-block mr-2 mb-1">
                                      {a.className || a.classId}
                                      {a.academicYear && ` (${a.academicYear}年度)`}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.lastLoginAt
                              ? new Date(s.lastLoginAt).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                s.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {s.isActive ? '有効' : '無効'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/desktop/staff/edit/${s.staffId}`)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDelete(s.staffId, s.name)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 件数表示 */}
            <div className="text-sm text-gray-600 text-center">
              全 {staff.length} 件の職員
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
