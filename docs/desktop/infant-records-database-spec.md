# デスクトップアプリ 乳児生活記録機能 データベース仕様書

## 1. 概要

### 1.1 目的
デスクトップアプリの週次生活記録機能で使用するデータベーステーブルの構造、リレーション、クエリ仕様を定義する。

### 1.2 データベース
- **DBMS**: Azure SQL Database
- **照合順序**: Japanese_CI_AS
- **文字セット**: UTF-8
- **日時**: JST (日本標準時) で統一

---

## 2. 使用テーブル一覧

| テーブル名 | 説明 | 用途 |
|-----------|------|------|
| InfantTemperatures | 体温記録 | 家庭・午前・午後の体温データ |
| ParentMorningNote | 保護者からの申し送り | 朝の子供の様子 |
| InfantMeals | 食事記録 | 午前おやつ・昼食・午後おやつ |
| InfantMoods | 機嫌記録 | 午前・午後の機嫌 |
| InfantSleeps | 昼寝記録 | 昼寝の開始・終了時刻、睡眠時間 |
| InfantToileting | 排泄記録 | おしっこの量、うんちの様子、オムツ交換回数 |
| Children | 園児マスタ | 園児の基本情報 |
| Classes | クラスマスタ | クラスの基本情報 |

---

## 3. テーブル定義

### 3.1 InfantTemperatures (体温記録)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[InfantTemperatures] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [MeasurementType] NVARCHAR(20) NOT NULL, -- 'Home', 'Morning', 'Afternoon'
  [MeasuredAt] DATETIME2 NOT NULL,
  [Temperature] DECIMAL(3, 1) NOT NULL,
  [IsAbnormal] BIT DEFAULT 0 NOT NULL,
  [CreatedByType] NVARCHAR(20) DEFAULT 'Staff' NOT NULL, -- 'Parent', 'Staff'
  [IsDraft] BIT DEFAULT 0 NOT NULL,
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK__InfantTe] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MeasurementType])
);

CREATE INDEX IX_InfantTemperatures_CreatedByType
ON [dbo].[InfantTemperatures]([NurseryId], [ChildId], [RecordDate], [CreatedByType]);
```

**列説明**:
- `MeasurementType`: 測定タイミング
  - `'Home'`: 家庭での朝の体温 (保護者入力)
  - `'Morning'`: 園の午前の体温 (スタッフ入力)
  - `'Afternoon'`: 園の午後の体温 (スタッフ入力)
- `CreatedByType`: 入力者タイプ
  - `'Parent'`: 保護者入力 → デスクトップでは読取専用
  - `'Staff'`: スタッフ入力 → デスクトップで編集可能

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  MeasurementType,
  MeasuredAt,
  Temperature,
  IsAbnormal,
  CreatedByType
FROM InfantTemperatures
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
ORDER BY ChildId, RecordDate,
  CASE MeasurementType
    WHEN 'Home' THEN 1
    WHEN 'Morning' THEN 2
    WHEN 'Afternoon' THEN 3
  END;
```

---

### 3.2 ParentMorningNote (保護者からの申し送り)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[ParentMorningNote] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [Note] NVARCHAR(500) NOT NULL,
  [IsDraft] BIT DEFAULT 0 NOT NULL,
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK_ParentMorningNote] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate])
);

CREATE INDEX IX_ParentMorningNote_Child_Date
ON [dbo].[ParentMorningNote]([NurseryId], [ChildId], [RecordDate]);
```

**列説明**:
- `Note`: 保護者からの申し送り内容 (最大500文字)
- デスクトップでは常に読取専用

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  Note
FROM ParentMorningNote
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
  AND IsDraft = 0
ORDER BY ChildId, RecordDate;
```

---

### 3.3 InfantMeals (食事記録)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[InfantMeals] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [MealType] NVARCHAR(20) NOT NULL, -- 'Breakfast', 'Lunch', 'Snack'
  [OverallAmount] NVARCHAR(20), -- 'All', 'Most', 'Half', 'Little', 'None'
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK__InfantMe__02915A0DFBB15B9C]
    PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MealType])
);
```

**列説明**:
- `MealType`: 食事タイプ
  - `'Breakfast'`: 午前おやつ
  - `'Lunch'`: 昼食
  - `'Snack'`: 午後おやつ
- `OverallAmount`: 摂取量
  - `'All'`: 完食
  - `'Most'`: ほとんど
  - `'Half'`: 半分
  - `'Little'`: 少し
  - `'None'`: なし

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  MealType,
  OverallAmount
FROM InfantMeals
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
ORDER BY ChildId, RecordDate,
  CASE MealType
    WHEN 'Breakfast' THEN 1
    WHEN 'Lunch' THEN 2
    WHEN 'Snack' THEN 3
  END;
```

