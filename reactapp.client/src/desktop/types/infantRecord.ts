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
 * 乳児排泄記録 DTO (おむつ記録)
 */
export interface InfantToiletingDto {
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  toiletingTime: string; // ISO 8601 datetime string
  hasUrine: boolean;
  urineAmount?: string; // 'Little', 'Normal', 'Lot'
  hasStool: boolean;
  bowelAmount?: string; // 'Little', 'Normal', 'Lot'
  bowelCondition?: string; // 'Normal', 'Soft', 'Diarrhea', 'Hard', 'Bloody'
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

/**
 * 乳児体温記録 DTO
 */
export interface InfantTemperatureDto {
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  measurementType: MeasurementType;
  measuredAt: string; // ISO datetime
  measuredTime: string; // HH:mm format
  temperature: number;
  measurementLocation: MeasurementLocation;
  notes?: string;
  isAbnormal: boolean;
  createdByName?: string;
  createdAt: string;
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
 * 乳児排泄記録作成 DTO (おむつ記録)
 */
export interface CreateInfantToiletingDto {
  childId: number;
  recordDate: Date;
  toiletingTime: Date;
  hasUrine: boolean;
  urineAmount?: string;
  hasStool: boolean;
  bowelAmount?: string;
  bowelCondition?: string;
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

/**
 * 乳児体温記録作成 DTO
 */
export interface CreateInfantTemperatureDto {
  childId: number;
  recordDate: Date;
  measurementType: MeasurementType;
  measuredAt: Date;
  temperature: number;
  measurementLocation: MeasurementLocation;
  notes?: string;
  isAbnormal: boolean;
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
 * 乳児排泄記録更新 DTO (おむつ記録)
 */
export interface UpdateInfantToiletingDto {
  childId: number;
  recordDate: Date;
  toiletingTime: Date;
  hasUrine: boolean;
  urineAmount?: string;
  hasStool: boolean;
  bowelAmount?: string;
  bowelCondition?: string;
}

/**
 * 乳児機嫌記録更新 DTO
 */
export interface UpdateInfantMoodDto {
  childId: number;
  recordDate: string;
  moodTime: string; // 識別用の時刻（複合キーのため変更不可）
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

/**
 * 乳児体温記録更新 DTO
 */
export interface UpdateInfantTemperatureDto {
  childId: number;
  recordDate: Date;
  measurementType: MeasurementType;
  measuredAt: Date;
  temperature: number;
  measurementLocation: MeasurementLocation;
  notes?: string;
  isAbnormal: boolean;
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

/**
 * 体温測定種別
 */
export type MeasurementType = 'Morning' | 'Afternoon';

export const measurementTypeLabels: Record<MeasurementType, string> = {
  Morning: '午前',
  Afternoon: '午後',
};

/**
 * 体温測定箇所
 */
export type MeasurementLocation = 'Armpit' | 'Ear' | 'Forehead';

export const measurementLocationLabels: Record<MeasurementLocation, string> = {
  Armpit: '脇下',
  Ear: '耳',
  Forehead: '額',
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

// ========================================
// 午睡チェック記録 (Sleep Check Records)
// ========================================

/**
 * 午睡チェック記録 DTO
 */
export interface InfantSleepCheckDto {
  id: number;
  nurseryId: number;
  childId: number;
  childName: string;
  recordDate: string; // YYYY-MM-DD
  sleepSequence: number;
  checkTime: string; // HH:mm format
  breathingStatus: BreathingStatus;
  headDirection: HeadDirection;
  bodyTemperature: BodyTemperatureStatus;
  faceColor: FaceColorStatus;
  bodyPosition: BodyPositionStatus;
  createdByName?: string;
  createdAt: string;
  createdBy: number;
}

/**
 * 午睡チェック記録作成 DTO
 */
export interface CreateInfantSleepCheckDto {
  childId: number;
  recordDate: string; // YYYY-MM-DD
  sleepSequence: number;
  checkTime: string; // HH:mm format
  breathingStatus: BreathingStatus;
  headDirection: HeadDirection;
  bodyTemperature: BodyTemperatureStatus;
  faceColor: FaceColorStatus;
  bodyPosition: BodyPositionStatus;
}

/**
 * 午睡チェック記録更新 DTO
 */
export interface UpdateInfantSleepCheckDto {
  breathingStatus: BreathingStatus;
  headDirection: HeadDirection;
  bodyTemperature: BodyTemperatureStatus;
  faceColor: FaceColorStatus;
  bodyPosition: BodyPositionStatus;
}

/**
 * クラス別午睡チェック表 DTO（横軸時間型グリッド用）
 */
export interface SleepCheckGridDto {
  classId: string;
  className: string;
  recordDate: string; // YYYY-MM-DD
  roomTemperature?: number;
  humidity?: number;
  children: ChildSleepCheckDto[];
}

/**
 * 園児別午睡チェック情報
 */
export interface ChildSleepCheckDto {
  childId: number;
  childName: string;
  ageInMonths: number;
  sleepStartTime?: string; // HH:mm format
  sleepEndTime?: string; // HH:mm format
  checks: InfantSleepCheckDto[];
}

/**
 * 呼吸状態
 */
export type BreathingStatus = 'Normal' | 'Abnormal';

/**
 * 頭の向き
 */
export type HeadDirection = 'Left' | 'Right' | 'FaceUp';

/**
 * 体温状態
 */
export type BodyTemperatureStatus = 'Normal' | 'SlightlyWarm' | 'Cold';

/**
 * 顔色
 */
export type FaceColorStatus = 'Normal' | 'Pale' | 'Purple';

/**
 * 体勢
 */
export type BodyPositionStatus = 'OnBack' | 'OnSide' | 'FaceDown';

/**
 * 呼吸状態ラベル
 */
export const breathingStatusLabels: Record<BreathingStatus, string> = {
  Normal: '正常',
  Abnormal: '異常',
};

/**
 * 頭の向きラベル
 */
export const headDirectionLabels: Record<HeadDirection, string> = {
  Left: '左',
  Right: '右',
  FaceUp: '上',
};

/**
 * 体温状態ラベル
 */
export const bodyTemperatureLabels: Record<BodyTemperatureStatus, string> = {
  Normal: '正常',
  SlightlyWarm: 'やや温かい',
  Cold: '冷たい',
};

/**
 * 顔色ラベル
 */
export const faceColorLabels: Record<FaceColorStatus, string> = {
  Normal: '正常',
  Pale: '青白い',
  Purple: '紫色',
};

/**
 * 体勢ラベル
 */
export const bodyPositionLabels: Record<BodyPositionStatus, string> = {
  OnBack: '仰向け',
  OnSide: '横向き',
  FaceDown: 'うつ伏せ',
};
