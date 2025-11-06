import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { masterService } from '../services/masterService';
import type { StaffDto, StaffFilterDto } from '../types/master';

// デモ用職員データ
const DEMO_STAFF: StaffDto[] = [
  {
    staffId: 1,
    name: '山田 太郎',
    phoneNumber: '090-1234-5678',
    email: 'yamada@kindergarten.jp',
    role: 'principal',
    position: '園長',
    classAssignments: [],
    isActive: true,
    lastLoginAt: '2025-10-25T09:30:00',
  },
  {
    staffId: 2,
    name: '佐藤 花子',
    phoneNumber: '090-2345-6789',
    email: 'sato@kindergarten.jp',
    role: 'admin',
    position: '主任',
    classAssignments: [{ classId: 1, className: 'ひまわり組', academicYear: 2025 }],
    isActive: true,
    lastLoginAt: '2025-10-26T08:15:00',
  },
  {
    staffId: 3,
    name: '鈴木 健一',
    phoneNumber: '090-3456-7890',
    email: 'suzuki@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 2, className: 'さくら組', academicYear: 2025 }],
    isActive: true,
    lastLoginAt: '2025-10-26T07:45:00',
  },
  {
    staffId: 4,
    name: '高橋 美咲',
    phoneNumber: '090-4567-8901',
    email: 'takahashi@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 3, className: 'たんぽぽ組', academicYear: 2025 }],
    isActive: true,
    lastLoginAt: '2025-10-26T08:00:00',
  },
  {
    staffId: 5,
    name: '田中 由美',
    phoneNumber: '090-5678-9012',
    email: 'tanaka@kindergarten.jp',
    role: 'nurse',
    position: '看護師',
    classAssignments: [],
    isActive: true,
    lastLoginAt: '2025-10-26T08:30:00',
  },
  {
    staffId: 6,
    name: '渡辺 裕子',
    phoneNumber: '090-6789-0123',
    email: 'watanabe@kindergarten.jp',
    role: 'teacher',
    position: '栄養士',
    classAssignments: [],
    isActive: true,
    lastLoginAt: '2025-10-25T14:20:00',
  },
  {
    staffId: 7,
    name: '伊藤 健太',
    phoneNumber: '090-7890-1234',
    email: 'ito@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 4, className: 'ちゅうりっぷ組', academicYear: 2025 }],
    isActive: true,
    lastLoginAt: '2025-10-26T08:10:00',
  },
  {
    staffId: 8,
    name: '山本 愛',
    phoneNumber: '090-8901-2345',
    email: 'yamamoto@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 1, className: 'ひまわり組', academicYear: 2025 }],
    isActive: true,
    resignationDate: '2026-03-31T00:00:00', // 未来の退職予定日
    lastLoginAt: '2025-10-26T07:50:00',
  },
  {
    staffId: 9,
    name: '中村 真理',
    phoneNumber: '090-9012-3456',
    email: 'nakamura@kindergarten.jp',
    role: 'admin',
    position: '副主任',
    classAssignments: [],
    isActive: true,
    lastLoginAt: '2025-10-26T08:20:00',
  },
  {
    staffId: 10,
    name: '小林 優子',
    phoneNumber: '090-0123-4567',
    email: 'kobayashi@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 5, className: 'すみれ組', academicYear: 2025 }],
    isActive: true,
    lastLoginAt: '2025-10-25T16:30:00',
  },
  {
    staffId: 11,
    name: '加藤 大輔',
    phoneNumber: '080-1234-5678',
    email: 'kato@kindergarten.jp',
    role: 'teacher',
    position: '保育士',
    classAssignments: [{ classId: 2, className: 'さくら組', academicYear: 2025 }],
    isActive: false,
    lastLoginAt: '2025-09-15T10:00:00',
  },
  {
    staffId: 12,
    name: '吉田 明美',
    phoneNumber: '080-2345-6789',
    email: 'yoshida@kindergarten.jp',
    role: 'teacher',
    position: '保育補助',
    classAssignments: [],
    isActive: true,
    resignationDate: '2025-03-31T00:00:00',
    lastLoginAt: '2025-03-30T17:00:00',
  },
];

/**
 * 職員一覧ページ
 * フィルタ、検索、編集、削除機能を提供
 */
