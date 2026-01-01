import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { attendanceService } from '../services/attendanceService';
import { masterService } from '../services/masterService';
import type { AttendanceDto, UpdateAttendanceRequest, UpdateAttendanceNotesRequest, BulkPresentRequest } from '../types/attendance';
import type { ClassDto } from '../types/master';

// 園児ごとの5日間のデータ
interface ChildAttendanceGrid {
  childId: number;
  childName: string;
  attendances: AttendanceDto[]; // 5日分（最新日が[0]、過去4日分が[1]~[4]）
}

export function AttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URLパラメータからclassIdとdateを取得
  const urlClassId = searchParams.get('classId');
  const urlDate = searchParams.get('date');

  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || ''); // URLパラメータがあれば優先
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
  const [attendanceGrid, setAttendanceGrid] = useState<ChildAttendanceGrid[]>([]);
  const [dateRange, setDateRange] = useState<string[]>([]); // 5日間の日付配列
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 備考モーダル関連
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedChildForNotes, setSelectedChildForNotes] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // クラス一覧取得
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await masterService.getClasses();
        setClasses(data);
        // 初期状態ではクラスを選択しない
      } catch (err) {
        console.error('クラス一覧取得エラー:', err);
        setError('クラス一覧の取得に失敗しました');
      }
    };
    fetchClasses();
  }, []);

  // 日付範囲を計算（selectedDateから過去5日間）
  useEffect(() => {
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setDateRange(dates);
  }, [selectedDate]);

  // 出欠状況取得（5日間分）
  useEffect(() => {
    if (selectedClassId && dateRange.length === 5) {
      fetchAttendances();
    } else {
      setAttendanceGrid([]); // クラス未選択時は空にする
    }
  }, [selectedClassId, dateRange]);

  const fetchAttendances = async () => {
    if (!selectedClassId || dateRange.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      // 5日間分のデータを取得
      const startDate = dateRange[4]; // 最古の日
      const endDate = dateRange[0]; // 最新の日

      console.log('📅 Fetching attendance data:', { selectedClassId, startDate, endDate, dateRange });

      const historyData = await attendanceService.getAttendanceHistory(
        selectedClassId,
        startDate,
        endDate
      );

      console.log('📊 API Response:', historyData);
      console.log('📊 Response type:', typeof historyData);
      console.log('📊 Response keys:', historyData ? Object.keys(historyData) : 'null/undefined');

      // historyDataの構造を確認（大文字・小文字の違いに対応）
      const attendancesList = (historyData as any)?.Attendances || (historyData as any)?.attendances || [];
      console.log('📊 Attendances list length:', attendancesList.length);

      // 園児リストを先に取得（最新日のデータから）
      const latestDayData = await attendanceService.getAttendanceByClassAndDate(
        selectedClassId,
        dateRange[0] // 最新日
      );

      console.log('👶 Latest day children:', latestDayData);

      // 園児ごとにグループ化（最新日のデータから全園児を取得）
      const childMap = new Map<number, ChildAttendanceGrid>();

      latestDayData.forEach((record) => {
        childMap.set(record.childId, {
          childId: record.childId,
          childName: record.childName || '',
          attendances: [],
        });
      });

      // 各日付のデータを配列に格納（日付順にソート）
      dateRange.forEach((date) => {
        const dayRecords = attendancesList.filter((r: any) => {
          const recordDate = r.attendanceDate || r.AttendanceDate;
          // ISO datetime string (e.g., "2025-11-16T00:00:00") を YYYY-MM-DD に正規化
          const normalizedDate = typeof recordDate === 'string' 
            ? recordDate.split('T')[0] 
            : recordDate;
          return normalizedDate === date;
        });

        console.log(`📆 Date ${date} records:`, dayRecords);

        // 各園児のその日のデータを設定
        childMap.forEach((child) => {
          const attendance = dayRecords.find((r: any) => {
            const rChildId = r.childId || r.ChildId;
            return rChildId === child.childId;
          });
          if (attendance) {
            child.attendances.push(attendance);
          } else {
            // データがない場合はblankステータスのダミーデータ
            child.attendances.push({
              nurseryId: 1,
              childId: child.childId,
              childName: child.childName,
              attendanceDate: date,
              status: 'blank',
            } as AttendanceDto);
          }
        });
      });

      const gridData = Array.from(childMap.values());
      console.log('🎯 Final grid data:', gridData);

      setAttendanceGrid(gridData);
    } catch (err) {
      console.error('出欠状況取得エラー:', err);
      setError('出欠状況の取得に失敗しました');
    } finally {
      setLoading(false);
    }
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

  // ステータスサイクル（最新日のみ）
  const cycleStatus = async (childId: number) => {
    const child = attendanceGrid.find((c) => c.childId === childId);
    if (!child) return;

    const currentAttendance = child.attendances[0]; // attendances[0]は常に最新日（selectedDate）
    const statusCycle: Array<AttendanceDto['status']> = ['blank', 'present', 'absent', 'late'];
    const currentIndex = statusCycle.indexOf(currentAttendance.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    const nurseryData = localStorage.getItem('desktop_nursery');
    if (!nurseryData) {
      setError('認証情報が取得できません');
      return;
    }

    const nursery = JSON.parse(nurseryData);
    const nurseryId = nursery.id;
    const staffId = 1;

    const request: UpdateAttendanceRequest = {
      status: nextStatus,
      recordedByStaffId: staffId,
      recordedByStaffNurseryId: nurseryId,
    };

    try {
      // チラつき防止: loadingフラグを使わず、楽観的UI更新
      // まずローカルステートを即座に更新
      setAttendanceGrid((prev) =>
        prev.map((c) =>
          c.childId === childId
            ? {
                ...c,
                attendances: c.attendances.map((a, index) =>
                  index === 0 ? { ...a, status: nextStatus } : a
                ),
              }
            : c
        )
      );

      // バックグラウンドでAPIリクエスト
      await attendanceService.updateAttendance(childId, selectedDate, request);
    } catch (err: any) {
      console.error('ステータス更新エラー:', err);
      setError(err.response?.data?.message || 'ステータスの更新に失敗しました');

      // エラー時は元のステータスに戻す
      setAttendanceGrid((prev) =>
        prev.map((c) =>
          c.childId === childId
            ? {
                ...c,
                attendances: c.attendances.map((a, index) =>
                  index === 0 ? { ...a, status: currentAttendance.status } : a
                ),
              }
            : c
        )
      );

      setTimeout(() => setError(null), 5000);
    }
  };

  // ステータス表示スタイル
  const getStatusStyle = (status: AttendanceDto['status']) => {
    switch (status) {
      case 'present':
        return { backgroundColor: '#dcfce7', color: '#166534', text: '出席' };
      case 'absent':
        return { backgroundColor: '#fee2e2', color: '#991b1b', text: '欠席' };
      case 'late':
        return { backgroundColor: '#fef3c7', color: '#92400e', text: '遅刻' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#64748b', text: '-' };
    }
  };

  // 一括出席登録（最新日のみ）
  const handleBulkPresent = async () => {
    const nurseryData = localStorage.getItem('desktop_nursery');
    if (!nurseryData) {
      setError('認証情報が取得できません');
      return;
    }

    const nursery = JSON.parse(nurseryData);
    const nurseryId = nursery.id;
    const staffId = 1;

    if (!confirm('クラス全員を出席として登録しますか？（既に記録済みの園児はスキップされます）')) {
      return;
    }

    const request: BulkPresentRequest = {
      nurseryId,
      classId: selectedClassId,
      date: selectedDate,
      recordedByStaffId: staffId,
      recordedByStaffNurseryId: nurseryId,
    };

    setLoading(true);
    try {
      await attendanceService.bulkPresent(request);
      await fetchAttendances();
    } catch (err: any) {
      console.error('一括出席登録エラー:', err);
      setError(err.response?.data?.message || '一括出席登録に失敗しました');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // 備考モーダルを開く（最新日の備考のみ）
  const openNotesModal = (childId: number, currentNotes: string) => {
    setSelectedChildForNotes(childId);
    setNotesInput(currentNotes || '');
    setIsNotesModalOpen(true);
  };

  // 備考モーダルを閉じる
  const closeNotesModal = () => {
    setIsNotesModalOpen(false);
    setSelectedChildForNotes(null);
    setNotesInput('');
  };

  // 備考を保存（最新日のみ）
  const handleSaveNotes = async () => {
    if (selectedChildForNotes === null) return;

    const nurseryData = localStorage.getItem('desktop_nursery');
    if (!nurseryData) {
      setError('認証情報が取得できません');
      return;
    }

    const nursery = JSON.parse(nurseryData);
    const nurseryId = nursery.id;
    const staffId = 1;

    const request: UpdateAttendanceNotesRequest = {
      notes: notesInput,
      updatedByStaffId: staffId,
      updatedByStaffNurseryId: nurseryId,
    };

    try {
      // チラつき防止: ローカルステートを即座に更新
      setAttendanceGrid((prev) =>
        prev.map((c) =>
          c.childId === selectedChildForNotes
            ? {
                ...c,
                attendances: c.attendances.map((a, index) =>
                  index === 0 ? { ...a, notes: notesInput } : a
                ),
              }
            : c
        )
      );

      await attendanceService.updateAttendanceNotes(selectedChildForNotes, selectedDate, request);
      closeNotesModal();
    } catch (err: any) {
      console.error('備考更新エラー:', err);
      setError(err.response?.data?.message || '備考の更新に失敗しました');
      setTimeout(() => setError(null), 5000);
    }
  };

  // 日付フォーマット（MM/DD）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 統計情報（最新日のみ）
  const latestDayStats = attendanceGrid.length > 0
    ? {
        total: attendanceGrid.length,
        present: attendanceGrid.filter((c) => c.attendances[0]?.status === 'present').length,
        absent: attendanceGrid.filter((c) => c.attendances[0]?.status === 'absent').length,
        late: attendanceGrid.filter((c) => c.attendances[0]?.status === 'late').length,
        blank: attendanceGrid.filter((c) => c.attendances[0]?.status === 'blank').length,
      }
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">出欠表管理</h1>
          <button
            onClick={handleBulkPresent}
            disabled={loading || !selectedClassId}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            クラス全員を出席に
          </button>
        </div>

        {/* メッセージ表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* フィルター */}
        <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
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
                基準日選択（最新日）
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                  title="前日"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
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
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 統計情報（最新日のみ） */}
        {latestDayStats && (
          <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">最新日（{formatDate(selectedDate)}）の統計</div>
              <button
                onClick={() => navigate('/desktop/attendance/report')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                詳細レポート
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {latestDayStats.total}
                </div>
                <div className="text-sm text-gray-600 mt-1">総人数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {latestDayStats.present}
                </div>
                <div className="text-sm text-gray-600 mt-1">出席</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {latestDayStats.absent}
                </div>
                <div className="text-sm text-gray-600 mt-1">欠席</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {latestDayStats.late}
                </div>
                <div className="text-sm text-gray-600 mt-1">遅刻</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">
                  {latestDayStats.blank}
                </div>
                <div className="text-sm text-gray-600 mt-1">未記録</div>
              </div>
            </div>
          </div>
        )}

        {/* 出欠表（5日間グリッド） */}
        {loading ? (
          <div className="bg-white p-8 rounded-md shadow-md border border-gray-200 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : !selectedClassId ? (
          <div className="bg-white p-8 rounded-md shadow-md border border-gray-200 text-center text-gray-500">
            クラスを選択してください
          </div>
        ) : attendanceGrid.length === 0 ? (
          <div className="bg-white p-8 rounded-md shadow-md border border-gray-200 text-center text-gray-500">
            このクラスには園児がいません
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-md border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    園児名
                  </th>
                  {/* 日付を逆順で表示（過去4日 → 最新日の順） */}
                  {[...dateRange].reverse().map((date, index) => (
                    <th
                      key={date}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div>{formatDate(date)}</div>
                      {index === dateRange.length - 1 && (
                        <div className="text-xs text-blue-600 mt-1">(編集可)</div>
                      )}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    備考
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceGrid.map((child, rowIndex) => (
                  <tr
                    key={child.childId}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                      {child.childName}
                    </td>
                    {/* 日付を逆順で表示（過去4日 → 最新日の順） */}
                    {[...child.attendances].reverse().map((attendance, colIndex) => {
                      const statusStyle = getStatusStyle(attendance.status);
                      const isLatestDay = colIndex === child.attendances.length - 1;

                      return (
                        <td key={colIndex} className="px-4 py-4 whitespace-nowrap text-center">
                          {isLatestDay ? (
                            // 最新日: クリック可能なボタン
                            <button
                              onClick={() => cycleStatus(child.childId)}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-md text-xs font-bold min-w-[60px] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: statusStyle.backgroundColor,
                                color: statusStyle.color,
                              }}
                            >
                              {statusStyle.text}
                            </button>
                          ) : (
                            // 過去4日: 表示のみ
                            <div
                              className="inline-block px-3 py-1.5 rounded-md text-xs font-bold min-w-[60px]"
                              style={{
                                backgroundColor: statusStyle.backgroundColor,
                                color: statusStyle.color,
                              }}
                            >
                              {statusStyle.text}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {/* 備考ボタン（一番右） */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => openNotesModal(child.childId, child.attendances[0]?.notes || '')}
                        className={`p-2 rounded-md transition-colors ${
                          child.attendances[0]?.notes
                            ? 'bg-yellow-100 border border-yellow-300'
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                        title="備考を編集"
                      >
                        <svg
                          className={`w-5 h-5 ${
                            child.attendances[0]?.notes ? 'text-yellow-700' : 'text-gray-500'
                          }`}
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
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 備考入力モーダル */}
      {isNotesModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={closeNotesModal}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-md shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                備考入力（{formatDate(selectedDate)}）
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備考
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="備考を入力してください"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeNotesModal}
                  className="px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:shadow-md transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-md transition-all duration-200"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
