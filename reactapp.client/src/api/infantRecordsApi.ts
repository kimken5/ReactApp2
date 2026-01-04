import { apiClient } from '../desktop/services/apiClient';
import type {
  WeeklyRecordResponse,
  UpdateTemperatureDto,
  UpdateMealDto,
  UpdateMoodDto,
  UpdateSleepDto,
  UpdateToiletingDto
} from '../types/infantRecords';

/**
 * 週次生活記録を取得
 */
export const getWeeklyRecords = async (
  classId: string,
  weekStartDate: string
): Promise<WeeklyRecordResponse> => {
  const response = await apiClient.get('/api/desktop/infant-records/weekly', {
    params: {
      classId,
      weekStartDate
    }
  });
  return response.data.data;
};

/**
 * 体温記録を更新
 */
export const updateTemperature = async (
  temperatureId: number,
  dto: UpdateTemperatureDto
): Promise<void> => {
  await apiClient.put(`/api/desktop/infant-records/temperature/${temperatureId}`, dto);
};

/**
 * 食事記録を更新
 */
export const updateMeal = async (
  mealId: number,
  dto: UpdateMealDto
): Promise<void> => {
  await apiClient.put(`/api/desktop/infant-records/meal/${mealId}`, dto);
};

/**
 * 機嫌記録を更新
 */
export const updateMood = async (
  moodId: number,
  dto: UpdateMoodDto
): Promise<void> => {
  await apiClient.put(`/api/desktop/infant-records/mood/${moodId}`, dto);
};

/**
 * 睡眠記録を更新
 */
export const updateSleep = async (
  sleepId: number,
  dto: UpdateSleepDto
): Promise<void> => {
  await apiClient.put(`/api/desktop/infant-records/sleep/${sleepId}`, dto);
};

/**
 * 排泄記録を更新
 */
export const updateToileting = async (
  childId: number,
  recordDate: string,
  dto: UpdateToiletingDto
): Promise<void> => {
  await apiClient.put(`/api/desktop/infant-records/toileting/${childId}`, dto, {
    params: { recordDate }
  });
};

/**
 * 体温記録を作成または更新（Upsert）
 */
export const upsertTemperature = async (
  childId: number,
  recordDate: string,
  measurementType: string,
  temperature: string, // "36.0" (小数点1桁の文字列)
  measurementTime: string
): Promise<{ recordId: number }> => {
  const response = await apiClient.post('/api/desktop/infant-records/temperature', {
    childId,
    recordDate,
    measurementType,
    temperature: parseFloat(temperature), // バックエンドには数値として送信
    measurementTime
  });
  return response.data;
};

/**
 * 食事記録を作成または更新（Upsert）
 */
export const upsertMeal = async (
  childId: number,
  recordDate: string,
  mealType: string,
  amount: string
): Promise<{ recordId: number }> => {
  const response = await apiClient.post('/api/desktop/infant-records/meal', {
    childId,
    recordDate,
    mealType,
    amount
  });
  return response.data;
};

/**
 * 機嫌記録を作成または更新（Upsert）
 */
export const upsertMood = async (
  childId: number,
  recordDate: string,
  moodTime: string,
  state: string
): Promise<{ recordId: number }> => {
  const response = await apiClient.post('/api/desktop/infant-records/mood', {
    childId,
    recordDate,
    moodTime,
    state
  });
  return response.data;
};

/**
 * 昼寝記録を作成または更新（Upsert）
 */
export const upsertSleep = async (
  childId: number,
  recordDate: string,
  startTime?: string,
  endTime?: string,
  sleepQuality?: string
): Promise<{ recordId: number }> => {
  const response = await apiClient.post('/api/desktop/infant-records/sleep', {
    childId,
    recordDate,
    startTime: startTime || null,
    endTime: endTime || null,
    sleepQuality: sleepQuality || null
  });
  return response.data;
};

/**
 * 排泄記録を作成または更新（Upsert）
 */
export const upsertToileting = async (
  childId: number,
  recordDate: string,
  urineAmount?: string,
  bowelCondition?: string,
  bowelColor?: string,
  diaperChangeCount?: number
): Promise<{ recordId: number }> => {
  const response = await apiClient.post('/api/desktop/infant-records/toileting', {
    childId,
    recordDate,
    urineAmount: urineAmount || null,
    bowelCondition: bowelCondition || null,
    bowelColor: bowelColor || null,
    diaperChangeCount: diaperChangeCount !== undefined ? diaperChangeCount : null
  });
  return response.data;
};