---

### 3.4 InfantMoods (機嫌記録)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[InfantMoods] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [MoodTime] NVARCHAR(20) NOT NULL, -- 'Morning', 'Afternoon'
  [MoodState] NVARCHAR(20) NOT NULL, -- 'Good', 'Normal', 'Bad', 'Crying'
  [Notes] NVARCHAR(500),
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK__InfantMo__9B54A36DBEEADCE0]
    PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [MoodTime])
);
```

**列説明**:
- `MoodTime`: 機嫌確認時間帯
  - `'Morning'`: 午前
  - `'Afternoon'`: 午後
- `MoodState`: 機嫌状態
  - `'Good'`: 良い
  - `'Normal'`: 普通
  - `'Bad'`: 悪い
  - `'Crying'`: 泣いていた

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  MoodTime,
  MoodState,
  Notes
FROM InfantMoods
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
ORDER BY ChildId, RecordDate,
  CASE MoodTime
    WHEN 'Morning' THEN 1
    WHEN 'Afternoon' THEN 2
  END;
```

---

### 3.5 InfantSleeps (昼寝記録)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[InfantSleeps] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [SleepSequence] INT DEFAULT 1 NOT NULL,
  [StartTime] DATETIME2 NOT NULL,
  [EndTime] DATETIME2,
  [DurationMinutes] AS (DATEDIFF(MINUTE, StartTime, EndTime)) PERSISTED,
  [SleepQuality] NVARCHAR(20),
  [Notes] NVARCHAR(500),
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK__InfantSleeps]
    PRIMARY KEY ([NurseryId], [ChildId], [RecordDate], [SleepSequence])
);
```

**列説明**:
- `SleepSequence`: 同日に複数回昼寝する場合のシーケンス番号 (通常は1)
- `DurationMinutes`: 睡眠時間 (計算列、自動計算)

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  SleepSequence,
  StartTime,
  EndTime,
  DurationMinutes,
  SleepQuality,
  Notes
FROM InfantSleeps
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
ORDER BY ChildId, RecordDate, SleepSequence;
```

---

### 3.6 InfantToileting (排泄記録)

**テーブル構造**:
```sql
CREATE TABLE [dbo].[InfantToileting] (
  [NurseryId] INT NOT NULL,
  [ChildId] INT NOT NULL,
  [RecordDate] DATE NOT NULL,
  [ToiletingTime] DATETIME2 NOT NULL,
  [ToiletingType] NVARCHAR(20) NOT NULL, -- 'Urine', 'Bowel'
  [BowelCondition] NVARCHAR(20), -- 'Normal', 'Soft', 'Diarrhea', 'Hard'
  [BowelColor] NVARCHAR(20), -- 'Normal', 'Green', 'White', 'Black', 'Bloody'
  [UrineAmount] NVARCHAR(20), -- 'Little', 'Normal', 'Lot'
  [DiaperChangeCount] INT,
  [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [CreatedBy] INT NOT NULL,
  [UpdatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
  [UpdatedBy] INT NOT NULL,

  CONSTRAINT [PK__InfantTo__7633B73838B467A0]
    PRIMARY KEY ([NurseryId], [ChildId], [RecordDate])
);

CREATE INDEX IX_InfantToileting_Record
ON [dbo].[InfantToileting]([NurseryId], [ChildId], [RecordDate], [ToiletingTime]);

CREATE INDEX IX_InfantToileting_Time
ON [dbo].[InfantToileting]([ToiletingTime]);
```

**列説明**:
- **1日1レコード** (主キー: NurseryId, ChildId, RecordDate)
- `UrineAmount`: おしっこの1日の総量
  - `'Little'`: 少量
  - `'Normal'`: 普通
  - `'Lot'`: 多量
- `BowelCondition`: 便の状態
  - `'Normal'`: 普通
  - `'Hard'`: 硬め
  - `'Soft'`: 軟便
  - `'Diarrhea'`: 下痢
