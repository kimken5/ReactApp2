import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDesktopAuth } from '../contexts/DesktopAuthContext';
import { menuService } from '../services/menuService';
import type { MenuMasterDto } from '../types/menu';
import { MdAdd, MdRestaurant, MdArrowBack } from 'react-icons/md';

/**
 * 献立マスター一覧ページ
 * 献立マスターの一覧表示・作成・編集・削除機能を提供
 */
export function MenuMastersPage() {
  const navigate = useNavigate();
  const { state } = useDesktopAuth();

  const [menuMasters, setMenuMasters] = useState<MenuMasterDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 献立マスター一覧取得
  const fetchMenuMasters = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await menuService.getMenuMasters();
      setMenuMasters(data);
    } catch (error: any) {
      console.error('献立マスター取得エラー:', error);
      setErrorMessage(error.response?.data?.message || '献立マスターの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuMasters();
  }, []);

  // 献立マスター削除
  const handleDelete = async (id: number, menuName: string) => {
    if (!window.confirm(`「${menuName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await menuService.deleteMenuMaster(id);
      setSuccessMessage('献立マスターを削除しました');
      fetchMenuMasters();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('献立マスター削除エラー:', error);
      setErrorMessage(error.response?.data?.message || '献立マスターの削除に失敗しました');
    }
  };

  // 成功メッセージを自動で消す
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ページタイトル */}
        <h1 className="text-2xl font-bold text-gray-900">献立マスター管理</h1>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* ヘッダーアクション */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/desktop/daily-menus')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <MdArrowBack className="text-lg" />
            <span>戻る</span>
          </button>
          <button
            onClick={() => navigate('/desktop/menu-masters/create')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <MdAdd className="text-xl" />
            <span>新規献立作成</span>
          </button>
        </div>

        {/* 献立マスター一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : menuMasters.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MdRestaurant className="mx-auto text-6xl text-gray-400" />
            <p className="mt-4 text-gray-600">献立マスターが登録されていません</p>
            <button
              onClick={() => navigate('/desktop/menu-masters/create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              最初の献立マスターを作成
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-md border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    献立名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    食材
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アレルゲン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新日時
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuMasters.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{menu.menuName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {menu.ingredientName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {menu.allergenNames || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {menu.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const date = new Date(menu.updatedAt);
                          const yy = String(date.getFullYear()).slice(-2);
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          return `${yy}/${mm}/${dd}`;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1 justify-end">
                        {/* 編集ボタン */}
                        <button
                          onClick={() => navigate(`/desktop/menu-masters/edit/${menu.id}`)}
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
                          onClick={() => handleDelete(menu.id, menu.menuName)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 献立マスター数の表示 */}
        {!isLoading && menuMasters.length > 0 && (
          <div className="text-sm text-gray-600">
            全{menuMasters.length}件の献立マスター
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
