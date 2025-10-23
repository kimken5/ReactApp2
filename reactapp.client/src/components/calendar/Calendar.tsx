import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import { MdArrowBack } from 'react-icons/md';

// イベントカテゴリの型定義
type EventCategoryType = 'general_announcement' | 'general_event' | 'grade_activity' | 'class_activity' | 'nursery_holiday';

interface CategoryInfo {
  name: string;
  color: string;
  bgColor: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategoryType;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
}

// イベントカテゴリの定義（スタッフ用・固定）
const eventCategoriesStaff: Record<EventCategoryType, CategoryInfo> = {
  general_announcement: {
    name: '全体お知らせ',
    color: '#7c3aed',
    bgColor: '#ede9fe'
  },
  general_event: {
    name: '全体行事',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  grade_activity: {
    name: '学年活動',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  class_activity: {
    name: 'クラス活動',
    color: '#6366f1',
    bgColor: '#e0e7ff'
  },
  nursery_holiday: {
    name: '園休日',
    color: '#ef4444',
    bgColor: '#fee2e2'
  }
};

// サンプルデータは削除 - データベースから取得したデータのみを使用

// 時間スロットの生成 (7:00-21:00)
const getTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

interface CalendarProps {
  isStaffView?: boolean;
}

export function Calendar({ isStaffView = false }: CalendarProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['calendar', 'common']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // 保護者表示の場合はi18nを使用、スタッフ表示は固定日本語
  const eventCategories: Record<EventCategoryType, CategoryInfo> = isStaffView
    ? eventCategoriesStaff
    : {
        general_announcement: {
          name: t('calendar:categories.general_announcement'),
          color: '#7c3aed',
          bgColor: '#ede9fe'
        },
        general_event: {
          name: t('calendar:categories.general_event'),
          color: '#f59e0b',
          bgColor: '#fef3c7'
        },
        grade_activity: {
          name: t('calendar:categories.grade_activity'),
          color: '#10b981',
          bgColor: '#d1fae5'
        },
        class_activity: {
          name: t('calendar:categories.class_activity'),
          color: '#6366f1',
          bgColor: '#e0e7ff'
        },
        nursery_holiday: {
          name: t('calendar:categories.nursery_holiday'),
          color: '#ef4444',
          bgColor: '#fee2e2'
        }
      };

  // 曜日と月名（保護者のみi18n対応）
  const monthNames = isStaffView
    ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    : t('calendar:months', { returnObjects: true }) as string[];

  const weekDays = isStaffView
    ? ['日', '月', '火', '水', '木', '金', '土']
    : t('calendar:weekDays.short', { returnObjects: true }) as string[];

  const weekDaysFull = isStaffView
    ? ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
    : t('calendar:weekDays.full', { returnObjects: true }) as string[];

  // APIからイベントを取得
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('認証トークンがありません。ログインしてください。');
          setEvents([]);
          return;
        }

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

        // ISO 8601形式に変換 (YYYY-MM-DD)
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // スタッフビューか保護者ビューかで API エンドポイントを切り替え
        const baseUrl = isStaffView
          ? '/api/staff/calendar'
          : '/api/events/calendar';

        const apiUrl = `${baseUrl}?startDate=${startDateStr}&endDate=${endDateStr}`;

        console.log(`カレンダーデータ取得: ${startDateStr} ~ ${endDateStr} (${viewMode})`);

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`カレンダーデータ取得成功 (${isStaffView ? 'スタッフ' : '保護者'}):`, data);
          // API レスポンスを CalendarEvent 形式に変換
          const apiEvents: CalendarEvent[] = data.map((event: any) => ({
            id: event.id.toString(),
            title: event.title,
            category: event.category as EventCategoryType,
            date: event.startDateTime.split('T')[0],
            startTime: event.isAllDay ? undefined : event.startDateTime.split('T')[1]?.substring(0, 5),
            endTime: event.isAllDay ? undefined : event.endDateTime.split('T')[1]?.substring(0, 5),
            description: event.description,
            location: event.location,
            isAllDay: event.isAllDay
          }));
          setEvents(apiEvents);
        } else {
          console.error(`カレンダーデータ取得失敗: ${response.status} ${response.statusText}`);
          setEvents([]);
        }
      } catch (error) {
        console.error('カレンダーデータ取得エラー:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isStaffView, currentDate, viewMode]);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    return events.filter(event => {
      const matchesDate = event.date === date;
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
    setSelectedFilters(prev => 
      prev.includes(category)
        ? prev.filter(f => f !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  // イベント詳細モーダル
  const openEventModal = (event: any) => {
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 曜日ヘッダー */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#f1f5f9',
          boxShadow: 'inset 0 -1px 0 #d1d5db'
        }}>
          {weekDays.map((day, index) => (
            <div
              key={day}
              style={{
                padding: isMobile ? '8px 4px' : '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '14px',
                color: index === 0 ? '#dc2626' : isSaturday(index) ? '#0ea5e9' : '#1e293b',
                backgroundColor: isSaturday(index) ? '#e0f2fe' : 'transparent',
                boxShadow: index < 6 ? 'inset -1px 0 0 #d1d5db' : 'none'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)'
        }}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={index}
                  style={{
                    minHeight: isMobile ? '60px' : '80px',
                    backgroundColor: '#f8fafc',
                    boxShadow: `${index % 7 !== 6 ? 'inset -1px 0 0 #d1d5db, ' : ''}inset 0 -1px 0 #d1d5db`
                  }}
                />
              );
            }

            const cellDate = new Date(year, month, day);
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const events = getEventsForDate(dateString);
            const dayOfWeek = cellDate.getDay();

            return (
              <div
                key={index}
                style={{
                  minHeight: isMobile ? '60px' : '80px',
                  padding: isMobile ? '4px' : '8px',
                  boxShadow: `${index % 7 !== 6 ? 'inset -1px 0 0 #d1d5db, ' : ''}inset 0 -1px 0 #d1d5db`,
                  backgroundColor: isToday(cellDate) ? '#fde047' : 'white',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  color: dayOfWeek === 0 ? '#dc2626' : isSaturday(dayOfWeek) ? '#0ea5e9' : '#1e293b',
                  marginBottom: '4px',
                  flexShrink: 0
                }}>
                  {day}
                </div>

                {/* イベント表示 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  width: '100%',
                  flex: 1
                }}>
                  {events.map((event, eventIndex) => {
                    const category = eventCategories[event.category];
                    return (
                      <div
                        key={eventIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventModal(event);
                        }}
                        style={{
                          fontSize: isMobile ? '8px' : '10px',
                          backgroundColor: category.bgColor,
                          color: category.color,
                          padding: isMobile ? '2px 3px' : '3px 4px',
                          borderRadius: '3px',
                          border: `1px solid ${category.color}`,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                          lineHeight: '1.3',
                          maxWidth: '100%',
                          flexShrink: 0,
                          textAlign: 'center'
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 週ヘッダー */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '50px repeat(7, 1fr)' : '60px repeat(7, 1fr)',
          backgroundColor: '#f1f5f9',
          boxShadow: 'inset 0 -2px 0 #d1d5db'
        }}>
          <div style={{
            padding: isMobile ? '8px 4px' : '12px',
            fontSize: isMobile ? '10px' : '12px',
            fontWeight: 'bold',
            color: '#64748b',
            textAlign: 'center',
            boxShadow: 'inset -1px 0 0 #d1d5db, inset 0 -2px 0 #d1d5db'
          }}>
            {isStaffView ? '時間' : t('calendar:weekView.timeLabel')}
          </div>
          {weekDates.map((date, index) => {
            const dayOfWeek = date.getDay();
            return (
              <div
                key={index}
                style={{
                  padding: isMobile ? '8px 2px' : '12px 8px',
                  textAlign: 'center',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 'bold',
                  color: dayOfWeek === 0 ? '#dc2626' : isSaturday(dayOfWeek) ? '#0ea5e9' : '#1e293b',
                  backgroundColor: isToday(date) ? '#fde047' : dayOfWeek === 0 ? '#fee2e2' : isSaturday(dayOfWeek) ? '#e0f2fe' : 'transparent',
                  boxShadow: `${index < 6 ? 'inset -1px 0 0 #d1d5db, ' : ''}inset 0 -2px 0 #d1d5db`
                }}
              >
                <div>{weekDays[dayOfWeek]}</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', marginTop: '2px' }}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 全日イベント行（タイムラインと同じマトリックス形式） */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '50px repeat(7, 1fr)' : '60px repeat(7, 1fr)',
            boxShadow: 'inset 0 -1px 0 #d1d5db'
          }}
        >
          {/* 全日ラベル */}
          <div style={{
            padding: isMobile ? '8px 4px' : '12px',
            fontSize: isMobile ? '10px' : '12px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            textAlign: 'center',
            fontWeight: 'bold',
            boxShadow: 'inset -1px 0 0 #d1d5db, inset 0 -1px 0 #d1d5db'
          }}>
            {isStaffView ? '全日' : t('calendar:weekView.allDayLabel')}
          </div>

          {/* 各日のセル */}
          {weekDates.map((date, dateIndex) => {
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const allDayEvents = getEventsForDate(dateString).filter(event => event.isAllDay);

            return (
              <div
                key={dateIndex}
                style={{
                  boxShadow: `${dateIndex < 6 ? 'inset -1px 0 0 #d1d5db, ' : ''}inset 0 -1px 0 #d1d5db`,
                  backgroundColor: isToday(date) ? '#fde047' : 'white',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '4px 2px',
                  overflow: 'auto'
                }}
              >
                {allDayEvents.map((event, eventIndex) => {
                  const category = eventCategories[event.category];
                  return (
                    <div
                      key={eventIndex}
                      onClick={() => openEventModal(event)}
                      style={{
                        fontSize: isMobile ? '9px' : '11px',
                        backgroundColor: category.bgColor,
                        color: category.color,
                        padding: isMobile ? '3px 2px' : '4px 3px',
                        borderRadius: '3px',
                        border: `1px solid ${category.color}`,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        width: '100%',
                        lineHeight: '1.3',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: isMobile ? '20px' : '24px'
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
        <div style={{ position: 'relative' }}>
          {/* 時間スロットグリッド */}
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '50px repeat(7, 1fr)' : '60px repeat(7, 1fr)',
                boxShadow: 'inset 0 -1px 0 #d1d5db',
                minHeight: isMobile ? '40px' : '60px'
              }}
            >
              {/* 時間ラベル */}
              <div style={{
                padding: isMobile ? '8px 4px' : '12px',
                fontSize: isMobile ? '10px' : '12px',
                color: '#64748b',
                backgroundColor: '#f8fafc',
                textAlign: 'center',
                fontWeight: 'bold',
                boxShadow: 'inset -1px 0 0 #d1d5db, inset 0 -1px 0 #d1d5db'
              }}>
                {time}
              </div>

              {/* 各日のセル（背景のみ） */}
              {weekDates.map((date, dateIndex) => (
                <div
                  key={dateIndex}
                  style={{
                    padding: 0,
                    boxShadow: `${dateIndex < 6 ? 'inset -1px 0 0 #d1d5db, ' : ''}inset 0 -1px 0 #d1d5db`,
                    backgroundColor: isToday(date) ? '#fde047' : 'white',
                    position: 'relative',
                    height: isMobile ? '40px' : '60px'
                  }}
                />
              ))}
            </div>
          ))}

          {/* イベントを絶対配置でオーバーレイ */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: isMobile ? '50px' : '60px',
              right: 0,
              height: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              pointerEvents: 'none'
            }}
          >
            {weekDates.map((date, dateIndex) => {
              const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              const dayEvents = getEventsForDate(dateString).filter(event => !event.isAllDay);
              const cellHeight = isMobile ? 40 : 60;
              const firstHour = 7; // 最初の時間スロット（7:00）

              // イベントの時間範囲を計算
              const eventsWithPosition = dayEvents.map((event) => {
                if (!event.startTime || !event.endTime) return null;

                const startHour = parseInt(event.startTime.split(':')[0]);
                const startMinute = parseInt(event.startTime.split(':')[1]);
                const endHour = parseInt(event.endTime.split(':')[0]);
                const endMinute = parseInt(event.endTime.split(':')[1]);

                const startOffset = (startHour - firstHour) + startMinute / 60;
                const endOffset = (endHour - firstHour) + endMinute / 60;

                return {
                  event,
                  startOffset,
                  endOffset,
                  topPosition: startOffset * cellHeight,
                  eventHeight: Math.max((endOffset - startOffset) * cellHeight - 4, 20)
                };
              }).filter(e => e !== null);

              // 重なりを検出してカラム位置を計算
              const eventsWithColumns = eventsWithPosition.map((eventData, index) => {
                // このイベントと重なる他のイベントを検出
                const overlapping = eventsWithPosition.filter((other, otherIndex) => {
                  if (index === otherIndex) return false;
                  // 時間範囲が重なるかチェック
                  return !(other.endOffset <= eventData.startOffset || other.startOffset >= eventData.endOffset);
                });

                // 重なっているイベントの中で、このイベントより前にあるものの数を数える
                const columnIndex = overlapping.filter((other, otherIndex) => {
                  const otherOriginalIndex = eventsWithPosition.indexOf(other);
                  return otherOriginalIndex < index;
                }).length;

                // 最大重なり数を計算（このイベントを含む）
                const maxColumns = overlapping.length + 1;

                return {
                  ...eventData,
                  columnIndex,
                  maxColumns
                };
              });

              return (
                <div
                  key={dateIndex}
                  style={{
                    position: 'relative',
                    pointerEvents: 'auto'
                  }}
                >
                  {eventsWithColumns.map((eventData, eventIndex) => {
                    const category = eventCategories[eventData.event.category];
                    const columnWidth = 100 / eventData.maxColumns;
                    const leftPosition = columnWidth * eventData.columnIndex;

                    return (
                      <div
                        key={eventIndex}
                        onClick={() => openEventModal(eventData.event)}
                        style={{
                          position: 'absolute',
                          top: `${eventData.topPosition}px`,
                          left: `${leftPosition}%`,
                          width: `${columnWidth}%`,
                          height: `${eventData.eventHeight}px`,
                          backgroundColor: category.bgColor,
                          color: category.color,
                          padding: isMobile ? '3px 2px' : '4px 3px',
                          borderRadius: '3px',
                          border: `1px solid ${category.color}`,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? '9px' : '11px',
                          fontWeight: 'bold',
                          zIndex: 10,
                          boxSizing: 'border-box',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          lineHeight: '1.3'
                        }}
                      >
                        {eventData.event.title}
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
    <div style={{
      maxWidth: '100%',
      padding: isMobile ? '5px' : '10px'
    }}>
      {/* ヘッダー */}
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '15px' : '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            onClick={() => navigate(isStaffView ? '/staff/dashboard' : '/dashboard')}
            style={{
              padding: '8px',
              backgroundColor: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <MdArrowBack size={20} />
          </button>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={goToToday}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isStaffView ? '今日' : t('calendar:navigation.today')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                backgroundColor: viewMode === 'month' ? '#f97316' : '#e2e8f0',
                color: viewMode === 'month' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isStaffView ? '月' : t('calendar:navigation.month')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                backgroundColor: viewMode === 'week' ? '#f97316' : '#e2e8f0',
                color: viewMode === 'week' ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isStaffView ? '週' : t('calendar:navigation.week')}
            </button>
          </div>
        </div>

        {/* ナビゲーション */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <button
            onClick={viewMode === 'month' ? goToPreviousMonth : goToPreviousWeek}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: isMobile ? '8px 12px' : '10px 16px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '18px'
            }}
          >
            ←
          </button>

          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '16px' : '20px',
            color: '#1e293b',
            textAlign: 'center'
          }}>
            {viewMode === 'month'
              ? isStaffView
                ? `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`
                : t('calendar:monthView.title', {
                    year: currentDate.getFullYear(),
                    month: monthNames[currentDate.getMonth()]
                  })
              : (() => {
                  const startOfWeek = new Date(currentDate);
                  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);

                  const startMonth = startOfWeek.getMonth() + 1;
                  const startDay = startOfWeek.getDate();
                  const endMonth = endOfWeek.getMonth() + 1;
                  const endDay = endOfWeek.getDate();

                  return isStaffView
                    ? `${startMonth}月${startDay}日～${endMonth}月${endDay}日`
                    : t('calendar:weekView.dateRange', { startMonth, startDay, endMonth, endDay });
                })()
            }
          </h2>

          <button
            onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: isMobile ? '8px 12px' : '10px 16px',
              cursor: 'pointer',
              fontSize: isMobile ? '16px' : '18px'
            }}
          >
            →
          </button>
        </div>

        {/* カテゴリフィルター */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#64748b',
            marginRight: '8px'
          }}>
            {isStaffView ? 'フィルター:' : t('calendar:filter.label')}
          </span>

          <button
            onClick={clearFilters}
            style={{
              padding: isMobile ? '4px 8px' : '6px 12px',
              backgroundColor: selectedFilters.length === 0 ? '#f97316' : '#f1f5f9',
              color: selectedFilters.length === 0 ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              fontSize: isMobile ? '10px' : '12px',
              cursor: 'pointer',
              fontWeight: selectedFilters.length === 0 ? 'bold' : 'normal'
            }}
          >
            {isStaffView ? 'すべて' : t('calendar:filter.all')}
          </button>

          {Object.entries(eventCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              style={{
                padding: isMobile ? '4px 6px' : '6px 10px',
                backgroundColor: selectedFilters.includes(key) ? category.color : category.bgColor,
                color: selectedFilters.includes(key) ? 'white' : category.color,
                border: `1px solid ${category.color}`,
                borderRadius: '6px',
                fontSize: isMobile ? '10px' : '12px',
                cursor: 'pointer',
                fontWeight: selectedFilters.includes(key) ? 'bold' : 'normal'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* メインカレンダー */}
      {viewMode === 'month' ? renderMonthView() : renderWeekView()}

      {/* イベント詳細モーダル */}
      {showEventModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '20px' : '0'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: isMobile ? '20px' : '30px',
            maxWidth: isMobile ? '100%' : '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* モーダルヘッダー */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: '#1e293b',
                  fontSize: isMobile ? '18px' : '20px',
                  margin: '0 0 8px 0'
                }}>
                  {selectedEvent?.title}
                </h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: selectedEvent ? eventCategories[selectedEvent.category]?.bgColor : undefined,
                  color: selectedEvent ? eventCategories[selectedEvent.category]?.color : undefined,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  gap: '4px'
                }}>
                  {selectedEvent ? eventCategories[selectedEvent.category]?.name : ''}
                </div>
              </div>
              
              <button
                onClick={closeEventModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '20px'
                }}
              >
                ×
              </button>
            </div>

            {/* イベント詳細情報 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr',
                gap: '12px',
                fontSize: isMobile ? '12px' : '14px'
              }}>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaCalendarAlt /> {isStaffView ? '日付' : t('calendar:eventModal.date')}
                </div>
                <div style={{
                  color: '#000000',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '500'
                }}>
                  {new Date(selectedEvent.date).toLocaleDateString(isStaffView ? 'ja-JP' : i18n.language)}
                </div>

                {!selectedEvent.isAllDay && (
                  <>
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaClock /> {isStaffView ? '時間' : t('calendar:eventModal.time')}
                    </div>
                    <div style={{
                      color: '#000000',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500'
                    }}>
                      {selectedEvent?.startTime} - {selectedEvent?.endTime}
                    </div>
                  </>
                )}

                {selectedEvent?.location && (
                  <>
                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaMapMarkerAlt /> {isStaffView ? '場所' : t('calendar:eventModal.location')}
                    </div>
                    <div style={{
                      color: '#000000',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500'
                    }}>
                      {selectedEvent?.location}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* イベント説明 */}
            {selectedEvent?.description && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  color: '#94a3b8',
                  fontSize: isMobile ? '12px' : '14px',
                  margin: '0 0 10px 0',
                  fontWeight: 'normal'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaFileAlt /> {isStaffView ? '詳細' : t('calendar:eventModal.details')}
                  </span>
                </h4>
                <p style={{
                  color: '#000000',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '500',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {selectedEvent?.description}
                </p>
              </div>
            )}

            {/* アクションボタン */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}>
              <button
                onClick={closeEventModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isStaffView ? '閉じる' : t('calendar:eventModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}