- `BowelColor`: 便の色
  - `'Normal'`: 普通 (茶色)
  - `'Green'`: 緑色
  - `'White'`: 白色
  - `'Black'`: 黒色
  - `'Bloody'`: 血便
- `DiaperChangeCount`: オムツ交換回数 (0～20回)

**デスクトップ表示形式**:
- おしっこ: 量のみ表示 (例: `普通`, `多量`)
- うんち: 状態/色 の形式 (例: `軟便/普通`, `普通/黒色`)
- おむつ交換: 回数 + "回" (例: `3回`)

**週次データ取得クエリ**:
```sql
SELECT
  NurseryId,
  ChildId,
  RecordDate,
  UrineAmount,
  BowelCondition,
  BowelColor,
  DiaperChangeCount
FROM InfantToileting
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM Children WHERE ClassId = @classId)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate
ORDER BY ChildId, RecordDate;
```

---

## 4. データアクセスパターン

### 4.1 週次データ一括取得

**目的**: 週次マトリックスビューの初期表示

**クエリ戦略**:
```sql
-- 1. 対象園児IDを取得
DECLARE @ChildIds TABLE (ChildId INT);
INSERT INTO @ChildIds
SELECT ChildId
FROM Children
WHERE NurseryId = @nurseryId
  AND ClassId = @classId;

-- 2. 各テーブルから週次データを取得 (7つのクエリを並列実行)
-- 体温
SELECT * FROM InfantTemperatures
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 申し送り
SELECT * FROM ParentMorningNote
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 食事
SELECT * FROM InfantMeals
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 機嫌
SELECT * FROM InfantMoods
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 昼寝
SELECT * FROM InfantSleeps
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 排泄
SELECT * FROM InfantToileting
WHERE NurseryId = @nurseryId
  AND ChildId IN (SELECT ChildId FROM @ChildIds)
  AND RecordDate BETWEEN @weekStartDate AND @weekEndDate;

-- 園児情報
SELECT ChildId, FirstName
FROM Children
WHERE ChildId IN (SELECT ChildId FROM @ChildIds)
ORDER BY FirstName;
```

### 4.2 個別レコード更新

**体温更新**:
```sql
-- 既存レコードがあれば更新、なければ挿入
MERGE INTO InfantTemperatures AS target
USING (SELECT
  @nurseryId AS NurseryId,
  @childId AS ChildId,
  @recordDate AS RecordDate,
  @measurementType AS MeasurementType
) AS source
ON target.NurseryId = source.NurseryId
  AND target.ChildId = source.ChildId
  AND target.RecordDate = source.RecordDate
  AND target.MeasurementType = source.MeasurementType
WHEN MATCHED THEN
  UPDATE SET
    Temperature = @temperature,
    MeasuredAt = @measuredAt,
    IsAbnormal = CASE WHEN @temperature >= 37.5 THEN 1 ELSE 0 END,
    UpdatedAt = [dbo].[GetJstDateTime](),
    UpdatedBy = @staffId
WHEN NOT MATCHED THEN
  INSERT (NurseryId, ChildId, RecordDate, MeasurementType,
          MeasuredAt, Temperature, IsAbnormal,
          CreatedByType, CreatedBy, UpdatedBy)
  VALUES (@nurseryId, @childId, @recordDate, @measurementType,
          @measuredAt, @temperature,
          CASE WHEN @temperature >= 37.5 THEN 1 ELSE 0 END,
          'Staff', @staffId, @staffId);
```

**食事更新**:
```sql
MERGE INTO InfantMeals AS target
USING (SELECT
  @nurseryId AS NurseryId,
  @childId AS ChildId,
  @recordDate AS RecordDate,
  @mealType AS MealType
) AS source
ON target.NurseryId = source.NurseryId
  AND target.ChildId = source.ChildId
  AND target.RecordDate = source.RecordDate
  AND target.MealType = source.MealType
WHEN MATCHED THEN
  UPDATE SET
    OverallAmount = @amount,
    UpdatedAt = [dbo].[GetJstDateTime](),
    UpdatedBy = @staffId
WHEN NOT MATCHED THEN
  INSERT (NurseryId, ChildId, RecordDate, MealType,
          OverallAmount, CreatedBy, UpdatedBy)
  VALUES (@nurseryId, @childId, @recordDate, @mealType,
          @amount, @staffId, @staffId);
```

