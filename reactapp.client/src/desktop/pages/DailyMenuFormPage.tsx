import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { menuService } from '../services/menuService';
import type {
  MenuMasterSearchDto,
  DailyMenuDto,
  CreateDailyMenuDto,
} from '../types/menu';
import { MenuTypeLabels } from '../types/menu';
import { MdArrowBack, MdSearch, MdAdd } from 'react-icons/md';
import { MenuMasterCreateModal } from '../components/menu/MenuMasterCreateModal';

/**
 * 日別献立登録ページ（オートコンプリート即時保存方式）
 * オートコンプリートで選択すると即座にDBに登録
 */
export function DailyMenuFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [menuDate, setMenuDate] = useState(initialDate);
  const [morningSnacks, setMorningSnacks] = useState<DailyMenuDto[]>([]);
  const [lunches, setLunches] = useState<DailyMenuDto[]>([]);
  const [afternoonSnacks, setAfternoonSnacks] = useState<DailyMenuDto[]>([]);

  // オートコンプリート検索用
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MenuMasterSearchDto[]>([]);
  const [activeMenuType, setActiveMenuType] = useState<'MorningSnack' | 'Lunch' | 'AfternoonSnack'>('Lunch');

  // モーダル管理
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, [menuDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 既存の日別献立を取得
      const existingMenus = await menuService.getDailyMenusByDate(menuDate);

      // 献立タイプごとに分類
      setMorningSnacks(
        existingMenus
          .filter((m) => m.menuType === 'MorningSnack')
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      setLunches(
        existingMenus
          .filter((m) => m.menuType === 'Lunch')
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      setAfternoonSnacks(
        existingMenus
          .filter((m) => m.menuType === 'AfternoonSnack')
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
    } catch (error: any) {
      console.error('データの取得に失敗しました:', error);
      setErrors({ general: 'データの取得に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // 献立マスター検索
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await menuService.searchMenuMasters(query);
      setSearchResults(results);
    } catch (error) {
      console.error('献立マスター検索エラー:', error);
    }
  };

  // 献立マスター選択（即座にDB保存）
  const handleSelectMenu = async (menu: MenuMasterSearchDto) => {
    try {
      // 現在のメニュータイプのリストを取得
      let currentList: DailyMenuDto[] = [];
      if (activeMenuType === 'MorningSnack') currentList = morningSnacks;
      else if (activeMenuType === 'Lunch') currentList = lunches;
      else if (activeMenuType === 'AfternoonSnack') currentList = afternoonSnacks;

      // 次のソート順を計算
      const nextSortOrder = currentList.length > 0
        ? Math.max(...currentList.map(m => m.sortOrder)) + 1
        : 1;

      const createDto: CreateDailyMenuDto = {
        menuDate,
        menuType: activeMenuType,
        menuMasterId: menu.id,
        sortOrder: nextSortOrder,
        notes: '',
      };

      // DB保存
      const newMenu = await menuService.createDailyMenu(createDto);

      // ローカルステートを更新
      if (activeMenuType === 'MorningSnack') {
        setMorningSnacks([...morningSnacks, newMenu]);
      } else if (activeMenuType === 'Lunch') {
        setLunches([...lunches, newMenu]);
      } else if (activeMenuType === 'AfternoonSnack') {
        setAfternoonSnacks([...afternoonSnacks, newMenu]);
      }

      // 検索状態をクリア
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('献立追加エラー:', error);
      setErrors({
        general: error.response?.data?.message || '献立の追加に失敗しました',
      });
    }
  };

  // 献立削除（即座にDB削除）
  const handleRemoveMenu = async (menuId: number, menuType: 'MorningSnack' | 'Lunch' | 'AfternoonSnack') => {
    try {
      await menuService.deleteDailyMenu(menuId);

      // ローカルステートを更新
      if (menuType === 'MorningSnack') {
        setMorningSnacks(morningSnacks.filter((m) => m.id !== menuId));
      } else if (menuType === 'Lunch') {
        setLunches(lunches.filter((m) => m.id !== menuId));
      } else if (menuType === 'AfternoonSnack') {
        setAfternoonSnacks(afternoonSnacks.filter((m) => m.id !== menuId));
      }
    } catch (error: any) {
      console.error('献立削除エラー:', error);
      setErrors({
        general: error.response?.data?.message || '献立の削除に失敗しました',
      });
    }
  };

  // モーダルから献立マスター作成成功時の処理
  const handleMenuMasterCreated = async (menuMasterId: number) => {
    try {
      // 作成された献立マスターを取得
      const newMenuMaster = await menuService.getMenuMasterById(menuMasterId);

      // 現在のメニュータイプのリストを取得
      let currentList: DailyMenuDto[] = [];
      if (activeMenuType === 'MorningSnack') currentList = morningSnacks;
      else if (activeMenuType === 'Lunch') currentList = lunches;
      else if (activeMenuType === 'AfternoonSnack') currentList = afternoonSnacks;

      // 次のソート順を計算
      const nextSortOrder = currentList.length > 0
        ? Math.max(...currentList.map(m => m.sortOrder)) + 1
        : 1;

      const createDto: CreateDailyMenuDto = {
        menuDate,
        menuType: activeMenuType,
        menuMasterId: newMenuMaster.id,
        sortOrder: nextSortOrder,
        notes: '',
      };

      // 日別献立に追加
      const newMenu = await menuService.createDailyMenu(createDto);

      // ローカルステートを更新
      if (activeMenuType === 'MorningSnack') {
        setMorningSnacks([...morningSnacks, newMenu]);
      } else if (activeMenuType === 'Lunch') {
        setLunches([...lunches, newMenu]);
      } else if (activeMenuType === 'AfternoonSnack') {
        setAfternoonSnacks([...afternoonSnacks, newMenu]);
      }
    } catch (error: any) {
      console.error('献立追加エラー:', error);
      setErrors({
        general: error.response?.data?.message || '献立の追加に失敗しました',
      });
    }
  };

  // 献立セクションのレンダリング（テーブル形式）
  const renderMenuSection = (
    menuType: 'MorningSnack' | 'Lunch' | 'AfternoonSnack',
    menuList: DailyMenuDto[],
    label: string
  ) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        </div>

        <div className="p-6">
          {/* オートコンプリート検索と新規献立作成ボタン */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={activeMenuType === menuType ? searchQuery : ''}
                  onFocus={() => setActiveMenuType(menuType)}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="献立名を入力して検索..."
                />
                <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveMenuType(menuType);
                  setIsModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <MdAdd className="text-xl" />
                <span>新規献立作成</span>
              </button>
            </div>

            {/* 検索結果ドロップダウン */}
            {activeMenuType === menuType && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleSelectMenu(menu)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{menu.menuName}</div>
                    <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                      <div className="text-gray-600">
                        {menu.ingredientName && `食材: ${menu.ingredientName}`}
                      </div>
                      <div className="text-red-600">
                        {menu.allergenNames && `アレルゲン: ${menu.allergenNames}`}
                      </div>
                      <div className="text-gray-500">
                        {menu.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 登録済み献立一覧（テーブル形式） */}
          {menuList.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-md">
              献立が登録されていません
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    献立名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    材料
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アレルゲン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuList.map((menu) => (
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
                      <div className="text-sm text-red-600 truncate max-w-xs">
                        {menu.allergenNames || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {menu.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1 justify-end">
                        {/* 削除ボタン */}
                        <button
                          onClick={() => handleRemoveMenu(menu.id, menuType)}
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
          )}
        </div>
      </div>
    );
  };



  if (isLoading) {
    return (
      <DashboardLayout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">日別献立登録</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">日別献立登録</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/desktop/menu-masters')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <span>献立マスター一覧</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/desktop/daily-menus')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <MdArrowBack className="text-lg" />
              <span>戻る</span>
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* 提供日選択 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            提供日
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                const date = new Date(menuDate);
                date.setDate(date.getDate() - 1);
                setMenuDate(date.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="前日"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={menuDate}
              onChange={(e) => setMenuDate(e.target.value)}
              className="w-auto px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => {
                const date = new Date(menuDate);
                date.setDate(date.getDate() + 1);
                setMenuDate(date.toISOString().split('T')[0]);
              }}
              className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="翌日"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 献立セクション */}
        {renderMenuSection('MorningSnack', morningSnacks, MenuTypeLabels.MorningSnack)}
        {renderMenuSection('Lunch', lunches, MenuTypeLabels.Lunch)}
        {renderMenuSection('AfternoonSnack', afternoonSnacks, MenuTypeLabels.AfternoonSnack)}
      </div>

      {/* 献立マスター作成モーダル */}
      <MenuMasterCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMenuMasterCreated}
        activeMenuType={activeMenuType}
      />
    </DashboardLayout>
  );
}
