/**
 * 生活記録管理 型定義
 * Desktop Application用
 */

// ========================================
// Response DTOs (Backend matching)
// ========================================

/**
 * 乳児ミルク記録 DTO
 */
export interface InfantMilkDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  milkTime: string; // HH:mm format
  amountMl: number;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

/**
 * 乳児食事記録 DTO
 */
export interface InfantMealDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  mealType: MealType;
  mealTime: string; // HH:mm format
  overallAmount?: MealAmount;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

/**
 * 乳児睡眠記録 DTO
 */
export interface InfantSleepDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  sleepSequence: number;
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format
  durationMinutes?: number;
  quality?: SleepQuality;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

/**
 * 乳児排泄記録 DTO
 */
export interface InfantToiletingDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  urineCount: number;
  bowelCount: number;
  bowelCondition?: BowelCondition;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

/**
 * 乳児機嫌記録 DTO
 */
export interface InfantMoodDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  moodTime: string; // HH:mm format
  moodState: MoodState;
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

/**
 * 室温・湿度記録 DTO
 */
export interface RoomEnvironmentDto {
  nurseryId: number;
  classId: string;
  className?: string;
  recordDate: string; // YYYY-MM-DD
  temperature: number;
  humidity: number;
  recordedAt: string; // ISO datetime (YYYY-MM-DDTHH:mm:ss)
  notes?: string;
  createdBy: number;
  createdByName?: string;
  updatedAt: string;
}

// ========================================
// Create DTOs
// ========================================

/**
 * 乳児ミルク記録作成 DTO
 */
export interface CreateInfantMilkDto {
  childId: number;
  recordDate: string; // YYYY-MM-DD
  milkTime: string; // HH:mm
  amountMl: number;
  notes?: string;
}

/**
 * 乳児食事記録作成 DTO
 */
export interface CreateInfantMealDto {
  childId: number;
  recordDate: string;
  mealType: MealType;
  mealTime: string; // HH:mm
  overallAmount?: MealAmount;
  notes?: string;
}

/**
 * 乳児睡眠記録作成 DTO
 */
export interface CreateInfantSleepDto {
  childId: number;
  recordDate: string;
  sleepSequence: number;
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  quality?: SleepQuality;
  notes?: string;
}

/**
 * 乳児排泄記録作成 DTO
 */
export interface CreateInfantToiletingDto {
  childId: number;
  recordDate: string;
  urineCount: number;
  bowelCount: number;
  bowelCondition?: BowelCondition;
  notes?: string;
}

/**
 * 乳児機嫌記録作成 DTO
 */
export interface CreateInfantMoodDto {
  childId: number;
  recordDate: string;
  moodTime: string; // HH:mm
  moodState: MoodState;
  notes?: string;
}

/**
 * 室温・湿度記録作成 DTO
 */
export interface CreateRoomEnvironmentDto {
  classId: string;
  recordDate: string; // YYYY-MM-DD
  recordedAt: string; // ISO 8601 datetime string
  temperature: number;
  humidity: number;
  notes?: string;
}

// ========================================
// Update DTOs
// ========================================

/**
 * 乳児ミルク記録更新 DTO
 */
export interface UpdateInfantMilkDto {
  childId: number;
  recordDate: string;
  milkTime: string; // 変更前の時刻（識別用）
  newMilkTime?: string; // 新しい時刻
  amountMl: number;
  notes?: string;
}

/**
 * 乳児食事記録更新 DTO
 */
export interface UpdateInfantMealDto {
  childId: number;
  recordDate: string;
  mealTime: string; // HH:mm format - 主キーの一部なので必須
  mealType: MealType;
  overallAmount?: MealAmount;
  notes?: string;
}

/**
 * 乳児睡眠記録更新 DTO
 */
export interface UpdateInfantSleepDto {
  childId: number;
  recordDate: string;
  sleepSequence: number;
  startTime: string;
  endTime?: string;
  quality?: SleepQuality;
  notes?: string;
}

/**
 * 乳児排泄記録更新 DTO
 */
export interface UpdateInfantToiletingDto {
  childId: number;
  recordDate: string;
  urineCount: number;
  bowelCount: number;
  bowelCondition?: BowelCondition;
  notes?: string;
}

/**
 * 乳児機嫌記録更新 DTO
 */
export interface UpdateInfantMoodDto {
  childId: number;
  recordDate: string;
  moodTime: string; // 変更前の時刻（識別用）
  newMoodTime?: string; // 新しい時刻
  moodState: MoodState;
  notes?: string;
}

/**
 * 室温・湿度記録更新 DTO
 */
export interface UpdateRoomEnvironmentDto {
  classId: string;
  recordDate: string; // YYYY-MM-DD
  recordedAt: string; // ISO 8601 datetime string
  temperature: number;
  humidity: number;
  notes?: string;
}

// ========================================
// Enums & Constants
// ========================================

/**
 * 食事種別
 * デスクトップアプリでは午前おやつ、昼食、午後おやつの3種類を使用
 * 朝食は保護者のモバイルアプリから家庭で登録
 * データベース値: MorningSnack, Lunch, AfternoonSnack
 */
export type MealType = 'MorningSnack' | 'Lunch' | 'AfternoonSnack';

export const mealTypeLabels: Record<MealType, string> = {
  MorningSnack: '午前おやつ',
  Lunch: '昼食',
  AfternoonSnack: '午後おやつ',
};

/**
 * 食事摂取量
 */
export type MealAmount = 'All' | 'Most' | 'Half' | 'Little' | 'None';

export const mealAmountLabels: Record<MealAmount, string> = {
  All: '完食',
  Most: 'ほぼ完食',
  Half: '半分',
  Little: '少し',
  None: '食べず',
};

/**
 * 睡眠の質
 */
export type SleepQuality = 'Deep' | 'Normal' | 'Light' | 'Restless';

export const sleepQualityLabels: Record<SleepQuality, string> = {
  Deep: 'ぐっすり',
  Normal: '普通',
  Light: '浅い',
  Restless: '不安定',
};

/**
 * 便の状態
 */
export type BowelCondition = 'Normal' | 'Soft' | 'Hard' | 'Diarrhea' | 'Constipation';

export const bowelConditionLabels: Record<BowelCondition, string> = {
  Normal: '正常',
  Soft: '柔らかい',
  Hard: '硬い',
  Diarrhea: '下痢',
  Constipation: '便秘',
};

/**
 * 機嫌状態
 */
export type MoodState = 'Good' | 'Normal' | 'Bad' | 'Crying';

export const moodStateLabels: Record<MoodState, string> = {
  Good: '良い',
  Normal: '普通',
  Bad: '悪い',
  Crying: 'ぐずり・泣き',
};

// ========================================
// Helper Types
// ========================================

/**
 * クラス内の園児一覧取得レスポンス
 */
export interface ClassChildrenResponse {
  classId: string;
  className: string;
  children: ChildInfo[];
}

/**
 * 園児基本情報
 */
export interface ChildInfo {
  childId: number;
  childName: string;
  ageMonths: number;
}
