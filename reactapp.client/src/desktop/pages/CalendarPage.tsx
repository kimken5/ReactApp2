import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { calendarService } from '../services/calendarService';
import { masterService } from '../services/masterService';
import type { CalendarEventDto, EventCategoryType } from '../types/calendar';
import type { ClassDto } from '../types/master';
import { eventCategoriesDesktop } from '../types/calendar';

/**
 * カレンダー管理ページ
 * イベントの表示・作成・編集・削除を行う
 */

// 時間スロットの生成 (7:00-21:00)
const getTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

// 曜日と月名
const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

// デモ用のダミーデータ
const getDemoEvents = (): CalendarEventDto[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return [
    {
      id: 1,
      title: '全体お知らせ：運動会のお知らせ',
      description: '10月15日に運動会を開催します。',
      category: 'general_announcement',
      startDateTime: `${today.toISOString().split('T')[0]}T09:00:00`,
      endDateTime: `${today.toISOString().split('T')[0]}T10:00:00`,
      isAllDay: false,
    },
    {
      id: 2,
      title: '保育園休園日',
      description: '祝日のため休園です。',
      category: 'nursery_holiday',
      startDateTime: `${tomorrow.toISOString().split('T')[0]}T00:00:00`,
      endDateTime: `${tomorrow.toISOString().split('T')[0]}T23:59:59`,
      isAllDay: true,
    },
    {
      id: 3,
      title: '全体行事：遠足',
      description: '近くの公園に遠足に行きます。',
      category: 'general_event',
      startDateTime: `${dayAfterTomorrow.toISOString().split('T')[0]}T10:00:00`,
      endDateTime: `${dayAfterTomorrow.toISOString().split('T')[0]}T15:00:00`,
      isAllDay: false,
    },
  ];
};

