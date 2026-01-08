import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { EventFormModal } from '../components/calendar/EventFormModal';
import { calendarService } from '../services/calendarService';
import { masterService } from '../services/masterService';
import type { CalendarEventDto, EventCategoryType, CreateEventRequestDto, UpdateEventRequestDto } from '../types/calendar';
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
  const [showEventFormModal, setShowEventFormModal] = useState(false);
  const [eventFormMode, setEventFormMode] = useState<'create' | 'edit'>('create');
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // イベントデータの読み込み
  useEffect(() => {
    loadEvents();
    loadMasterData();
  }, [currentDate, viewMode]);

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

  // イベント作成モーダル
  const openCreateEventModal = () => {
    setEventFormMode('create');
    setSelectedEvent(null);
    setShowEventFormModal(true);
  };

  const openEditEventModal = () => {
    setEventFormMode('edit');
    setShowEventModal(false);
    setShowEventFormModal(true);
  };

  const closeEventFormModal = () => {
    setShowEventFormModal(false);
    setSelectedEvent(null);
  };

  // イベント作成・更新処理
  const handleEventSubmit = async (data: CreateEventRequestDto | UpdateEventRequestDto) => {
    try {
      if (isDemoMode) {
        // デモモードの場合はローカル状態のみ更新
        if (eventFormMode === 'create') {
          const newEvent: CalendarEventDto = {
            id: Math.max(...events.map(e => e.id), 0) + 1,
            ...data,
          };
          setEvents([...events, newEvent]);
          setSuccessMessage('イベントを作成しました（デモモード）');
        } else if (eventFormMode === 'edit' && selectedEvent) {
          setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, ...data } : e));
          setSuccessMessage('イベントを更新しました（デモモード）');
        }
      } else {
        // 本番モード
        if (eventFormMode === 'create') {
          await calendarService.createEvent(data as CreateEventRequestDto);
          setSuccessMessage('イベントを作成しました');
          loadEvents();
        } else if (eventFormMode === 'edit' && selectedEvent) {
          await calendarService.updateEvent(selectedEvent.id, data as UpdateEventRequestDto);
          setSuccessMessage('イベントを更新しました');
          loadEvents();
        }
      }

      // 成功メッセージを3秒後に消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('イベント保存エラー:', error);
      setErrorMessage('イベントの保存に失敗しました');
      setTimeout(() => setErrorMessage(null), 3000);
      throw error;
    }
  };

  // イベント削除処理
  const handleEventDelete = async () => {
    if (!selectedEvent) return;

    if (!confirm('このイベントを削除してもよろしいですか？')) {
      return;
    }

    try {
      if (isDemoMode) {
        // デモモードの場合はローカル状態のみ更新
        setEvents(events.filter(e => e.id !== selectedEvent.id));
        setSuccessMessage('イベントを削除しました（デモモード）');
      } else {
        // 本番モード
        await calendarService.deleteEvent(selectedEvent.id);
        setSuccessMessage('イベントを削除しました');
        loadEvents();
      }

      closeEventModal();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('イベント削除エラー:', error);
      setErrorMessage('イベントの削除に失敗しました');
      setTimeout(() => setErrorMessage(null), 3000);
    }
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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">カレンダー管理</h1>
          <button
            onClick={openCreateEventModal}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新規イベント</span>
          </button>
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

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {/* コントロールバー */}
        <div className="bg-white rounded-lg shadow-md p-4">
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
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={handleEventDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      削除
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={openEditEventModal}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        編集
                      </button>
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
            </div>
          </>
        )}

        {/* イベント作成・編集モーダル */}
        <EventFormModal
          isOpen={showEventFormModal}
          onClose={closeEventFormModal}
          onSubmit={handleEventSubmit}
          event={selectedEvent}
          classes={classes}
          mode={eventFormMode}
        />
      </div>
    </DashboardLayout>
  );
}
