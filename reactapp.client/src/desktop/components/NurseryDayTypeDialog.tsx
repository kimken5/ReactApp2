import { useState, useEffect } from 'react';
import type {
  NurseryDayType,
  NurseryDayTypeDto,
  CreateNurseryDayTypeRequest,
} from '../types/calendar';
import { nurseryDayTypeInfo } from '../types/calendar';
import { nurseryDayTypeService } from '../services/nurseryDayTypeService';

interface NurseryDayTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateNurseryDayTypeRequest) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  selectedDate?: string; // ISO date string (YYYY-MM-DD)
  existingData?: NurseryDayTypeDto | null;
  allNurseryDayTypes: NurseryDayTypeDto[]; // カレンダー表示期間のデータ（参照用）
}

/**
 * 休園日・休日保育設定ダイアログ
 */
export function NurseryDayTypeDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  existingData,
  allNurseryDayTypes,
}: NurseryDayTypeDialogProps) {
  const [date, setDate] = useState<string>('');
  const [dayType, setDayType] = useState<NurseryDayType>('ClosedDay');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allData, setAllData] = useState<NurseryDayTypeDto[]>([]);

  // ダイアログが開かれたときに全データを取得
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // 全データを取得（過去1年～未来1年の範囲）
  const loadAllData = async () => {
    try {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(today.getFullYear() + 1);

      const startDate = oneYearAgo.toISOString().split('T')[0];
      const endDate = oneYearLater.toISOString().split('T')[0];

      const data = await nurseryDayTypeService.getNurseryDayTypes(startDate, endDate);
      setAllData(data);
    } catch (err) {
      console.error('全データ取得エラー:', err);
      // エラー時は表示期間のデータをフォールバックとして使用
      setAllData(allNurseryDayTypes);
    }
  };

  // ダイアログが開かれたときに初期化
  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        // 既存データの編集
        setDate(existingData.date);
        setDayType(existingData.dayType as NurseryDayType);
      } else if (selectedDate) {
        // 新規作成（日付指定あり）
        setDate(selectedDate);
        setDayType('ClosedDay');
      } else {
        // 新規作成（日付未指定）
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setDayType('ClosedDay');
      }
      setError(null);
    }
  }, [isOpen, existingData, selectedDate]);

  const handleSave = async () => {
    setError(null);

    if (!date) {
      setError('日付を選択してください');
      return;
    }

    try {
      setIsLoading(true);
      await onSave({ date, dayType });
      // 保存後、日付入力欄はクリアせず残す
      // 全データを再読み込み
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (item: NurseryDayTypeDto) => {
    if (!onDelete) return;

    if (!confirm(`${item.date}の${nurseryDayTypeInfo[item.dayType as NurseryDayType].name}を削除しますか？`)) {
      return;
    }

    try {
      setIsLoading(true);
      await onDelete(item.id);
      // 削除後、全データを再読み込み
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 選択された種別でフィルタリングして降順ソート
  const filteredItems = allData
    .filter((item) => item.dayType === dayType)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 日付を「YYYY年MM月DD日（曜日）」形式にフォーマット
  const formatDateWithDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日（${dayOfWeek}）`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">休園日・休日保育設定</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* 種別選択（トップ配置） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種別 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(Object.keys(nurseryDayTypeInfo) as NurseryDayType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDayType(type)}
                      className={`px-3 py-2 rounded-lg text-sm border font-medium transition ${
                        dayType === type ? 'ring-2 ring-orange-500' : ''
                      }`}
                      style={{
                        backgroundColor: dayType === type ? nurseryDayTypeInfo[type].color : nurseryDayTypeInfo[type].bgColor,
                        color: dayType === type ? 'white' : nurseryDayTypeInfo[type].color,
                        borderColor: nurseryDayTypeInfo[type].color,
                      }}
                    >
                      {nurseryDayTypeInfo[type].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 日付追加 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付を追加 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading || !date}
                    className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium transition-all duration-200 ${
                      isLoading || !date ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? '追加中...' : '追加'}
                  </button>
                </div>
              </div>

              {/* 日付一覧 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {nurseryDayTypeInfo[dayType].name}の一覧
                  </label>
                  <span className="text-sm text-gray-500">
                    全{filteredItems.length}件
                  </span>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 rounded-lg bg-gray-50" style={{ border: '0.5px solid #d1d5db' }}>
                    登録されている{nurseryDayTypeInfo[dayType].name}はありません
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid #d1d5db' }}>
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-4 py-3 last:border-b-0 hover:bg-gray-50 transition"
                          style={{ borderBottom: '0.5px solid #d1d5db' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: nurseryDayTypeInfo[item.dayType as NurseryDayType].color }}
                            />
                            <span className="text-sm font-medium text-gray-800">
                              {formatDateWithDay(item.date)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            disabled={isLoading}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="sticky bottom-0 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-md flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 rounded-md text-gray-700 font-medium hover:shadow-md transition-all duration-200"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