export function StaffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';

  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタ状態
  const [filter, setFilter] = useState<StaffFilterDto>({
    role: undefined,
    position: undefined,
    classId: undefined,
    academicYear: new Date().getFullYear(),
    searchKeyword: undefined,
  });

  // ステータスフィルタ（在籍中/退職済み）
  const [employmentStatus, setEmploymentStatus] = useState<string>('Active');

  // データ読み込み
  useEffect(() => {
    if (isDemoMode) {
      // デモモード: デモデータを使用
      setStaff(applyFilters(DEMO_STAFF));
      setIsLoading(false);
    } else {
      loadStaff();
    }
  }, [filter.role, filter.position, filter.searchKeyword, employmentStatus, isDemoMode]);

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // フィルター（在籍ステータス以外）
      const filterWithoutStatus: StaffFilterDto = {
        ...filter,
        isActive: undefined, // 在籍ステータスはクライアントサイドでフィルタリング
      };

      const data = await masterService.getStaff(filterWithoutStatus);

      // クライアントサイドで退職日を使った在籍ステータスフィルタリング
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filteredData = data.filter((s) => {
        // 削除済みデータ（isActive === false）は常に除外
        if (s.isActive === false) return false;

        // 在籍ステータスフィルタ（退職日と本日の比較で判定）
        if (s.resignationDate) {
          const resignationDate = new Date(s.resignationDate);
          resignationDate.setHours(0, 0, 0, 0);

          // 退職日が本日以下（過去または本日）の場合は退職済み
          const isResigned = resignationDate <= today;

          if (employmentStatus === 'Active' && isResigned) return false;
          if (employmentStatus === 'Resigned' && !isResigned) return false;
        } else {
          // resignationDateがない場合は在籍中
          if (employmentStatus === 'Resigned') return false;
        }

        return true;
      });

      setStaff(filteredData);
    } catch (err) {
      console.error('職員一覧の取得に失敗しました:', err);
      setError('職員一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // デモモードのフィルタ適用
  const applyFilters = (data: StaffDto[]): StaffDto[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻を0:00:00にリセット

    return data.filter((s) => {
      // 削除済みデータ（isActive === false）は常に除外
      if (s.isActive === false) return false;

      if (filter.role && s.role !== filter.role) return false;
      if (filter.position && !s.position?.includes(filter.position)) return false;

      // 在籍ステータスフィルタ（退職日と本日の比較で判定）
      if (s.resignationDate) {
        const resignationDate = new Date(s.resignationDate);
        resignationDate.setHours(0, 0, 0, 0);

        // 退職日が本日以下（過去または本日）の場合は退職済み
        const isResigned = resignationDate <= today;

        if (employmentStatus === 'Active' && isResigned) return false;
        if (employmentStatus === 'Resigned' && !isResigned) return false;
      } else {
        // resignationDateがない場合は在籍中
        if (employmentStatus === 'Resigned') return false;
      }

      if (filter.searchKeyword) {
        const keyword = filter.searchKeyword.toLowerCase();
        if (
          !s.name.toLowerCase().includes(keyword) &&
          !s.phoneNumber.includes(keyword) &&
          !s.email?.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      return true;
    });
  };

  // フィルタ変更ハンドラ
  const handleFilterChange = (key: keyof StaffFilterDto, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  // 検索キーワード変更ハンドラ
  const handleSearchKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFilter(prev => ({ ...prev, searchKeyword: value || undefined }));
    // 検索キーワードの変更では自動検索しない
  };

  const handleSearchKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isDemoMode) {
        loadStaff();
      }
    }
  };

  // フィルタリセット
  const handleResetFilter = () => {
    setFilter({
      role: undefined,
      position: undefined,
      classId: undefined,
      academicYear: new Date().getFullYear(),
      searchKeyword: undefined,
    });
    setEmploymentStatus('Active');
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
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </button>
        </div>

        {/* フィルタセクション */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 役割フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">役割</label>
              <select
                value={filter.role || ''}
                onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
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
                onKeyDown={handleSearchKeywordKeyDown}
                placeholder="例: 主任、副主任（ENTERキーで検索）"
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              />
            </div>

            {/* ステータスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              >
                <option value="">全て</option>
                <option value="Active">在籍中</option>
                <option value="Resigned">退職済み</option>
              </select>
            </div>
          </div>

          {/* 検索バー */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={filter.searchKeyword || ''}
                onChange={handleSearchKeywordChange}
                onKeyDown={handleSearchKeywordKeyDown}
                placeholder="氏名、電話番号で検索（ENTERキーで検索）..."
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              />
            </div>
            <button
              onClick={handleResetFilter}
              className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              フィルタをリセット
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* 職員一覧テーブル */}
        <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        氏名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        電話番号
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
                        退職日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staff.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          職員が見つかりませんでした
                        </td>
                      </tr>
                    ) : (
                      staff.map((s) => (
                        <tr key={s.staffId} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.phoneNumber}
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
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.resignationDate
                              ? new Date(s.resignationDate).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {s.lastLoginAt
                              ? (() => {
                                  const date = new Date(s.lastLoginAt);
                                  const yy = String(date.getFullYear()).slice(-2);
                                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                                  const dd = String(date.getDate()).padStart(2, '0');
                                  const hh = String(date.getHours()).padStart(2, '0');
                                  const min = String(date.getMinutes()).padStart(2, '0');
                                  return `${yy}/${mm}/${dd} ${hh}:${min}`;
                                })()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {String(s.staffId).padStart(6, '0')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-1">
                              {/* 編集ボタン */}
                              <button
                                onClick={() => navigate(`/desktop/staff/edit/${s.staffId}`)}
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
                                onClick={() => handleDelete(s.staffId, s.name)}
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
          )}
        </div>

        {/* 件数表示 */}
        {!isLoading && (
          <div className="text-sm text-gray-600 text-center">
            全 {staff.length} 件の職員
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
