-- ================================================================
-- 乳児生活記録システム テーブル作成スクリプト
-- 作成日: 2026-01-17
-- ================================================================

-- ================================================================
-- 1. 新規テーブル
-- ================================================================

-- ----------------------------------------------------------------
-- 1.1 InfantMilks（ミルク記録）
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantMilks] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [MilkTime] TIME NOT NULL,
    [AmountMl] INT NOT NULL,
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantMilks_Child_Date ON [dbo].[InfantMilks]([NurseryId], [ChildId], [RecordDate] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantMilks] ADD CONSTRAINT [PK_InfantMilks] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MilkTime])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児ミルク記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'ミルク時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'MilkTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'ミルク量（mL）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'AmountMl'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'メモ', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'Notes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMilks', N'COLUMN', N'UpdatedBy'
/

-- ----------------------------------------------------------------
-- 1.2 InfantSleepChecks（午睡チェック）
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantSleepChecks] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [SleepSequence] INT NOT NULL,
    [CheckTime] TIME NOT NULL,
    [BreathingStatus] NVARCHAR(20) NOT NULL,
    [HeadDirection] NVARCHAR(20) NOT NULL,
    [BodyTemperature] NVARCHAR(20) NOT NULL,
    [FaceColor] NVARCHAR(20) NOT NULL,
    [BodyPosition] NVARCHAR(20) NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantSleepChecks_Sleep ON [dbo].[InfantSleepChecks]([NurseryId], [ChildId], [RecordDate], [SleepSequence], [CheckTime])
/
CREATE INDEX IX_InfantSleepChecks_Alerts ON [dbo].[InfantSleepChecks]([NurseryId], [ChildId], [RecordDate])
    WHERE [BreathingStatus] = N'Abnormal' OR [BodyPosition] = N'FaceDown'
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantSleepChecks] ADD CONSTRAINT [PK_InfantSleepChecks] PRIMARY KEY ([Id])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児午睡チェック記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'Id'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'午睡連番（InfantSleepsのSleepSequenceと紐づく）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'SleepSequence'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'チェック時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'CheckTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'呼吸状態（Normal:正常/Abnormal:異常）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'BreathingStatus'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'頭の向き（Left:左/Right:右/FaceUp:仰向け）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'HeadDirection'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'体温チェック（Normal:正常/SlightlyWarm:やや温かい/Cold:冷たい）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'BodyTemperature'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'顔色（Normal:正常/Pale:蒼白/Purple:紫色）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'FaceColor'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'体勢（OnBack:仰向け/OnSide:横向き/FaceDown:うつ伏せ）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'BodyPosition'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleepChecks', N'COLUMN', N'CreatedBy'
/

-- ================================================================
-- 2. 既存テーブル修正版（カラム追加）
-- ================================================================

-- ----------------------------------------------------------------
-- 2.1 InfantMeals（食事記録）- MealTime, Notes追加
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantMeals] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [MealTime] TIME DEFAULT '12:00:00' NOT NULL,
    [MealType] NVARCHAR(20) NOT NULL,
    [OverallAmount] NVARCHAR(20),
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantMeals_Child_Date ON [dbo].[InfantMeals]([NurseryId], [ChildId], [RecordDate] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantMeals] ADD CONSTRAINT [PK_InfantMeals] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MealTime])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児食事記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'食事時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'MealTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'食事種別（MorningSnack:午前おやつ/Lunch:昼食/AfternoonSnack:午後おやつ/BabyFood:離乳食）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'MealType'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'摂取量（All:完食/Most:ほぼ完食/Half:半分/Little:少量/None:食べず）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'OverallAmount'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'メモ', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'Notes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'UpdatedBy'
/

-- ----------------------------------------------------------------
-- 2.2 InfantSleeps（午睡記録）- 修正不要（参考として記載）
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantSleeps] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [SleepSequence] INT DEFAULT 1 NOT NULL,
    [StartTime] DATETIME2 NOT NULL,
    [EndTime] DATETIME2,
    [DurationMinutes] INT,
    [SleepQuality] NVARCHAR(20),
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantSleeps_Child_Date ON [dbo].[InfantSleeps]([NurseryId], [ChildId], [RecordDate] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantSleeps] ADD CONSTRAINT [PK_InfantSleeps] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [SleepSequence])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児午睡記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'午睡連番', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'SleepSequence'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'開始時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'StartTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'終了時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'EndTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'午睡時間（分）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'DurationMinutes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠の質', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'SleepQuality'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'メモ', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'Notes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'UpdatedBy'
/

