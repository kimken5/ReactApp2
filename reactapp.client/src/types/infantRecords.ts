// 週次生活記録の型定義

export interface WeeklyRecordResponse {
  children: ChildWeeklyRecord[];
}

export interface ChildWeeklyRecord {
  childId: number;
  firstName: string;
  dailyRecords: Record<string, DailyRecord>; // key: "2026-01-04"
}

export interface DailyRecord {
  home?: HomeRecord;
  morning?: MorningRecord;
  afternoon?: AfternoonRecord;
  toileting?: ToiletingRecord;
}

export interface HomeRecord {
  temperature?: TemperatureRecord;
  parentNote?: ParentNoteRecord;
}

export interface MorningRecord {
  temperature?: TemperatureRecord;
  snack?: MealRecord;
  mood?: MoodRecord;
}

export interface AfternoonRecord {
  mood?: MoodRecord;
  lunch?: MealRecord;
  nap?: SleepRecord;
  temperature?: TemperatureRecord;
  snack?: MealRecord;
}

export interface ToiletingRecord {
  id?: number;
  urineAmount?: string; // 'Little', 'Normal', 'Lot'
  bowelCondition?: string; // 'Normal', 'Hard', 'Soft', 'Diarrhea'
  bowelColor?: string; // 'Normal', 'Green', 'White', 'Black', 'Bloody'
  diaperChangeCount?: number;
  readonly: boolean;
}

export interface TemperatureRecord {
  id?: number;
  value?: number;
  time?: string; // "08:30"
  readonly: boolean;
}

export interface ParentNoteRecord {
  id?: number;
  text?: string;
  readonly: boolean;
}

export interface MealRecord {
  id?: number;
  amount?: string; // 'All', 'Most', 'Half', 'Little', 'None'
  readonly: boolean;
}

export interface MoodRecord {
  id?: number;
  state?: string; // 'VeryGood', 'Good', 'Normal', 'Bad', 'Crying'
  readonly: boolean;
}

export interface SleepRecord {
  id?: number;
  start?: string; // "12:30"
  end?: string; // "14:00"
  duration?: number; // 90 (minutes)
  readonly: boolean;
}

// 更新リクエストDTO
export interface UpdateTemperatureDto {
  temperature: number;
  measurementTime: string; // "HH:mm"
}

export interface UpdateMealDto {
  amount: string;
}

export interface UpdateMoodDto {
  state: string;
}

export interface UpdateSleepDto {
  startTime: string;
  endTime: string;
}

export interface UpdateToiletingDto {
  urineAmount?: string;
  bowelCondition?: string;
  bowelColor?: string;
  diaperChangeCount?: number;
}

// 編集用の型
export type RecordType = 'temperature' | 'meal' | 'mood' | 'sleep' | 'toileting';
export type MeasurementType = 'home' | 'morning' | 'afternoon';
export type ToiletingSubType = 'urine' | 'bowel' | 'diaper';

export interface EditingCell {
  childId: number;
  childName: string;
  date: string;
  recordType: RecordType;
  measurementType?: MeasurementType; // for temperature
  mealType?: 'snack' | 'lunch'; // for meal
  moodTime?: 'morning' | 'afternoon'; // for mood
  toiletingSubType?: ToiletingSubType; // for toileting
  currentValue: any;
  recordId?: number;
}
