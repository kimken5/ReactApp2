// 生活記録のフォーマット関数

import type {
  TemperatureRecord,
  MealRecord,
  MoodRecord,
  SleepRecord,
  ToiletingRecord
} from '../types/infantRecords';

/**
 * 体温表示フォーマット: "36.5℃"
 */
export function formatTemperature(temp?: TemperatureRecord): string {
  if (!temp || !temp.value) return '';
  return `${temp.value}℃`;
}

/**
 * 食事量表示フォーマット
 */
export function formatMealAmount(meal?: MealRecord): string {
  if (!meal || !meal.amount) return '';

  const map: Record<string, string> = {
    All: '完食',
    Most: 'ほぼ完食',
    Half: '半分',
    Little: '少し',
    None: 'なし'
  };

  return map[meal.amount] || meal.amount;
}

/**
 * 機嫌表示フォーマット
 */
export function formatMoodState(mood?: MoodRecord): string {
  if (!mood || !mood.state) return '';

  const map: Record<string, string> = {
    VeryGood: 'とても良い',
    Good: '良い',
    Normal: '普通',
    Bad: '悪い',
    Crying: '泣いている'
  };

  return map[mood.state] || mood.state;
}

/**
 * 睡眠表示フォーマット: "12:30-14:00\n(90分)\nぐっすり"
 */
export function formatSleep(sleep?: SleepRecord): string {
  if (!sleep || !sleep.start || !sleep.end) return '';

  const qualityMap: Record<string, string> = {
    Deep: 'ぐっすり',
    Normal: '普通',
    Light: '浅い',
    Restless: '寝ない'
  };

  let result = `${sleep.start}-${sleep.end}\n(${sleep.duration || 0}分)`;

  if (sleep.sleepQuality) {
    const qualityText = qualityMap[sleep.sleepQuality] || sleep.sleepQuality;
    result += `\n${qualityText}`;
  }

  return result;
}

/**
 * おしっこの量表示フォーマット
 */
export function formatUrineAmount(amount?: string): string {
  if (!amount) return '';

  const map: Record<string, string> = {
    Little: '少量',
    Normal: '普通',
    Lot: '多量'
  };

  return map[amount] || amount;
}

/**
 * うんちの状態/色表示フォーマット: "軟便/普通"
 */
export function formatBowelCondition(condition?: string, color?: string): string {
  if (!condition) return '';

  const conditionMap: Record<string, string> = {
    Normal: '普通',
    Hard: '硬め',
    Soft: '軟便',
    Diarrhea: '下痢'
  };

  const colorMap: Record<string, string> = {
    Normal: '普通',
    Green: '緑色',
    White: '白色',
    Black: '黒色',
    Bloody: '血便'
  };

  const conditionText = conditionMap[condition] || condition;
  const colorText = colorMap[color || 'Normal'] || color || '普通';

  return `${conditionText}/${colorText}`;
}

/**
 * おむつ交換回数表示フォーマット: "3回"
 */
export function formatDiaperChangeCount(count?: number): string {
  return count !== undefined && count !== null ? `${count}回` : '';
}

/**
 * 日付ヘッダーフォーマット: "1/4(日)"
 */
export function formatDateHeader(date: Date): string {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = dayNames[date.getDay()];

  return `${month}/${day}(${dayOfWeek})`;
}

/**
 * 週の範囲フォーマット: "2026年1月4日～1月10日"
 */
export function formatWeekRange(weekStartDate: Date): string {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const startYear = weekStartDate.getFullYear();
  const startMonth = weekStartDate.getMonth() + 1;
  const startDay = weekStartDate.getDate();

  const endMonth = weekEndDate.getMonth() + 1;
  const endDay = weekEndDate.getDate();

  return `${startYear}年${startMonth}月${startDay}日～${endMonth}月${endDay}日`;
}

/**
 * 週の開始日を取得（日曜日）
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day; // 日曜日を0とする
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 日付範囲を生成（7日分）
 */
export function generateDateRange(weekStartDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * 日付を yyyy-MM-dd 形式に変換
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
