import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdChevronLeft,
  MdChevronRight,
  MdThermostat,
  MdLocalDrink,
  MdRestaurant,
  MdHotel,
  MdBabyChangingStation,
  MdSentimentSatisfied,
  MdHome,
  MdWbSunny,
  MdChildCare,
  MdRocketLaunch,
  MdAssessment,
  MdChecklist
} from 'react-icons/md';
import apiClient from '../services/apiClient';
import { masterService } from '../services/masterService';
import type { ClassDto } from '../types/master';
import { infantRecordService } from '../services/infantRecordService';
import type {
  InfantMilkDto, InfantMealDto, InfantSleepDto,
  InfantToiletingDto, InfantMoodDto, RoomEnvironmentDto,
  ClassChildrenResponse
} from '../types/infantRecord';
import { mealTypeLabels, mealAmountLabels } from '../types/infantRecord';
import {
  InfantMilkModal, InfantMealModal, InfantSleepModal,
  InfantToiletingModal, InfantMoodModal, RoomEnvironmentModal,
  DeleteConfirmModal
} from '../components/infantRecords';

// タブ定義
type TabType = 'overview' | 'milk' | 'meals' | 'sleep' | 'sleep-check' | 'toileting' | 'temperature' | 'mood' | 'environment';

interface TabItem {
  id: TabType;
  label: string;
}

// 不要になったChildInfo interfaceは削除

const tabs: TabItem[] = [
  { id: 'overview', label: '概要' },
  { id: 'milk', label: 'ミルク' },
  { id: 'meals', label: '食事' },
  { id: 'sleep', label: '睡眠' },
  { id: 'sleep-check', label: '午睡チェック' },
  { id: 'toileting', label: '排泄' },
  { id: 'temperature', label: '体温' },
  { id: 'mood', label: '機嫌' },
  { id: 'environment', label: '室温・湿度' },
];