-- ----------------------------------------------------------------
-- 2.3 InfantToileting（排泄記録）- HasUrine, HasStool, BowelAmount追加
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantToileting] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [ToiletingTime] DATETIME2 NOT NULL,
    [HasUrine] BIT DEFAULT 0 NOT NULL,
    [UrineAmount] NVARCHAR(20),
    [HasStool] BIT DEFAULT 0 NOT NULL,
    [BowelAmount] NVARCHAR(20),
    [BowelCondition] NVARCHAR(20),
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantToileting_Child_Date ON [dbo].[InfantToileting]([NurseryId], [ChildId], [RecordDate] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantToileting] ADD CONSTRAINT [PK_InfantToileting] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [ToiletingTime])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児排泄記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'おしっこありフラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'HasUrine'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'おしっこ量（Little:少量/Normal:普通/Lot:多量）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UrineAmount'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'うんちありフラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'HasStool'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'うんち量（Little:少量/Normal:普通/Lot:多量）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelAmount'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'うんちの種類（Normal:正常/Soft:軟便/Diarrhea:下痢/Hard:硬い/Bloody:血便）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelCondition'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedBy'
/

-- ----------------------------------------------------------------
-- 2.4 InfantTemperatures（体温記録）- MeasurementLocation, Notes追加
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantTemperatures] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [MeasurementType] NVARCHAR(20) NOT NULL,
    [MeasuredAt] DATETIME2 NOT NULL,
    [Temperature] DECIMAL(3, 1) NOT NULL,
    [MeasurementLocation] NVARCHAR(20) DEFAULT N'Armpit' NOT NULL,
    [Notes] NVARCHAR(500),
    [IsAbnormal] BIT DEFAULT 0 NOT NULL,
    [CreatedByType] NVARCHAR(20) DEFAULT 'Staff' NOT NULL,
    [IsDraft] BIT DEFAULT 0 NOT NULL,
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantTemperatures_CreatedByType ON [dbo].[InfantTemperatures]([NurseryId], [ChildId], [RecordDate], [CreatedByType])
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantTemperatures] ADD CONSTRAINT [PK_InfantTemperatures] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MeasurementType])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児体温記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'測定タイプ（Morning:朝/Afternoon:午後）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasurementType'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'測定日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasuredAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'体温（℃）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'Temperature'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'測定箇所（Armpit:脇下/Ear:耳/Forehead:額）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasurementLocation'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'メモ', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'Notes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'異常フラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'IsAbnormal'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者タイプ（Parent:保護者入力/Staff:スタッフ入力）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedByType'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'一時保存フラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'IsDraft'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedBy'
/

-- ----------------------------------------------------------------
-- 2.5 InfantMoods（機嫌記録）- RecordTime追加
-- ----------------------------------------------------------------
CREATE TABLE [dbo].[InfantMoods] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [RecordTime] TIME NOT NULL,
    [MoodState] NVARCHAR(20) NOT NULL,
    [Notes] NVARCHAR(500),
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedBy] INT NOT NULL
)
/

-- インデックスの作成
CREATE INDEX IX_InfantMoods_Child_Date ON [dbo].[InfantMoods]([NurseryId], [ChildId], [RecordDate] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[InfantMoods] ADD CONSTRAINT [PK_InfantMoods] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [RecordTime])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児機嫌記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', NULL, NULL
/
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'NurseryId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'ChildId'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'RecordDate'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'記録時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'RecordTime'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'機嫌状態（Good:良い/Normal:普通/Bad:不機嫌/Crying:泣いている）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'MoodState'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'様子・特記事項', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'Notes'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'CreatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'CreatedBy'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'UpdatedAt'
/
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'UpdatedBy'
/

-- ================================================================
-- END OF SCRIPT
-- ================================================================
