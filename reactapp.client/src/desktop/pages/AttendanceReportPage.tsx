import React, { useState, useEffect } from 'react';
import { MdCalendarToday, MdRefresh, MdArrowBack, MdShowChart } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { getAttendanceStatistics, getMonthlyStatistics } from '../../services/attendanceStatisticsService';
import { masterService } from '../services/masterService';
import type {
  AttendanceStatisticsRequest,
  AttendanceStatisticsResponse,
  ClassStatistics,
  MonthlyAttendanceStats
} from '../../types/attendanceStatistics';
import type { ClassDto } from '../types/master';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AttendanceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [nurseryId] = useState<number>(1); // TODO: Get from auth context
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassDto[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatisticsResponse | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyAttendanceStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showGraphs, setShowGraphs] = useState<boolean>(false);

  // Initialize date range (last 30 days) and fetch classes
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);

    // Fetch available classes from API
    const fetchClasses = async () => {
      try {
        const classes = await masterService.getClasses();
        setAvailableClasses(classes);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
        setError('クラス一覧の取得に失敗しました。');
      }
    };
    fetchClasses();
  }, []);

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleFetchStatistics = async () => {
    if (!dateFrom || !dateTo) {
      setError('開始日と終了日を入力してください。');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('開始日は終了日より前である必要があります。');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const request: AttendanceStatisticsRequest = {
        nurseryId,
        dateFrom,
        dateTo,
        classIds: selectedClassIds.length > 0 ? selectedClassIds : undefined
      };

      // Fetch both statistics and monthly data in parallel
      const [statsData, monthlyData] = await Promise.all([
        getAttendanceStatistics(request),
        getMonthlyStatistics(
          nurseryId,
          dateFrom,
          dateTo,
          selectedClassIds.length > 0 ? selectedClassIds : undefined
        )
      ]);

      setStatistics(statsData);
      setMonthlyStats(monthlyData);
      setShowGraphs(monthlyData.length > 0);
    } catch (err) {
      console.error('Failed to fetch attendance statistics:', err);
      setError('統計データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for monthly trend line chart
  const prepareMonthlyTrendData = () => {
    if (monthlyStats.length === 0) return [];

    // Group by month (YYYY-MM format)
    const groupedByMonth = monthlyStats.reduce((acc, stat) => {
      const key = stat.month;
      if (!acc[key]) {
        // Parse year and month from "YYYY-MM" format
        const [year, month] = stat.month.split('-');
        acc[key] = {
          month: key,
          displayMonth: `${year}年${parseInt(month)}月`,
        };
      }
      acc[key][stat.className] = stat.attendanceRate;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByMonth).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    );
  };

  // Prepare data for class comparison bar chart (latest month)
  const prepareClassComparisonData = () => {
    if (monthlyStats.length === 0) return [];

    // Get latest month data (month is in YYYY-MM format, so simple string sort works)
    const latestMonth = monthlyStats.reduce((latest, stat) => {
      return stat.month > latest.month ? stat : latest;
    });

    return monthlyStats
      .filter(stat => stat.month === latestMonth.month)
      .map(stat => ({
        className: stat.className,
        attendanceRate: stat.attendanceRate
      }));
  };

  // Get unique class names for line colors
  const getUniqueClassNames = () => {
    return Array.from(new Set(monthlyStats.map(stat => stat.className)));
  };

  // Color palette for multiple classes
  const colorPalette = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
  ];

  const renderStatisticsTable = (classStats: ClassStatistics) => {
    return (
      <div key={classStats.classId} className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {classStats.className}
          <span className="ml-3 text-sm font-normal text-gray-600">
            (園児数: {classStats.totalChildren}人 | 平均出席率: {classStats.averageAttendanceRate.toFixed(1)}%)
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">園児名</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">出席日数</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">欠席日数</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">遅刻日数</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">記録日数</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">出席率</th>
              </tr>
            </thead>
            <tbody>
              {classStats.childrenStatistics.map((child, index) => (
                <tr
                  key={child.childId}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 text-sm text-gray-800 border-b">{child.childName}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">{child.presentDays}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">{child.absentDays}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">{child.lateDays}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-800 border-b">{child.totalRecordedDays}</td>
                  <td className="px-4 py-3 text-sm text-center font-semibold border-b">
                    <span
                      className={
                        child.attendanceRate >= 90
                          ? 'text-green-600'
                          : child.attendanceRate >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }
                    >
                      {child.attendanceRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">出席統計レポート</h1>
          <button
            onClick={() => navigate('/desktop/attendance')}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-md hover:shadow-md transition-all duration-200"
          >
            <MdArrowBack className="mr-2" />
            出欠表に戻る
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
          <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              クラス選択（複数選択可能、未選択の場合は全クラス）
            </label>
            <div className="flex flex-wrap gap-2">
              {availableClasses.map((cls) => (
                <button
                  key={cls.classId}
                  onClick={() => handleClassToggle(cls.classId)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedClassIds.includes(cls.classId)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fetch Button */}
          <div>
            <button
              onClick={handleFetchStatistics}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <MdRefresh className="animate-spin mr-2" />
                  読み込み中...
                </>
              ) : (
                <>
                  <MdCalendarToday className="mr-2" />
                  統計を表示
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
        </div>

      {/* Graph Display */}
      {showGraphs && monthlyStats.length > 0 && (
        <div className="space-y-6">
          {/* Monthly Trend Line Chart */}
          <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <MdShowChart className="mr-2" />
              月別出席率推移
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prepareMonthlyTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayMonth"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ value: '出席率 (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {getUniqueClassNames().map((className, index) => (
                  <Line
                    key={className}
                    type="monotone"
                    dataKey={className}
                    stroke={colorPalette[index % colorPalette.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={className}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Class Comparison Bar Chart */}
          {prepareClassComparisonData().length > 0 && (
            <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MdShowChart className="mr-2" />
                クラス別出席率比較（最新月）
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareClassComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="className"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: '出席率 (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'attendanceRate' ? `${value.toFixed(1)}%` : value
                    }
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar
                    dataKey="attendanceRate"
                    fill="#3b82f6"
                    name="出席率"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Statistics Display */}
      {statistics && (
        <div className="bg-white p-6 rounded-md shadow-md border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              期間: {statistics.period.from} 〜 {statistics.period.to}
            </h2>
            <p className="text-lg text-gray-700">
              全体平均出席率: <span className="font-bold text-blue-600">{statistics.overallSummary.averageAttendanceRate.toFixed(1)}%</span>
            </p>
          </div>

          {statistics.classStatistics.length > 0 ? (
            statistics.classStatistics.map(renderStatisticsTable)
          ) : (
            <div className="text-center py-8 text-gray-500">
              指定された期間・クラスのデータがありません。
            </div>
          )}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReportPage;