**排泄更新** (1日1レコード):
```sql
MERGE INTO InfantToileting AS target
USING (SELECT
  @nurseryId AS NurseryId,
  @childId AS ChildId,
  @recordDate AS RecordDate
) AS source
ON target.NurseryId = source.NurseryId
  AND target.ChildId = source.ChildId
  AND target.RecordDate = source.RecordDate
WHEN MATCHED THEN
  UPDATE SET
    UrineAmount = @urineAmount,
    BowelCondition = @bowelCondition,
    BowelColor = @bowelColor,
    DiaperChangeCount = @diaperChangeCount,
    ToiletingTime = [dbo].[GetJstDateTime](),
    UpdatedAt = [dbo].[GetJstDateTime](),
    UpdatedBy = @staffId
WHEN NOT MATCHED THEN
  INSERT (NurseryId, ChildId, RecordDate, ToiletingTime, ToiletingType,
          UrineAmount, BowelCondition, BowelColor, DiaperChangeCount,
          CreatedBy, UpdatedBy)
  VALUES (@nurseryId, @childId, @recordDate, [dbo].[GetJstDateTime](), 'Mixed',
          @urineAmount, @bowelCondition, @bowelColor, @diaperChangeCount,
          @staffId, @staffId);
```

---

## 5. パフォーマンス最適化

### 5.1 インデックス戦略

**カバリングインデックス** (週次データ取得用):
```sql
-- InfantTemperatures
CREATE INDEX IX_InfantTemperatures_Weekly
ON InfantTemperatures(NurseryId, ChildId, RecordDate)
INCLUDE (MeasurementType, MeasuredAt, Temperature, IsAbnormal, CreatedByType);

-- InfantMeals
CREATE INDEX IX_InfantMeals_Weekly
ON InfantMeals(NurseryId, ChildId, RecordDate)
INCLUDE (MealType, OverallAmount);

-- InfantMoods
CREATE INDEX IX_InfantMoods_Weekly
ON InfantMoods(NurseryId, ChildId, RecordDate)
INCLUDE (MoodTime, MoodState, Notes);

-- InfantSleeps
CREATE INDEX IX_InfantSleeps_Weekly
ON InfantSleeps(NurseryId, ChildId, RecordDate)
INCLUDE (SleepSequence, StartTime, EndTime, DurationMinutes);
```

### 5.2 クエリ最適化

**統計情報の定期更新**:
```sql
-- 毎日1回実行 (夜間バッチ)
UPDATE STATISTICS InfantTemperatures WITH FULLSCAN;
UPDATE STATISTICS InfantMeals WITH FULLSCAN;
UPDATE STATISTICS InfantMoods WITH FULLSCAN;
UPDATE STATISTICS InfantSleeps WITH FULLSCAN;
UPDATE STATISTICS InfantToileting WITH FULLSCAN;
UPDATE STATISTICS ParentMorningNote WITH FULLSCAN;
```

---

## 6. データ整合性

### 6.1 制約

**体温の範囲チェック**:
```sql
ALTER TABLE InfantTemperatures
ADD CONSTRAINT CHK_Temperature_Range
CHECK (Temperature BETWEEN 34.0 AND 42.0);
```

**オムツ交換回数の範囲チェック**:
```sql
ALTER TABLE InfantToileting
ADD CONSTRAINT CHK_DiaperChange_Range
CHECK (DiaperChangeCount BETWEEN 0 AND 20);
```

### 6.2 トリガー

**体温異常フラグ自動設定**:
```sql
CREATE TRIGGER trg_InfantTemperatures_SetAbnormal
ON InfantTemperatures
AFTER INSERT, UPDATE
AS
BEGIN
  UPDATE InfantTemperatures
  SET IsAbnormal = CASE WHEN i.Temperature >= 37.5 THEN 1 ELSE 0 END
  FROM InfantTemperatures t
  INNER JOIN inserted i
    ON t.NurseryId = i.NurseryId
    AND t.ChildId = i.ChildId
    AND t.RecordDate = i.RecordDate
    AND t.MeasurementType = i.MeasurementType;
END;
```

---

## 7. バックアップとリカバリ

### 7.1 バックアップ戦略

- **フルバックアップ**: 毎日1回 (深夜2時)
- **差分バックアップ**: 6時間ごと
- **トランザクションログバックアップ**: 1時間ごと

