/**
 * 乳児記録管理関連の型定義
 */

/**
 * 体温測定データ
 */
export interface TemperatureMeasurement {
  temperature: number;
  measurementLocation: string; // 'Armpit', 'Ear', 'Forehead'
  measuredAt: string; // ISO 8601 datetime string
  notes?: string;
}

/**
 * 園児別体温データ
 */
export interface ChildTemperatureData {
  childId: number;
  morning?: TemperatureMeasurement;
  afternoon?: TemperatureMeasurement;
}

/**
 * クラス一括体温入力リクエスト
 */
export interface ClassTemperatureBulkRequest {
  nurseryId: number;
  classId: string;
  recordDate: string; // ISO 8601 date string
  temperatures: ChildTemperatureData[];
}

/**
 * 体温警告情報
 */
export interface TemperatureWarning {
  childId: number;
  childName: string;
  measurementType: string; // 'Morning', 'Afternoon'
  temperature: number;
  message: string;
}

/**
 * クラス一括体温入力レスポンス
 */
export interface ClassTemperatureBulkResponse {
  success: boolean;
  savedCount: number;
  skippedCount: number;
  warnings: TemperatureWarning[];
}

/**
 * 家庭での体温情報(保護者入力)
 */
export interface HomeTemperatureInfo {
  temperature?: number;
  measurementLocation?: string;
  measuredAt?: string;
  isAbnormal: boolean;
}

/**
 * 朝の体温情報
 */
export interface MorningTemperatureInfo {
  temperature?: number;
  measurementLocation?: string;
  measuredAt?: string;
  isParentInput: boolean;
  isAbnormal: boolean;
}

/**
 * 午後の体温情報
 */
export interface AfternoonTemperatureInfo {
  temperature?: number;
  measurementLocation?: string;
  measuredAt?: string;
  isAbnormal: boolean;
}

/**
 * 園児体温情報
 */
export interface ChildTemperatureInfo {
  childId: number;
  childName: string;
  ageMonths: number;
  home?: HomeTemperatureInfo;
  morning?: MorningTemperatureInfo;
  afternoon?: AfternoonTemperatureInfo;
}

/**
 * クラス体温一覧取得レスポンス
 */
export interface ClassTemperatureListResponse {
  classId: string;
  className: string;
  recordDate: string; // ISO 8601 date string
  children: ChildTemperatureInfo[];
}

/**
 * 乳児ミルク記録
 */
export interface InfantMilk {
  nurseryId: number;
  childId: number;
  recordDate: string; // ISO 8601 date string
  milkTime: string; // HH:mm:ss format
  amountMl: number;
  notes?: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

/**
 * 乳児ミルク記録作成リクエスト
 */
export interface CreateInfantMilkRequest {
  nurseryId: number;
  childId: number;
  recordDate: string;
  milkTime: string;
  amountMl: number;
  notes?: string;
}

/**
 * 午睡チェック記録
 */
export interface InfantSleepCheck {
  id: number;
  nurseryId: number;
  childId: number;
  recordDate: string; // ISO 8601 date string
  sleepSequence: number;
  checkTime: string; // HH:mm:ss format
  breathingStatus: string; // 'Normal', 'Abnormal'
  headDirection: string; // 'Left', 'Right', 'FaceUp'
  bodyTemperature: string; // 'Normal', 'SlightlyWarm', 'Cold'
  faceColor: string; // 'Normal', 'Pale', 'Purple'
  bodyPosition: string; // 'OnBack', 'OnSide', 'FaceDown'
  notes?: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

/**
 * 午睡チェック記録作成リクエスト
 */
export interface CreateInfantSleepCheckRequest {
  nurseryId: number;
  childId: number;
  recordDate: string;
  sleepSequence: number;
  checkTime: string;
  breathingStatus: string;
  headDirection: string;
  bodyTemperature: string;
  faceColor: string;
  bodyPosition: string;
  notes?: string;
}

/**
 * 室温・湿度記録
 */
export interface RoomEnvironmentRecord {
  nurseryId: number;
  classId: string;
  recordDate: string; // ISO 8601 date string
  temperature: number;
  humidity: number;
  recordedAt: string;
  notes?: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

/**
 * 室温・湿度記録作成リクエスト
 */
export interface CreateRoomEnvironmentRecordRequest {
  nurseryId: number;
  classId: string;
  recordDate: string;
  temperature: number;
  humidity: number;
  recordedAt: string;
  notes?: string;
}

/**
 * 乳児体温記録
 */
export interface InfantTemperature {
  nurseryId: number;
  childId: number;
  recordDate: string; // ISO 8601 date string
  measurementType: string; // 'Morning', 'Afternoon'
  temperature: number;
  measurementLocation: string;
  measuredAt: string;
  isParentInput: boolean;
  notes?: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

/**
 * 乳児体温記録作成リクエスト
 */
export interface CreateInfantTemperatureRequest {
  nurseryId: number;
  childId: number;
  recordDate: string;
  measurementType: string;
  temperature: number;
  measurementLocation: string;
  measuredAt: string;
  isParentInput: boolean;
  notes?: string;
}
