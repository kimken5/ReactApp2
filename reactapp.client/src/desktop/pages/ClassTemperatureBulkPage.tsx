import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { infantRecordService } from '../services/infantRecordService';
import { masterService } from '../services/masterService';
import {
  MdThermostat,
  MdSave,
  MdClear,
  MdChevronLeft,
  MdChevronRight,
  MdArrowBack
} from 'react-icons/md';
import type {
  ClassTemperatureListResponse,
  ChildTemperatureData,
  TemperatureMeasurement,
  ClassTemperatureBulkRequest,
} from '../../types/infantRecords';
import type { ClassDto } from '../types/master';

export function ClassTemperatureBulkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlClassId = searchParams.get('classId');
  const urlDate = searchParams.get('date');

  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    urlDate || new Date().toISOString().split('T')[0]
  );
  const [temperatureData, setTemperatureData] = useState<ClassTemperatureListResponse | null>(null);
  const [temperatures, setTemperatures] = useState<Map<number, ChildTemperatureData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // クラス一覧取得
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await masterService.getClasses();
        setClasses(data);
      } catch (err) {
        console.error('クラス一覧取得エラー:', err);
        setError('クラス一覧の取得に失敗しました');
      }
    };
    fetchClasses();
  }, []);

  // 体温データ取得
  useEffect(() => {
    if (selectedClassId && selectedDate) {
      fetchTemperatures();
    } else {
      setTemperatureData(null);
      setTemperatures(new Map());
    }
  }, [selectedClassId, selectedDate]);

  const fetchTemperatures = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const data = await infantRecordService.getClassTemperatures(selectedClassId, selectedDate);
      setTemperatureData(data);

      // 既存データをMapに変換
      const tempMap = new Map<number, ChildTemperatureData>();
      data.children.forEach((child) => {
        tempMap.set(child.childId, {
          childId: child.childId,
          morning: child.morning
            ? {
                temperature: child.morning.temperature || 36.5,
                measurementLocation: child.morning.measurementLocation || 'Armpit',
                measuredAt: child.morning.measuredAt || new Date().toISOString(),
                notes: undefined,
              }
            : undefined,
          afternoon: child.afternoon
            ? {
                temperature: child.afternoon.temperature || 36.5,
                measurementLocation: child.afternoon.measurementLocation || 'Armpit',
                measuredAt: child.afternoon.measuredAt || new Date().toISOString(),
                notes: undefined,
              }
            : undefined,
        });
      });
      setTemperatures(tempMap);
    } catch (err: any) {
      console.error('体温データ取得エラー:', err);
      setError(err.response?.data?.message || '体温データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTemperatureChange = (
    childId: number,
    type: 'morning' | 'afternoon',
    field: 'temperature' | 'measurementLocation',
    value: number | string
  ) => {
    const current = temperatures.get(childId) || { childId };
    const measurement = current[type] || {
      temperature: 36.5,
      measurementLocation: 'Armpit',
      measuredAt: new Date().toISOString(),
    };

    const updated: ChildTemperatureData = {
      ...current,
      [type]: {
        ...measurement,
        [field]: field === 'temperature' ? parseFloat(value as string) : value,
      } as TemperatureMeasurement,
    };

    const newMap = new Map(temperatures);
    newMap.set(childId, updated);
    setTemperatures(newMap);
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedDate) {
      setError('クラスと日付を選択してください');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nurseryStr = localStorage.getItem('desktop_nursery');
      if (!nurseryStr) throw new Error('保育園情報が取得できません');
      const nursery = JSON.parse(nurseryStr);

      const request: ClassTemperatureBulkRequest = {
        nurseryId: nursery.nurseryId,
        classId: selectedClassId,
        recordDate: selectedDate,
        temperatures: Array.from(temperatures.values()),
      };

      const response = await infantRecordService.saveClassTemperatures(request);
      setSuccessMessage(
        `${response.savedCount}件保存しました` +
          (response.skippedCount > 0 ? ` (${response.skippedCount}件スキップ)` : '')
      );

      if (response.warnings.length > 0) {
        const warningText = response.warnings
          .map((w) => `${w.childName}: ${w.temperature}℃ (${w.message})`)
          .join('\n');
        alert(`警告:\n${warningText}`);
      }

      // データを再取得して最新状態を表示
      await fetchTemperatures();
    } catch (err: any) {
      console.error('保存エラー:', err);
      setError(err.response?.data?.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('入力内容をクリアしますか?')) {
      setTemperatures(new Map());
    }
  };

  // 日付フォーマット（〇月〇日）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 日付変更（前日）
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // 日付変更（翌日）
  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // 月齢を「〇歳〇ヶ月」形式でフォーマット
  const formatAgeMonths = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}歳${remainingMonths}ヶ月`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">クラス体温一括入力</h1>
            <button
              onClick={() => navigate('/desktop/infant-records')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MdArrowBack className="w-5 h-5" />
              <span>戻る</span>
            </button>
          </div>
        </div>

        {/* メッセージ表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* フィルター */}
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="flex items-start justify-between gap-6">
            {/* クラス選択 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                クラス選択
              </label>
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <button
                    key={cls.classId}
                    onClick={() => setSelectedClassId(cls.classId)}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      selectedClassId === cls.classId
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 日付選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                日付選択
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="前日"
                >
                  <MdChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto rounded-md px-3 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleNextDay}
                  disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                  className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  title="翌日"
                >
                  <MdChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        {temperatureData && (
          <div className="bg-white p-6 rounded-md shadow-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {formatDate(selectedDate)} の体温入力 ({temperatureData.children.length}名)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  disabled={temperatures.size === 0}
                  className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdClear className="w-4 h-4 mr-2" />
                  クリア
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !temperatureData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <MdSave className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '一括保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 体温入力テーブル */}
        {loading ? (
          <div className="bg-white p-6 rounded-md shadow-md">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : temperatureData ? (
          <div className="bg-white rounded-md shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      園児名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      月齢
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      家庭(体温)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      午前(体温)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      測定箇所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      午後(体温)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      測定箇所
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {temperatureData.children.map((child) => {
                    const temp = temperatures.get(child.childId) || { childId: child.childId };
                    return (
                      <tr key={child.childId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {child.childName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatAgeMonths(child.ageMonths)}
                        </td>
                        {/* 家庭での体温(編集不可) */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {child.home?.temperature ? (
                            <span className={child.home.isAbnormal ? 'text-red-600 font-medium' : ''}>
                              {child.home.temperature}℃
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="0.1"
                              min="35"
                              max="42"
                              value={temp.morning?.temperature || ''}
                              onChange={(e) =>
                                handleTemperatureChange(
                                  child.childId,
                                  'morning',
                                  'temperature',
                                  e.target.value
                                )
                              }
                              className={`w-20 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                child.morning?.isAbnormal
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                              placeholder="36.5"
                            />
                            <span className="ml-1 text-sm text-gray-500">℃</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={temp.morning?.measurementLocation || 'Armpit'}
                            onChange={(e) =>
                              handleTemperatureChange(
                                child.childId,
                                'morning',
                                'measurementLocation',
                                e.target.value
                              )
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Armpit">脇下</option>
                            <option value="Ear">耳</option>
                            <option value="Forehead">額</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="0.1"
                              min="35"
                              max="42"
                              value={temp.afternoon?.temperature || ''}
                              onChange={(e) =>
                                handleTemperatureChange(
                                  child.childId,
                                  'afternoon',
                                  'temperature',
                                  e.target.value
                                )
                              }
                              className={`w-20 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                child.afternoon?.isAbnormal
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                              placeholder="36.5"
                            />
                            <span className="ml-1 text-sm text-gray-500">℃</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={temp.afternoon?.measurementLocation || 'Armpit'}
                            onChange={(e) =>
                              handleTemperatureChange(
                                child.childId,
                                'afternoon',
                                'measurementLocation',
                                e.target.value
                              )
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Armpit">脇下</option>
                            <option value="Ear">耳</option>
                            <option value="Forehead">額</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-md shadow-md">
            <div className="text-center py-12 text-gray-500">
              クラスと日付を選択してください
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