export function InfantRecordsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states for each record type
  const [milkRecords, setMilkRecords] = useState<InfantMilkDto[]>([]);
  const [mealRecords, setMealRecords] = useState<InfantMealDto[]>([]);
  const [sleepRecords, setSleepRecords] = useState<InfantSleepDto[]>([]);
  const [toiletingRecords, setToiletingRecords] = useState<InfantToiletingDto[]>([]);
  const [moodRecords, setMoodRecords] = useState<InfantMoodDto[]>([]);
  const [roomEnvironment, setRoomEnvironment] = useState<RoomEnvironmentDto | null>(null);

  // Class children for dropdowns
  const [classChildren, setClassChildren] = useState<ClassChildrenResponse>({ children: [] });

  // Modal states
  const [modalState, setModalState] = useState<{
    type: 'milk' | 'meal' | 'sleep' | 'toileting' | 'mood' | 'environment' | null;
    mode: 'create' | 'edit';
    isOpen: boolean;
    data?: any;
  }>({ type: null, mode: 'create', isOpen: false });

  // Delete confirmation
  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    recordType: string;
    recordData?: any;
    onConfirm?: () => Promise<void>;
  }>({ isOpen: false, recordType: '' });

  // クラス一覧を取得
  useEffect(() => {
    fetchClasses();
  }, []);

  // フィルター条件が変更されたらデータを取得
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('selectedClass:', selectedClass);
    console.log('selectedDate:', selectedDate);
    console.log('activeTab:', activeTab);
    if (selectedClass && selectedDate) {
      console.log('Calling fetchData()...');
      fetchData();
    } else {
      console.log('Conditions not met for fetchData');
    }
  }, [selectedClass, selectedDate, activeTab]);

  const fetchClasses = async () => {
    try {
      const data = await masterService.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('クラス一覧の取得に失敗しました:', error);
    }
  };

  const fetchData = async () => {
    if (!selectedClass || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch class children first
      const childrenData = await infantRecordService.getClassChildren(selectedClass, selectedDate);
      setClassChildren(childrenData);

      // Fetch all records based on active tab
      switch (activeTab) {
        case 'overview':
          // 概要タブでは全てのデータを取得
          const [milk, meals, sleep, toileting, mood, env] = await Promise.all([
            infantRecordService.getMilkRecords(selectedClass, selectedDate),
            infantRecordService.getMealRecords(selectedClass, selectedDate),
            infantRecordService.getSleepRecords(selectedClass, selectedDate),
            infantRecordService.getToiletingRecords(selectedClass, selectedDate),
            infantRecordService.getMoodRecords(selectedClass, selectedDate),
            infantRecordService.getRoomEnvironment(selectedClass, selectedDate),
          ]);
          setMilkRecords(milk);
          setMealRecords(meals);
          setSleepRecords(sleep);
          setToiletingRecords(toileting);
          setMoodRecords(mood);
          setRoomEnvironment(env);
          break;
        case 'milk':
          console.log('=== Fetching milk records ===');
          console.log('selectedClass:', selectedClass);
          console.log('selectedDate:', selectedDate);
          const milkData = await infantRecordService.getMilkRecords(selectedClass, selectedDate);
          console.log('Fetched milk records:', milkData);
          console.log('Milk records count:', milkData?.length || 0);
          setMilkRecords(milkData);
          console.log('State updated with milk records');
          break;
        case 'meals':
          const mealsData = await infantRecordService.getMealRecords(selectedClass, selectedDate);
          setMealRecords(mealsData);
          break;
        case 'sleep':
          const sleepData = await infantRecordService.getSleepRecords(selectedClass, selectedDate);
          setSleepRecords(sleepData);
          break;
        case 'toileting':
          const toiletingData = await infantRecordService.getToiletingRecords(selectedClass, selectedDate);
          setToiletingRecords(toiletingData);
          break;
        case 'mood':
          const moodData = await infantRecordService.getMoodRecords(selectedClass, selectedDate);
          setMoodRecords(moodData);
          break;
        case 'environment':
          const envData = await infantRecordService.getRoomEnvironment(selectedClass, selectedDate);
          setRoomEnvironment(envData);
          break;
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Save handlers
  const handleSaveMilk = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        await infantRecordService.createMilkRecord(data);
      } else {
        await infantRecordService.updateMilkRecord(data);
      }
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save milk record:', err);
      alert('保存に失敗しました');
    }
  };

  const handleSaveMeal = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        await infantRecordService.createMealRecord(data);
      } else {
        await infantRecordService.updateMealRecord(data);
      }
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save meal record:', err);
      alert('保存に失敗しました');
    }
  };

  const handleSaveSleep = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        await infantRecordService.createSleepRecord(data);
      } else {
        await infantRecordService.updateSleepRecord(data);
      }
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save sleep record:', err);
      alert('保存に失敗しました');
    }
  };

  const handleSaveToileting = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        await infantRecordService.createToiletingRecord(data);
      } else {
        await infantRecordService.updateToiletingRecord(data);
      }
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save toileting record:', err);
      alert('保存に失敗しました');
    }
  };

  const handleSaveMood = async (data: any) => {
    try {
      if (modalState.mode === 'create') {
        await infantRecordService.createMoodRecord(data);
      } else {
        await infantRecordService.updateMoodRecord(data);
      }
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save mood record:', err);
      alert('保存に失敗しました');
    }
  };

  const handleSaveEnvironment = async (data: any) => {
    try {
      await infantRecordService.saveRoomEnvironment(data);
      setModalState({ ...modalState, isOpen: false });
      await fetchData();
    } catch (err) {
      console.error('Failed to save room environment:', err);
      alert('保存に失敗しました');
    }
  };

  // Delete handlers
  const handleDeleteMilk = async (record: InfantMilkDto) => {
    setDeleteState({
      isOpen: true,
      recordType: 'ミルク記録',
      recordData: record,
      onConfirm: async () => {
        await infantRecordService.deleteMilkRecord(record.childId, record.recordDate, record.milkTime);
        setDeleteState({ isOpen: false, recordType: '' });
        await fetchData();
      }
    });
  };

  const handleDeleteMeal = async (record: InfantMealDto) => {
    setDeleteState({
      isOpen: true,
      recordType: '食事記録',
      recordData: record,
      onConfirm: async () => {
        await infantRecordService.deleteMealRecord(record.childId, record.recordDate, record.mealTime);
        setDeleteState({ isOpen: false, recordType: '' });
        await fetchData();
      }
    });
  };

  const handleDeleteSleep = async (record: InfantSleepDto) => {
    setDeleteState({
      isOpen: true,
      recordType: '午睡記録',
      recordData: record,
      onConfirm: async () => {
        await infantRecordService.deleteSleepRecord(record.childId, record.recordDate, record.sleepSequence);
        setDeleteState({ isOpen: false, recordType: '' });
        await fetchData();
      }
    });
  };

  const handleDeleteToileting = async (record: InfantToiletingDto) => {
    setDeleteState({
      isOpen: true,
      recordType: '排泄記録',
      recordData: record,
      onConfirm: async () => {
        await infantRecordService.deleteToiletingRecord(record.childId, record.recordDate, record.toiletingTime);
        setDeleteState({ isOpen: false, recordType: '' });
        await fetchData();
      }
    });
  };

  const handleDeleteMood = async (record: InfantMoodDto) => {
    setDeleteState({
      isOpen: true,
      recordType: '機嫌記録',
      recordData: record,
      onConfirm: async () => {
        await infantRecordService.deleteMoodRecord(record.childId, record.recordDate, record.observationTime);
        setDeleteState({ isOpen: false, recordType: '' });
        await fetchData();
      }
    });
  };

  // シンプルなテーブルタブのレンダリング（汎用）
  const renderSimpleTab = (
    title: string,
    columns: Array<{ label: string; key: string }>,
    data: Array<Record<string, any>>,
    summaryText?: string,
    extraButton?: React.ReactNode,
    onAdd?: () => void,
    onEdit?: (record: any) => void,
    onDelete?: (record: any) => void
  ) => {
    if (!selectedClass || !selectedDate) {
      return (
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="text-center py-12 text-gray-500">
            クラスと日付を選択してください
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-md shadow-md overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} {title}
          </h3>
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data || []).length > 0 ? (
                (data || []).map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 text-sm ${colIndex === 0 ? 'whitespace-nowrap text-gray-900' : 'text-gray-600'}`}
                      >
                        {record[col.key] || '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {/* 編集ボタン */}
                        <button
                          onClick={() => onEdit?.(record)}
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
                          onClick={() => onDelete?.(record)}
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
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                    記録がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {summaryText || `合計: ${data.length}件`}
          </div>
          <div className="flex gap-2">
            {extraButton}
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + 追加
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ミルクタブのレンダリング
  const renderMilkTab = () => {
    console.log('=== Rendering milk tab ===');
    console.log('milkRecords state:', milkRecords);
    console.log('milkRecords length:', Array.isArray(milkRecords) ? milkRecords.length : 0);
    console.log('milkRecords type:', typeof milkRecords);
    console.log('Is array?:', Array.isArray(milkRecords));
    
    if (!selectedClass || !selectedDate) {
      return (
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="text-center py-12 text-gray-500">
            クラスと日付を選択してください
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-md shadow-md overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {new Date(selectedDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} ミルク記録
          </h3>
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  園児名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時刻
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ミルク量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メモ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  記録者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(milkRecords) && milkRecords.length > 0 ? (
                milkRecords.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.childName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.milkTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.amountMl} mL
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.createdByName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {/* 編集ボタン */}
                      <button
                        onClick={() => {
                          setModalState({ type: 'milk', mode: 'edit', isOpen: true, data: record });
                        }}
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
                        onClick={() => handleDeleteMilk(record)}
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
              ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    記録がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            記録数: <span className="font-semibold text-gray-900">{Array.isArray(milkRecords) ? milkRecords.length : 0}回</span>
          </div>
          <button
            onClick={() => setModalState({ type: 'milk', mode: 'create', isOpen: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + 追加
          </button>
        </div>
      </div>
    );
  };

  // 概要タブのレンダリング
  const renderOverviewTab = () => {
    if (!selectedClass || !selectedDate) {
      return (
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="text-center py-12 text-gray-500">
            クラスと日付を選択してください
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* クラス全体の環境記録 */}
        {roomEnvironment && (
          <div className="bg-white p-6 rounded-md shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdHome className="text-blue-600" size={24} />
              クラス全体の環境記録
            </h3>
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <MdThermostat className="text-red-500" size={20} />
                室温: <span className="font-medium text-gray-900">{roomEnvironment.temperature}℃</span>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <MdWbSunny className="text-blue-500" size={20} />
                湿度: <span className="font-medium text-gray-900">{roomEnvironment.humidity}%</span>
              </div>
              <div className="text-sm text-green-600 font-medium">
                ✓ 適正範囲
              </div>
              <div className="text-sm text-gray-500 ml-auto">
                記録時刻: {roomEnvironment.recordTime} (午睡開始時)
              </div>
            </div>
          </div>
        )}

        {/* 園児別サマリー */}
        {(classChildren?.children || []).map((child) => (
          <div key={child.childId} className="bg-white rounded-md shadow-md overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MdChildCare className="text-pink-500" size={32} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {child.childName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {Math.floor(child.ageMonths / 12)}歳{child.ageMonths % 12}ヶ月
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 記録サマリー */}
            <div className="p-6 space-y-3">
              {/* ミルク */}
              {(milkRecords || []).filter(r => r.childId === child.childId).length > 0 && (
                <div className="flex items-start gap-3">
                  <MdLocalDrink className="text-cyan-500 mt-0.5" size={24} />
                  <div>
                    <span className="font-medium text-gray-700">ミルク:</span>
                    <span className="ml-2 text-gray-900">
                      {(milkRecords || [])
                        .filter(r => r.childId === child.childId)
                        .map(r => `${r.milkTime}(${r.amountMl}mL)`)
                        .join(' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 食事 */}
              {(mealRecords || []).filter(r => r.childId === child.childId).length > 0 && (
                <div className="flex items-start gap-3">
                  <MdRestaurant className="text-green-500 mt-0.5" size={24} />
                  <div>
                    <span className="font-medium text-gray-700">食事:</span>
                    <span className="ml-2 text-gray-900">
                      {(mealRecords || [])
                        .filter(r => r.childId === child.childId)
                        .map(r => `${mealTypeLabels[r.mealType] || r.mealType}:${r.mealTime}:${mealAmountLabels[r.overallAmount || ''] || r.overallAmount || '未記録'}`)
                        .join(' / ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 機嫌 */}
              {(moodRecords || []).filter(r => r.childId === child.childId).length > 0 && (
                <div className="flex items-start gap-3">
                  <MdSentimentSatisfied className="text-pink-500 mt-0.5" size={24} />
                  <div>
                    <span className="font-medium text-gray-700">機嫌:</span>
                    <span className="ml-2 text-gray-900">
                      {(moodRecords || [])
                        .filter(r => r.childId === child.childId)
                        .map(r => `${r.moodTime}=${r.moodState}`)
                        .join(' / ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 排泄 */}
              {(toiletingRecords || []).filter(r => r.childId === child.childId).length > 0 && (
                <div className="flex items-start gap-3">
                  <MdBabyChangingStation className="text-orange-500 mt-0.5" size={24} />
                  <div>
                    <span className="font-medium text-gray-700">排泄:</span>
                    <span className="ml-2 text-gray-900">
                      {(toiletingRecords || [])
                        .filter(r => r.childId === child.childId)
                        .map(r => `${r.toiletingTime} ${r.toiletingType}`)
                        .join(' / ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 午睡 */}
              {(sleepRecords || []).filter(r => r.childId === child.childId).length > 0 && (
                <div className="flex items-start gap-3">
                  <MdHotel className="text-purple-500 mt-0.5" size={24} />
                  <div>
                    <span className="font-medium text-gray-700">午睡:</span>
                    <span className="ml-2 text-gray-900">
                      {(sleepRecords || [])
                        .filter(r => r.childId === child.childId)
                        .map(r => `${r.startTime}〜${r.endTime || '睡眠中'} (${r.sleepQuality || '-'})`)
                        .join(' / ')}
                    </span>
                  </div>
                </div>
              )}

              {/* データなしメッセージ */}
              {(milkRecords || []).filter(r => r.childId === child.childId).length === 0 &&
               (mealRecords || []).filter(r => r.childId === child.childId).length === 0 &&
               (moodRecords || []).filter(r => r.childId === child.childId).length === 0 &&
               (toiletingRecords || []).filter(r => r.childId === child.childId).length === 0 &&
               (sleepRecords || []).filter(r => r.childId === child.childId).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  本日の記録がまだありません
                </div>
              )}
            </div>
          </div>
        ))}

        {/* クイック操作 */}
        <div className="bg-white p-6 rounded-md shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MdRocketLaunch className="text-blue-600" size={24} />
            クイック操作
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/desktop/infant-records/class-temperature', {
                state: { classId: selectedClass, date: selectedDate }
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MdThermostat size={20} />
              クラス体温一覧入力
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <MdAssessment size={20} />
              日次レポート
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <MdChecklist size={20} />
              午睡チェック表
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'milk':
        return renderMilkTab();
      case 'meals':
        // 英語の定数値を日本語ラベルに変換（表示用）
        const translatedMealRecords = (mealRecords || []).map(record => ({
          ...record,
          mealType: mealTypeLabels[record.mealType] || record.mealType,
          overallAmount: record.overallAmount ? (mealAmountLabels[record.overallAmount] || record.overallAmount) : '-',
          notes: record.notes || '-', // メモを追加
        }));
        return renderSimpleTab(
          '食事記録',
          [
            { label: '園児名', key: 'childName' },
            { label: '種別', key: 'mealType' },
            { label: '時刻', key: 'mealTime' },
            { label: '摂取量', key: 'overallAmount' },
            { label: 'メモ', key: 'notes' },
          ],
          translatedMealRecords,
          undefined,
          undefined,
          () => setModalState({ type: 'meal', mode: 'create', isOpen: true }),
          // 編集時は元のレコード（英語値）を渡す
          (record) => {
            const originalRecord = mealRecords.find(r =>
              r.childId === record.childId &&
              r.recordDate === record.recordDate &&
              r.mealTime === record.mealTime
            );
            setModalState({ type: 'meal', mode: 'edit', isOpen: true, data: originalRecord || record });
          },
          (record) => handleDeleteMeal(record)
        );
      case 'sleep':
        return renderSimpleTab(
          '午睡記録',
          [
            { label: '園児名', key: 'childName' },
            { label: '午睡', key: 'sleepSequence' },
            { label: '開始', key: 'startTime' },
            { label: '終了', key: 'endTime' },
            { label: '質', key: 'quality' },
            { label: 'メモ', key: 'notes' },
          ],
          sleepRecords || [],
          undefined,
          undefined,
          () => setModalState({ type: 'sleep', mode: 'create', isOpen: true }),
          (record) => setModalState({ type: 'sleep', mode: 'edit', isOpen: true, data: record }),
          (record) => handleDeleteSleep(record)
        );
      case 'sleep-check':
        return (
          <div className="bg-white p-6 rounded-md shadow-md">
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">午睡チェック表(監査対応)</p>
              <p className="text-gray-500 text-sm mt-2">
                横軸時間型の午睡チェック表(5分間隔)・体位・呼吸状態など
              </p>
              <p className="text-gray-500 text-sm mt-4">
                ※ 横軸時間型チェック表の実装は別途対応予定
              </p>
            </div>
          </div>
        );
      case 'toileting':
        return renderSimpleTab(
          '排泄記録',
          [
            { label: '園児名', key: 'childName' },
            { label: 'おしっこ', key: 'urineCount' },
            { label: 'うんち', key: 'bowelCount' },
            { label: '状態', key: 'bowelCondition' },
            { label: 'メモ', key: 'notes' },
          ],
          toiletingRecords || [],
          undefined,
          undefined,
          () => setModalState({ type: 'toileting', mode: 'create', isOpen: true }),
          (record) => setModalState({ type: 'toileting', mode: 'edit', isOpen: true, data: record }),
          (record) => handleDeleteToileting(record)
        );
      case 'temperature':
        return renderSimpleTab('体温記録(個別園児モード)', [
          { label: '園児名', key: 'childName' },
          { label: '測定時刻', key: 'time' },
          { label: '体温', key: 'temperature' },
          { label: '測定箇所', key: 'location' },
          { label: '入力者', key: 'recorder' },
          { label: 'メモ', key: 'notes' },
        ], [
          { childName: '山田太郎', time: '09:00 (朝)', temperature: '36.5℃', location: '脇下', recorder: '山田', notes: '-' },
          { childName: '山田太郎', time: '14:00 (午後)', temperature: '36.8℃', location: '脇下', recorder: '佐藤', notes: '-' },
          { childName: '佐藤花子', time: '09:05 (朝)', temperature: '36.7℃', location: '脇下', recorder: '山田', notes: '-' },
          { childName: '鈴木一郎', time: '09:10 (朝)', temperature: '36.6℃', location: '脇下', recorder: '山田', notes: '-' },
        ], undefined, (
          <button
            onClick={() => navigate('/desktop/infant-records/class-temperature', {
              state: { classId: selectedClass, date: selectedDate }
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            クラス一覧入力モードに切替
          </button>
        ));
      case 'mood':
        return renderSimpleTab(
          '機嫌記録',
          [
            { label: '園児名', key: 'childName' },
            { label: '時刻', key: 'moodTime' },
            { label: '機嫌状態', key: 'moodState' },
            { label: 'メモ', key: 'notes' },
          ],
          moodRecords || [],
          undefined,
          undefined,
          () => setModalState({ type: 'mood', mode: 'create', isOpen: true }),
          (record) => setModalState({ type: 'mood', mode: 'edit', isOpen: true, data: record }),
          (record) => handleDeleteMood(record)
        );
      case 'environment':
        return (
          <div className="bg-white rounded-md shadow-md p-6">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setModalState({ type: 'environment', mode: roomEnvironment ? 'edit' : 'create', isOpen: true, data: roomEnvironment })}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                {roomEnvironment ? '環境記録を編集' : '環境記録を追加'}
              </button>
            </div>

            {roomEnvironment ? (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  現在の環境記録
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 記録時刻カード */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 shadow-md border border-purple-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">記録時刻</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {new Date(roomEnvironment.recordedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 室温カード */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow-md border border-orange-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">室温</p>
                        <p className="text-3xl font-bold text-orange-900">{roomEnvironment.temperature}<span className="text-xl">℃</span></p>
                      </div>
                    </div>
                  </div>

                  {/* 湿度カード */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-md border border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">湿度</p>
                        <p className="text-3xl font-bold text-blue-900">{roomEnvironment.humidity}<span className="text-xl">%</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* メモ欄 */}
                {roomEnvironment.notes && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">メモ</p>
                        <p className="text-gray-900">{roomEnvironment.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg mb-2">環境記録がまだ登録されていません</p>
                <p className="text-gray-500 text-sm">上のボタンから環境記録を追加してください</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Render modals
  const renderModals = () => (
    <>
      <InfantMilkModal
        isOpen={modalState.type === 'milk' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveMilk}
        mode={modalState.mode}
        initialData={modalState.data}
        children={classChildren.children}
        recordDate={selectedDate}
      />

      <InfantMealModal
        isOpen={modalState.type === 'meal' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveMeal}
        mode={modalState.mode}
        initialData={modalState.data}
        children={classChildren.children}
        recordDate={selectedDate}
      />

      <InfantSleepModal
        isOpen={modalState.type === 'sleep' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveSleep}
        mode={modalState.mode}
        initialData={modalState.data}
        children={classChildren.children}
        recordDate={selectedDate}
      />

      <InfantToiletingModal
        isOpen={modalState.type === 'toileting' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveToileting}
        mode={modalState.mode}
        initialData={modalState.data}
        children={classChildren.children}
        recordDate={selectedDate}
      />

      <InfantMoodModal
        isOpen={modalState.type === 'mood' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveMood}
        mode={modalState.mode}
        initialData={modalState.data}
        children={classChildren.children}
        recordDate={selectedDate}
      />

      <RoomEnvironmentModal
        isOpen={modalState.type === 'environment' && modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onSave={handleSaveEnvironment}
        mode={modalState.mode}
        initialData={modalState.data}
        classId={selectedClass}
        recordDate={selectedDate}
      />

      <DeleteConfirmModal
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState({ isOpen: false, recordType: '' })}
        onConfirm={deleteState.onConfirm || (async () => {})}
        recordType={deleteState.recordType}
        recordDetails={deleteState.recordData}
      />
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">生活記録管理</h1>
            <button
              onClick={() => navigate('/desktop/infant-records')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MdArrowBack className="w-5 h-5" />
              <span>戻る</span>
            </button>
          </div>
        </div>

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
                    onClick={() => setSelectedClass(cls.classId)}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      selectedClass === cls.classId
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
                日付
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

        {/* タブメニュー - Yahoo Japan風デザイン */}
        <div className="bg-white rounded-md shadow-md overflow-hidden">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex bg-gray-50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    activeTab === tab.id
                      ? 'relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 bg-white text-blue-600 shadow-sm border-0'
                      : 'relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 text-gray-700 hover:text-blue-600 hover:bg-gray-100 border-0'
                  }
                  style={activeTab === tab.id ? { borderBottom: '3px solid #2563eb', marginBottom: '-1px' } : { border: 'none' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">{renderTabContent()}</div>
        </div>

        {/* Modals */}
        {renderModals()}
      </div>
    </DashboardLayout>
  );
}
