/**
 * 日付ユーティリティ関数
 * タイムゾーン変換の問題を避けるための共通関数
 */

/**
 * ローカルタイムゾーン(JST)で日付をフォーマット
 * toISOString()はUTCに変換するため、日付がずれる問題を回避
 * 
 * @param date - フォーマットする日付
 * @returns ISO 8601形式の日付文字列 (YYYY-MM-DD)
 * 
 * @example
 * const date = new Date(2026, 1, 7); // 2026-02-07 JST
 * formatLocalDate(date); // "2026-02-07" (UTCずれなし)
 * date.toISOString().split('T')[0]; // "2026-02-06" (UTCに変換され1日前になる)
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 今日の日付をローカルタイムゾーンで取得
 * @returns ISO 8601形式の日付文字列 (YYYY-MM-DD)
 */
export function getTodayLocal(): string {
  return formatLocalDate(new Date());
}

/**
 * 指定した日数前/後の日付を取得
 * @param date - 基準日
 * @param days - 日数(負の値で過去、正の値で未来)
 * @returns ISO 8601形式の日付文字列 (YYYY-MM-DD)
 */
export function addDays(date: Date | string, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * 指定した年数前/後の日付を取得
 * @param date - 基準日
 * @param years - 年数(負の値で過去、正の値で未来)
 * @returns ISO 8601形式の日付文字列 (YYYY-MM-DD)
 */
export function addYears(date: Date | string, years: number): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return formatLocalDate(d);
}