export function CalendarPage() {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // イベントデータの読み込み
  useEffect(() => {
    if (isDemoMode) {
      console.log('CalendarPage - Demo mode, loading demo data');
      setEvents(getDemoEvents());
      setClasses([
        { classId: 'C001', className: 'ひよこ組', nurseryId: 0, gradeLevel: '0歳児' },
        { classId: 'C002', className: 'うさぎ組', nurseryId: 0, gradeLevel: '1歳児' },
      ]);
    } else {
      loadEvents();
      loadMasterData();
    }
  }, [currentDate, viewMode, isDemoMode]);

  const loadMasterData = async () => {
    try {
      const classesData = await masterService.getClasses();
      setClasses(classesData);
    } catch (err) {
      console.error('マスタデータ読み込みエラー:', err);
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // 表示モードに基づいて日付範囲を計算
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'month') {
        // 月表示：その月の1日から最終日まで
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else {
        // 週表示：その週の日曜日から土曜日まで
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const eventsData = await calendarService.getEvents(startDateStr, endDateStr);
      setEvents(eventsData);
    } catch (error) {
      console.error('イベント取得エラー:', error);
      setErrorMessage('イベントの取得に失敗しました');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 日付関連の関数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSaturday = (dayOfWeek: number) => {
    return dayOfWeek === 6;
  };

  // イベントフィルタリング
  const getEventsForDate = (date: string) => {
    return events.filter((event) => {
      const eventDate = event.startDateTime.split('T')[0];
      const matchesDate = eventDate === date;
      const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(event.category);
      return matchesDate && matchesFilter;
    });
  };

  // ナビゲーション
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // フィルター切り替え
  const toggleFilter = (category: string) => {
    setSelectedFilters((prev) =>
      prev.includes(category) ? prev.filter((f) => f !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  // イベント詳細モーダル
  const openEventModal = (event: CalendarEventDto) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // 月表示の描画
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const calendarDays = [];

    // 前月の空白日
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }

    // 現在月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm" style={{ border: '0.5px solid #d1d5db' }}>
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-gray-50" style={{ borderBottom: '0.5px solid #d1d5db' }}>
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center font-bold text-sm ${
                index === 0
                  ? 'text-red-600'
                  : isSaturday(index)
                  ? 'text-blue-500 bg-blue-50'
                  : 'text-gray-800'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7" style={{ borderLeft: '0.5px solid #d1d5db', borderTop: '0.5px solid #d1d5db' }}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={index}
                  className="min-h-[80px] bg-gray-50"
                  style={{ borderBottom: '0.5px solid #d1d5db', borderRight: '0.5px solid #d1d5db' }}
                />
              );
            }

            const cellDate = new Date(year, month, day);
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateString);
            const dayOfWeek = cellDate.getDay();

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 ${
                  isToday(cellDate) ? 'bg-yellow-50' : 'bg-white'
                } cursor-pointer flex flex-col`}
                style={{ borderBottom: '0.5px solid #d1d5db', borderRight: '0.5px solid #d1d5db' }}
              >
                <div
                  className={`text-sm font-bold mb-1 ${
                    dayOfWeek === 0 ? 'text-red-600' : isSaturday(dayOfWeek) ? 'text-blue-500' : 'text-gray-800'
                  }`}
                >
                  {day}
                </div>

                {/* イベント表示 */}
                <div className="flex flex-col gap-1 flex-1">
                  {dayEvents.map((event, eventIndex) => {
                    const category = eventCategoriesDesktop[event.category];
                    return (
                      <div
                        key={eventIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventModal(event);
                        }}
                        className="text-xs px-1 py-0.5 rounded border text-center cursor-pointer overflow-hidden"
                        style={{
                          backgroundColor: category.bgColor,
                          color: category.color,
                          borderColor: category.color,
                        }}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 週表示の描画
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    const timeSlots = getTimeSlots();

    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-sm" style={{ border: '0.5px solid #d1d5db' }}>
        {/* 週ヘッダー */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50" style={{ borderBottom: '0.5px solid #d1d5db' }}>
          <div className="p-3 text-xs font-bold text-gray-600 text-center" style={{ borderRight: '0.5px solid #d1d5db' }}>
            時間
          </div>
          {weekDates.map((date, index) => {
            const dayOfWeek = date.getDay();
            return (
              <div
                key={index}
                className={`p-3 text-center text-xs font-bold ${
                  dayOfWeek === 0
                    ? 'text-red-600 bg-red-50'
                    : isSaturday(dayOfWeek)
                    ? 'text-blue-500 bg-blue-50'
                    : 'text-gray-800'
                } ${isToday(date) ? 'bg-yellow-50' : ''}`}
                style={index < 6 ? { borderRight: '0.5px solid #d1d5db' } : {}}
              >
                <div>{weekDays[dayOfWeek]}</div>
                <div className="text-sm mt-1">{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* 全日イベント行 */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ borderBottom: '0.5px solid #d1d5db' }}>
          <div className="p-3 text-xs text-gray-600 bg-gray-50 text-center font-bold" style={{ borderRight: '0.5px solid #d1d5db' }}>
            全日
          </div>
          {weekDates.map((date, dateIndex) => {
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const allDayEvents = getEventsForDate(dateString).filter((event) => event.isAllDay);

            return (
              <div
                key={dateIndex}
                className={`p-2 flex flex-col gap-1 ${
                  isToday(date) ? 'bg-yellow-50' : 'bg-white'
                }`}
                style={dateIndex < 6 ? { borderRight: '0.5px solid #d1d5db' } : {}}
              >
                {allDayEvents.map((event, eventIndex) => {
                  const category = eventCategoriesDesktop[event.category];
                  return (
                    <div
                      key={eventIndex}
                      onClick={() => openEventModal(event)}
                      className="text-xs p-1 rounded border text-center cursor-pointer font-bold"
                      style={{
                        backgroundColor: category.bgColor,
                        color: category.color,
                        borderColor: category.color,
                      }}
                    >
                      {event.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* タイムライン */}
        <div className="relative">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[60px]" style={{ borderBottom: '0.5px solid #d1d5db' }}>
              <div className="p-3 text-xs text-gray-600 bg-gray-50 text-center font-bold" style={{ borderRight: '0.5px solid #d1d5db' }}>
                {time}
              </div>
              {weekDates.map((date, dateIndex) => (
                <div
                  key={dateIndex}
                  className={`relative ${isToday(date) ? 'bg-yellow-50' : 'bg-white'}`}
                  style={dateIndex < 6 ? { borderRight: '0.5px solid #d1d5db' } : {}}
                />
              ))}
            </div>
          ))}

          {/* イベントオーバーレイ */}
          <div
            className="absolute top-0 left-[60px] right-0 h-full grid grid-cols-7 pointer-events-none"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
          >
            {weekDates.map((date, dateIndex) => {
              const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              const dayEvents = getEventsForDate(dateString).filter((event) => !event.isAllDay);
              const cellHeight = 60;
              const firstHour = 7;

              return (
                <div key={dateIndex} className="relative">
                  {dayEvents.map((event, eventIndex) => {
                    const startTime = event.startDateTime.split('T')[1];
                    const endTime = event.endDateTime.split('T')[1];
                    if (!startTime || !endTime) return null;

                    const startHour = parseInt(startTime.split(':')[0]);
                    const startMinute = parseInt(startTime.split(':')[1]);
                    const endHour = parseInt(endTime.split(':')[0]);
                    const endMinute = parseInt(endTime.split(':')[1]);

                    const startOffset = startHour - firstHour + startMinute / 60;
                    const endOffset = endHour - firstHour + endMinute / 60;

                    const topPosition = startOffset * cellHeight;
                    const eventHeight = Math.max((endOffset - startOffset) * cellHeight - 4, 20);

                    const category = eventCategoriesDesktop[event.category];

                    return (
                      <div
                        key={eventIndex}
                        onClick={() => openEventModal(event)}
                        className="absolute left-1 right-1 text-xs p-1 rounded border cursor-pointer font-bold pointer-events-auto"
                        style={{
                          top: `${topPosition}px`,
                          height: `${eventHeight}px`,
                          backgroundColor: category.bgColor,
                          color: category.color,
                          borderColor: category.color,
                          overflow: 'hidden',
                        }}
                      >
                        <div className="font-bold">{event.title}</div>
                        <div className="text-[10px]">
                          {startTime.substring(0, 5)} - {endTime.substring(0, 5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">カレンダー管理</h1>
          <p className="text-gray-600 mt-2">イベントの確認・作成・編集を行います</p>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* コントロールバー */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          {/* 表示切り替えと今日ボタン */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
              >
                今日
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                月
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'week'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                週
              </button>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-lg"
            >
              ←
            </button>

            <h2 className="text-xl font-bold text-gray-800">
              {viewMode === 'month'
                ? `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`
                : (() => {
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);

                    const startMonth = startOfWeek.getMonth() + 1;
                    const startDay = startOfWeek.getDate();
                    const endMonth = endOfWeek.getMonth() + 1;
                    const endDay = endOfWeek.getDate();

                    return `${startMonth}月${startDay}日～${endMonth}月${endDay}日`;
                  })()}
            </h2>

            <button
              onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-lg"
            >
              →
            </button>
          </div>

          {/* カテゴリフィルター */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">フィルター:</span>

            <button
              onClick={clearFilters}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                selectedFilters.length === 0
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>

            {Object.entries(eventCategoriesDesktop).map(([key, category]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`px-3 py-1 rounded-lg text-sm border font-medium transition ${
                  selectedFilters.includes(key) ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: selectedFilters.includes(key) ? category.color : category.bgColor,
                  color: selectedFilters.includes(key) ? 'white' : category.color,
                  borderColor: category.color,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* メインカレンダー */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : (
          <>{viewMode === 'month' ? renderMonthView() : renderWeekView()}</>
        )}

        {/* イベント詳細モーダル */}
        {showEventModal && selectedEvent && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={closeEventModal}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h2>
                    <div
                      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: eventCategoriesDesktop[selectedEvent.category].bgColor,
                        color: eventCategoriesDesktop[selectedEvent.category].color,
                      }}
                    >
                      {eventCategoriesDesktop[selectedEvent.category].name}
                    </div>
                  </div>
                  <button
                    onClick={closeEventModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700 font-medium">
                        {new Date(selectedEvent.startDateTime).toLocaleDateString('ja-JP')}
                      </span>
                    </div>

                    {!selectedEvent.isAllDay && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-gray-700 font-medium">
                          {selectedEvent.startDateTime.split('T')[1]?.substring(0, 5)} -{' '}
                          {selectedEvent.endDateTime.split('T')[1]?.substring(0, 5)}
                        </span>
                      </div>
                    )}

                    {selectedEvent.location && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-gray-700 font-medium">{selectedEvent.location}</span>
                      </div>
                    )}

                    {selectedEvent.description && (
                      <div className="mt-4 pt-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedEvent.description}</p>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={closeEventModal}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
