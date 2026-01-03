import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../desktop/components/layout/DashboardLayout';
import WeeklyMatrixTable from './WeeklyMatrixTable';
import EditModal from './EditModal';
import { getWeeklyRecords, updateTemperature, updateMeal, updateMood, updateSleep, updateToileting, upsertMeal, upsertMood, upsertToileting, upsertTemperature } from '../../../api/infantRecordsApi';
import { getWeekStart, formatWeekRange, formatDateKey } from '../../../utils/infantRecordFormatters';
import { masterService } from '../../../desktop/services/masterService';
import type { WeeklyRecordResponse, EditingCell, UpdateTemperatureDto, UpdateMealDto, UpdateMoodDto, UpdateSleepDto, UpdateToiletingDto } from '../../../types/infantRecords';
import type { ClassDto } from '../../../desktop/types/master';

const InfantRecordsWeeklyPage: React.FC = () => {
  const [weekStartDate, setWeekStartDate] = useState<Date>(getWeekStart(new Date()));
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [weeklyData, setWeeklyData] = useState<WeeklyRecordResponse | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // クラス一覧を取得
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classList = await masterService.getClasses();
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].classId);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('クラス一覧の取得に失敗しました');
      }
    };

    fetchClasses();
  }, []);

  // 週次データを取得
  useEffect(() => {
    if (selectedClassId) {
      fetchWeeklyData();
    }
  }, [weekStartDate, selectedClassId]);

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateKey = formatDateKey(weekStartDate);

      console.log('📅 Fetching weekly records:', { selectedClassId, dateKey });
      const data = await getWeeklyRecords(selectedClassId, dateKey);
      console.log('✅ Weekly data received:', data);
      setWeeklyData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'データの取得に失敗しました');
      console.error('❌ Error fetching weekly records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekChange = (days: number) => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + days);
    setWeekStartDate(newDate);
  };

  const handleCellClick = (cell: EditingCell) => {
    setEditingCell(cell);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCell(null);
  };

  const handleSave = async (value: any) => {
    if (!editingCell) return;

    try {
      switch (editingCell.recordType) {
        case 'temperature':
          // Upsert APIを使用（新規作成または更新）
          // measurementTypeをPascalCaseに変換 (morning -> Morning, afternoon -> Afternoon)
          const measurementType = editingCell.measurementType
            ? editingCell.measurementType.charAt(0).toUpperCase() + editingCell.measurementType.slice(1)
            : 'Morning';

          await upsertTemperature(
            editingCell.childId,
            editingCell.date,
            measurementType,
            value.value,
            value.time
          );

          // 楽観的更新
          setWeeklyData(prevData => {
            if (!prevData) return prevData;
            const newData = { ...prevData };
            newData.children = prevData.children.map(child => {
              if (child.childId !== editingCell.childId) return child;
              const newChild = { ...child };
              const record = { ...newChild.dailyRecords[editingCell.date] };

              if (editingCell.measurementType === 'morning') {
                record.morning = { ...record.morning, temperature: { value: value.value, time: value.time, readonly: false } };
              } else if (editingCell.measurementType === 'afternoon') {
                record.afternoon = { ...record.afternoon, temperature: { value: value.value, time: value.time, readonly: false } };
              }

              newChild.dailyRecords = { ...newChild.dailyRecords, [editingCell.date]: record };
              return newChild;
            });
            return newData;
          });
          break;

        case 'meal':
          if (editingCell.recordId) {
            const dto: UpdateMealDto = {
              amount: value.amount
            };
            await updateMeal(editingCell.recordId, dto);
          }
          break;

        case 'mood':
          if (editingCell.recordId) {
            const dto: UpdateMoodDto = {
              state: value.state
            };
            await updateMood(editingCell.recordId, dto);
          }
          break;

        case 'sleep':
          if (editingCell.recordId) {
            const dto: UpdateSleepDto = {
              startTime: value.start,
              endTime: value.end
            };
            await updateSleep(editingCell.recordId, dto);
            
            // 楽観的更新
            setWeeklyData(prevData => {
              if (!prevData) return prevData;
              const newData = { ...prevData };
              newData.children = prevData.children.map(child => {
                if (child.childId !== editingCell.childId) return child;
                const newChild = { ...child };
                const record = { ...newChild.dailyRecords[editingCell.date] };
                record.afternoon = { ...record.afternoon, nap: { id: editingCell.recordId!, startTime: value.start, endTime: value.end } };
                newChild.dailyRecords = { ...newChild.dailyRecords, [editingCell.date]: record };
                return newChild;
              });
              return newData;
            });
          }
          break;

        case 'toileting':
          const dto: UpdateToiletingDto = {
            urineAmount: value.urineAmount,
            bowelCondition: value.bowelCondition,
            bowelColor: value.bowelColor,
            diaperChangeCount: value.diaperChangeCount
          };
          await updateToileting(editingCell.childId, editingCell.date, dto);
          
          // 楽観的更新
          setWeeklyData(prevData => {
            if (!prevData) return prevData;
            const newData = { ...prevData };
            newData.children = prevData.children.map(child => {
              if (child.childId !== editingCell.childId) return child;
              const newChild = { ...child };
              const record = { ...newChild.dailyRecords[editingCell.date] };
              record.toileting = {
                id: editingCell.recordId,
                urineAmount: value.urineAmount,
                bowelCondition: value.bowelCondition,
                bowelColor: value.bowelColor,
                diaperChangeCount: value.diaperChangeCount
              };
              newChild.dailyRecords = { ...newChild.dailyRecords, [editingCell.date]: record };
              return newChild;
            });
            return newData;
          });
          break;

        default:
          throw new Error('Unknown record type');
      }

      // データ再取得を削除（楽観的更新のみ）
      console.log('✅ Save successful');
    } catch (err: any) {
      // エラー時のみデータを再取得
      await fetchWeeklyData();
      throw new Error(err.response?.data?.error || '保存に失敗しました');
    }
  };

  const handleDropdownChange = async (params: {
    childId: number;
    date: string;
    recordType: string;
    value: string;
    subType?: string;
  }) => {
    try {
      console.log('📝 Dropdown change:', params);

      // 楽観的更新: UIを即座に更新
      setWeeklyData(prevData => {
        if (!prevData) return prevData;
        
        const newData = { ...prevData };
        newData.children = prevData.children.map(child => {
          if (child.childId !== params.childId) return child;
          
          const newChild = { ...child };
          const record = { ...newChild.dailyRecords[params.date] };
          
          if (params.recordType === 'meal') {
            if (params.subType === 'morning-snack') {
              record.morning = { ...record.morning, snack: { ...record.morning?.snack, amount: params.value } as any };
            } else if (params.subType === 'lunch') {
              record.afternoon = { ...record.afternoon, lunch: { ...record.afternoon?.lunch, amount: params.value } as any };
            } else if (params.subType === 'afternoon-snack') {
              record.afternoon = { ...record.afternoon, snack: { ...record.afternoon?.snack, amount: params.value } as any };
            }
          } else if (params.recordType === 'mood') {
            if (params.subType === 'morning') {
              record.morning = { ...record.morning, mood: { ...record.morning?.mood, state: params.value } as any };
            } else if (params.subType === 'afternoon') {
              record.afternoon = { ...record.afternoon, mood: { ...record.afternoon?.mood, state: params.value } as any };
            }
          } else if (params.recordType === 'toileting') {
            if (params.subType === 'urine') {
              // urineAmountは文字列 ('Little', 'Normal', 'Lot')
              record.toileting = { ...record.toileting, urineAmount: params.value } as any;
            } else if (params.subType === 'diaper') {
              // diaperChangeCountは数値
              record.toileting = { ...record.toileting, diaperChangeCount: parseInt(params.value) || 0 } as any;
            }
          }
          
          newChild.dailyRecords = { ...newChild.dailyRecords, [params.date]: record };
          return newChild;
        });
        
        return newData;
      });

      switch (params.recordType) {
        case 'meal': {
          // MealTypeのマッピング (午前おかし=Breakfast, 昼食=Lunch, 午後おかし=Snack)
          let mealType = '';
          if (params.subType === 'morning-snack') {
            mealType = 'Breakfast';
          } else if (params.subType === 'lunch') {
            mealType = 'Lunch';
          } else if (params.subType === 'afternoon-snack') {
            mealType = 'Snack';
          }

          // Upsert APIを使用（新規作成または更新）
          await upsertMeal(
            params.childId,
            params.date,
            mealType,
            params.value
          );
          break;
        }

        case 'mood': {
          // MoodTimeのマッピング
          const moodTime = params.subType === 'morning' ? 'Morning' : 'Afternoon';

          // Upsert APIを使用（新規作成または更新）
          await upsertMood(
            params.childId,
            params.date,
            moodTime,
            params.value
          );
          break;
        }

        case 'toileting': {
          const child = weeklyData?.children.find(c => c.childId === params.childId);
          const record = child?.dailyRecords[params.date];
          const currentToileting = record?.toileting;

          // Upsert APIを使用（新規作成または更新）
          if (params.subType === 'urine') {
            await upsertToileting(
              params.childId,
              params.date,
              params.value, // urineAmount
              currentToileting?.bowelCondition,
              currentToileting?.bowelColor,
              currentToileting?.diaperChangeCount
            );
          } else if (params.subType === 'diaper') {
            await upsertToileting(
              params.childId,
              params.date,
              currentToileting?.urineAmount,
              currentToileting?.bowelCondition,
              currentToileting?.bowelColor,
              parseInt(params.value) || 0 // diaperChangeCount
            );
          } else {
            throw new Error('Unknown toileting subtype');
          }
          break;
        }

        default:
          throw new Error('Unknown record type');
      }

      // 成功時はデータ再取得なし（楽観的更新のみ）
      console.log('✅ Dropdown save successful');
    } catch (err: any) {
      console.error('❌ Dropdown save error:', err);
      setError(err.response?.data?.error || 'ドロップダウンの保存に失敗しました');
      // エラー時のみデータを再取得して元に戻す
      await fetchWeeklyData();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 -mt-4">
        {/* ページヘッダー */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">生活記録</h1>
        </div>

        {/* コントロールセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* 週選択 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleWeekChange(-7)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                前週
              </button>
              <span className="text-base font-semibold text-gray-900 min-w-[240px] text-center">
                {formatWeekRange(weekStartDate)}
              </span>
              <button
                onClick={() => handleWeekChange(7)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次週
                <svg className="h-5 w-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* クラス選択 */}
            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="class-select" className="text-sm font-medium text-gray-700">
                クラス:
              </label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isLoading}
                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
              <button
                onClick={fetchWeeklyData}
                className="text-sm font-medium text-red-600 hover:text-red-500"
              >
                再試行
              </button>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-sm text-gray-600">データを読み込んでいます...</p>
            </div>
          </div>
        ) : !error && selectedClassId ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {console.log('🎨 Rendering table with data:', {
              hasData: !!weeklyData,
              childrenCount: weeklyData?.children?.length || 0,
              weekStartDate
            })}
            <WeeklyMatrixTable
              weekStartDate={weekStartDate}
              children={weeklyData?.children || []}
              onCellClick={handleCellClick}
              onDropdownChange={handleDropdownChange}
            />
            {(!weeklyData || weeklyData.children.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                <p>選択されたクラスに園児が登録されていません</p>
              </div>
            )}
          </div>
        ) : null}

        {/* 編集モーダル */}
        <EditModal
          isOpen={isModalOpen}
          editingCell={editingCell}
          onSave={handleSave}
          onClose={handleModalClose}
        />
      </div>
    </DashboardLayout>
  );
};

export default InfantRecordsWeeklyPage;