### 7.2 データ保持期間

- **本番データ**: 無期限保持
- **削除フラグ**: 論理削除のみ (物理削除しない)
- **監査ログ**: 7年間保持 (法的要件)

---

## 8. セキュリティ

### 8.1 Row-Level Security

**将来実装予定**:
```sql
-- スタッフは担当クラスのみアクセス可能
CREATE SECURITY POLICY InfantRecords_Security_Policy
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_Staff(ChildId)
ON dbo.InfantTemperatures,
ADD FILTER PREDICATE dbo.fn_SecurityPredicate_Staff(ChildId)
ON dbo.InfantMeals,
-- 他のテーブルにも適用...
WITH (STATE = ON);
```

### 8.2 監査ログ

**変更履歴トラッキング**:
```sql
-- 将来実装予定: Temporal Tablesを使用
ALTER TABLE InfantTemperatures
ADD
  SysStartTime DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN,
  SysEndTime DATETIME2 GENERATED ALWAYS AS ROW END HIDDEN,
  PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime);

ALTER TABLE InfantTemperatures
SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.InfantTemperatures_History));
```

---

## 9. データマイグレーション

### 9.1 既存データの移行

**モバイルアプリで入力されたデータ**:
- すでに正しいテーブル構造で保存されている
- 追加のマイグレーションは不要

### 9.2 データクレンジング

**データ品質チェック**:
```sql
-- 体温の異常値チェック
SELECT * FROM InfantTemperatures
WHERE Temperature < 34.0 OR Temperature > 42.0;

-- 昼寝時間の異常値チェック (24時間以上)
SELECT * FROM InfantSleeps
WHERE DurationMinutes > 1440;

-- NULL値チェック
SELECT * FROM InfantMeals
WHERE OverallAmount IS NULL;
```

---

## 10. パフォーマンス監視

### 10.1 監視クエリ

**スロークエリ検出**:
```sql
-- 実行時間が3秒以上のクエリを検出
SELECT
  qt.text AS QueryText,
  qs.execution_count AS ExecutionCount,
  qs.total_elapsed_time / 1000000.0 AS TotalElapsedTimeSeconds,
  qs.total_elapsed_time / qs.execution_count / 1000000.0 AS AvgElapsedTimeSeconds
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qs.total_elapsed_time / qs.execution_count / 1000000.0 > 3
ORDER BY AvgElapsedTimeSeconds DESC;
```

### 10.2 インデックス使用状況

```sql
-- 未使用インデックスの検出
SELECT
  OBJECT_NAME(i.object_id) AS TableName,
  i.name AS IndexName,
  i.type_desc AS IndexType,
  s.user_seeks,
  s.user_scans,
  s.user_lookups
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
  ON i.object_id = s.object_id
  AND i.index_id = s.index_id
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND s.user_seeks = 0
  AND s.user_scans = 0
  AND s.user_lookups = 0
ORDER BY TableName, IndexName;
```

---

## 11. ER図

```
Children (園児マスタ)
  │
  ├─ InfantTemperatures (体温記録)
  │   ├─ MeasurementType = 'Home' (家庭)
  │   ├─ MeasurementType = 'Morning' (午前)
  │   └─ MeasurementType = 'Afternoon' (午後)
  │
  ├─ ParentMorningNote (保護者からの申し送り)
  │
  ├─ InfantMeals (食事記録)
  │   ├─ MealType = 'Breakfast' (午前おやつ)
  │   ├─ MealType = 'Lunch' (昼食)
  │   └─ MealType = 'Snack' (午後おやつ)
  │
  ├─ InfantMoods (機嫌記録)
  │   ├─ MoodTime = 'Morning' (午前)
  │   └─ MoodTime = 'Afternoon' (午後)
  │
  ├─ InfantSleeps (昼寝記録)
  │
  └─ InfantToileting (排泄記録)
      ├─ UrineAmount (おしっこの量)
      ├─ BowelCondition (便の状態)
      ├─ BowelColor (便の色)
      └─ DiaperChangeCount (オムツ交換回数)
```

---

## 12. 関連ドキュメント

- [要件定義書](infant-records-requirements.md)
- [UI設計書](infant-records-ui-spec.md)
- [API仕様書](infant-records-api-spec.md)
- [モバイルアプリ データベース設計](../mobile/database/infant-daily-records-schema.md)
