import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { menuService } from '../services/menuService';
import type { DailyMenuDto } from '../types/menu';
import { MenuTypeLabels, MenuTypeColors } from '../types/menu';
import { MdChevronLeft, MdChevronRight, MdToday, MdAdd, MdEdit, MdDelete, MdWarning } from 'react-icons/md';
import { formatLocalDate } from '../../utils/dateUtils';

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * 日別献立カレンダーページ
 * カレンダー形式で日別献立を表示・管理
 */
export function DailyMenusPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyMenus, setDailyMenus] = useState<DailyMenuDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 日別献立データ取得
  useEffect(() => {
    loadDailyMenus();
  }, [currentDate]);

  const loadDailyMenus = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 月の最初と最後の日付を計算
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDateStr = formatLocalDate(startDate);
      const endDateStr = formatLocalDate(endDate);

      const data = await menuService.getDailyMenus(startDateStr, endDateStr);
      setDailyMenus(data);
    } catch (error: any) {
      console.error('日別献立取得エラー:', error);
      setErrorMessage(error.response?.data?.message || '日別献立の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 日付に紐づく献立を取得
  const getMenusForDate = (date: string) => {
    return dailyMenus.filter((menu) => menu.menuDate.split('T')[0] === date);
  };

  // 月の最初の曜日と日数を取得
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // カレンダーの日付配列を生成
  const generateCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const days: (Date | null)[] = [];

    // 前月の空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    return days;
  };

  // 今日かどうか
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // 土曜日かどうか
  const isSaturday = (date: Date | null) => {
    if (!date) return false;
    return date.getDay() === 6;
  };

  // 日曜日かどうか
  const isSunday = (date: Date | null) => {
    if (!date) return false;
    return date.getDay() === 0;
  };

  // ナビゲーション
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 特定日の献立を全て削除
  const handleDeleteByDate = async (date: string) => {
    const menus = getMenusForDate(date);
    if (menus.length === 0) {
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!window.confirm(`${formattedDate}の献立（${menus.length}件）を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await menuService.deleteDailyMenusByDate(date);
      setSuccessMessage('献立を削除しました');
      loadDailyMenus();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('献立削除エラー:', error);
      setErrorMessage(error.response?.data?.message || '献立の削除に失敗しました');
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">日別献立カレンダー</h1>
        </div>

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

        {/* カレンダーヘッダー */}
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center">
            {/* 左：献立の種類 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">献立の種類</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">給食</span>
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                  午前のお菓子
                </span>
                <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                  午後のお菓子
                </span>
              </div>
            </div>

            {/* 中央：年月選択 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousMonth}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                title="前月"
              >
                <MdChevronLeft className="text-xl" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[140px] text-center">
                {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
              </h2>
              <button
                onClick={goToNextMonth}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                title="翌月"
              >
                <MdChevronRight className="text-xl" />
              </button>
            </div>

            {/* 右：今日ボタン、献立マスター管理ボタン */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <MdToday className="text-lg" />
                <span>今日</span>
              </button>
              <button
                onClick={() => navigate('/desktop/menu-masters')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                献立マスター管理
              </button>
            </div>
          </div>
        </div>

        {/* カレンダー本体 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow-sm" style={{ border: '0.5px solid #d1d5db' }}>
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 bg-gray-50" style={{ borderBottom: '0.5px solid #d1d5db' }}>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`py-2 text-center text-sm font-semibold ${
                    index === 0
                      ? 'text-red-600'
                      : index === 6
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}
                  style={index < 6 ? { borderRight: '0.5px solid #d1d5db' } : {}}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dateStr = date ? formatLocalDate(date) : undefined;
                const menusForDate = dateStr ? getMenusForDate(dateStr) : [];
                const row = Math.floor(index / 7);
                const col = index % 7;

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 ${
                      !date
                        ? 'bg-gray-50'
                        : isToday(date)
                        ? 'bg-blue-50'
                        : isSunday(date)
                        ? 'bg-red-50'
                        : isSaturday(date)
                        ? 'bg-blue-50'
                        : 'bg-white'
                    }`}
                    style={{
                      borderBottom: '0.5px solid #d1d5db',
                      borderRight: col < 6 ? '0.5px solid #d1d5db' : 'none',
                    }}
                  >
                    {date && (
                      <>
                        {/* 日付とアクションボタン */}
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`text-sm font-medium ${
                              isToday(date)
                                ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                                : isSunday(date)
                                ? 'text-red-600'
                                : isSaturday(date)
                                ? 'text-blue-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          <div className="flex gap-1">
                            {menusForDate.length > 0 && (
                              <>
                                <button
                                  onClick={() =>
                                    navigate(`/desktop/daily-menus/create?date=${dateStr}`)
                                  }
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                                  title="編集"
                                >
                                  <MdEdit className="text-base" />
                                </button>
                                <button
                                  onClick={() => handleDeleteByDate(dateStr!)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded p-0.5"
                                  title="削除"
                                >
                                  <MdDelete className="text-base" />
                                </button>
                              </>
                            )}
                            {menusForDate.length === 0 && (
                              <button
                                onClick={() =>
                                  navigate(`/desktop/daily-menus/create?date=${dateStr}`)
                                }
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                                title="献立を登録"
                              >
                                <MdAdd className="text-base" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 献立リスト - MenuTypeごとにグループ化 */}
                        <div className="space-y-1">
                          {Object.entries(
                            menusForDate.reduce((acc, menu) => {
                              if (!acc[menu.menuType]) {
                                acc[menu.menuType] = [];
                              }
                              acc[menu.menuType].push(menu);
                              return acc;
                            }, {} as Record<string, typeof menusForDate>)
                          )
                            .sort(([typeA], [typeB]) => {
                              // 順序: MorningSnack → Lunch → AfternoonSnack
                              const order = { MorningSnack: 1, Lunch: 2, AfternoonSnack: 3 };
                              return order[typeA as keyof typeof order] - order[typeB as keyof typeof order];
                            })
                            .map(([menuType, menus]) => {
                            // 全アレルゲンを収集（重複を除く）
                            const allAllergens = Array.from(
                              new Set(
                                menus
                                  .filter((m) => m.allergenNames)
                                  .flatMap((m) => m.allergenNames!.split(',').map((a) => a.trim()))
                              )
                            ).join(', ');

                            return (
                              <div
                                key={menuType}
                                className={`text-xs px-1.5 py-1 rounded ${
                                  MenuTypeColors[menuType as keyof typeof MenuTypeColors]
                                }`}
                              >
                                <div className="space-y-0.5">
                                  {menus.map((menu) => (
                                    <div key={menu.id} className="truncate">
                                      {menu.menuName}
                                    </div>
                                  ))}
                                </div>
                                {allAllergens && (
                                  <div className="flex items-start gap-1 text-red-700 text-[10px] mt-1">
                                    <MdWarning className="text-sm flex-shrink-0 mt-0.5" />
                                    <span className="break-words">{allAllergens}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
