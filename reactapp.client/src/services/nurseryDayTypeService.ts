/**
 * 休園日・休日保育サービス（モバイル用）
 */

export type NurseryDayType = 'ClosedDay' | 'HolidayCare';

export interface NurseryDayTypeDto {
  id: number;
  nurseryId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  dayType: NurseryDayType;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 休園日種別の表示情報
 */
export const nurseryDayTypeInfo: Record<NurseryDayType, { name: string; color: string; bgColor: string }> = {
  ClosedDay: {
    name: '休園日',
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  HolidayCare: {
    name: '休日保育',
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
};

/**
 * 期間内の休園日・休日保育一覧を取得
 */
export async function getNurseryDayTypes(
  startDate: string,
  endDate: string,
  token: string
): Promise<NurseryDayTypeDto[]> {
  try {
    const response = await fetch(
      `/api/desktop/nursery-day-types?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`休園日・休日保育取得失敗: ${response.status} ${response.statusText}`);
      return [];
    }

    const result = await response.json();

    // APIレスポンスの形式を確認
    if (result.success && result.data) {
      return result.data;
    }

    // レスポンスが配列の場合はそのまま返す
    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    console.error('休園日・休日保育取得エラー:', error);
    return [];
  }
}

/**
 * 特定日付の休園日・休日保育を取得するヘルパー関数
 */
export function getNurseryDayTypeForDate(
  date: string,
  nurseryDayTypes: NurseryDayTypeDto[]
): NurseryDayTypeDto | null {
  return nurseryDayTypes.find((ndt) => ndt.date === date) || null;
}
