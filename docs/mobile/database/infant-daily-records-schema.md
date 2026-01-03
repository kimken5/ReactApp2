# 乳児連絡帳機能 データベース設計

## 1. 概要

0～2歳児向け連絡帳機能のデータベーステーブル設計です。
既存のプロジェクトパターン（複合主キー、JST datetime、NurseryId必須）に準拠しています。

---

## 2. テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| InfantTemperatures | 体温記録 |
| InfantMeals | 食事記録 |
| InfantSleeps | 睡眠記録 |
| InfantNapChecks | 午睡チェック記録（SIDS予防） |
| InfantToileting | 排泄記録 |
| InfantMoods | 機嫌記録 |

**注意**: 個別の連絡事項は年齢に関わらず既存の `DailyReports` テーブルで管理します。

---

## 3. テーブル定義

### 3.1 InfantTemperatures（体温記録）

**概要**: 朝（自宅）と午後（園）の体温を記録。

```sql
CREATE TABLE InfantTemperatures (
    -- 複合主キー
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MeasurementType NVARCHAR(20) NOT NULL, -- 'Morning' or 'Afternoon'

    -- 体温データ
    MeasuredAt DATETIME2 NOT NULL, -- 測定日時（JST）
    Temperature DECIMAL(3, 1) NOT NULL, -- 体温（℃）例: 36.5
    IsAbnormal BIT NOT NULL DEFAULT 0, -- 異常フラグ（37.5℃以上など）
    Notes NVARCHAR(200), -- 備考

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,

    -- 主キー
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MeasurementType)
);
```

---

### 3.2 InfantMeals（食事記録）

**概要**: 午前おやつ（園）、昼食（園）、午後おやつ（園）の記録。

```sql
CREATE TABLE InfantMeals (
    -- 複合主キー
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MealType NVARCHAR(20) NOT NULL, -- 'Breakfast'(午前おやつ), 'Lunch'(昼食), 'Snack'(午後おやつ)

    -- 食事データ
    OverallAmount NVARCHAR(20), -- 全体の摂取量: 'All', 'Most', 'Half', 'Little', 'None'

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,

    -- 主キー
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MealType)
);
```

---

### 3.3 InfantSleeps（睡眠記録）

**概要**: 午睡の開始・終了時刻と睡眠の質を記録。

```sql
CREATE TABLE InfantSleeps (
    -- 複合主キー
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    SleepSequence INT NOT NULL DEFAULT 1, -- 同日に複数回昼寝する場合を考慮

    -- 睡眠データ
    StartTime DATETIME2 NOT NULL, -- 入眠時刻（JST）
    EndTime DATETIME2, -- 起床時刻（JST、まだ寝ている場合はNULL）
    DurationMinutes AS (DATEDIFF(MINUTE, StartTime, EndTime)) PERSISTED, -- 睡眠時間（分）
    SleepQuality NVARCHAR(20), -- 'Deep', 'Normal', 'Light', 'Restless'
    Notes NVARCHAR(500), -- 備考（寝つき、起き方など）

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,

    -- 主キー
    PRIMARY KEY (NurseryId, ChildId, RecordDate, SleepSequence)
);
```

---

### 3.4 InfantNapChecks（午睡チェック）

**概要**: SIDS予防のための5～10分間隔の呼吸・体位チェック記録。

```sql
CREATE TABLE InfantNapChecks (
    -- 主キー（自動採番）
    CheckId INT IDENTITY(1,1) NOT NULL,

    -- 関連情報
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    SleepSequence INT NOT NULL DEFAULT 1, -- InfantSleepsと紐付け

    -- チェックデータ
    CheckedAt DATETIME2 NOT NULL, -- チェック時刻（JST）
    BreathingOk BIT NOT NULL, -- 呼吸確認OK
    BodyPosition NVARCHAR(20) NOT NULL, -- 'Supine'（仰向け）, 'Side'（横向き）, 'Prone'（うつ伏せ）
    HasAbnormality BIT NOT NULL DEFAULT 0, -- 異常あり
    AbnormalityNotes NVARCHAR(500), -- 異常内容
    CheckedBy INT NOT NULL, -- チェック実施保育士

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),

    -- 主キー
    PRIMARY KEY (CheckId)
);

-- インデックス
CREATE INDEX IX_InfantNapChecks_Sleep ON InfantNapChecks(NurseryId, ChildId, RecordDate, SleepSequence, CheckedAt DESC);
CREATE INDEX IX_InfantNapChecks_CheckedAt ON InfantNapChecks(CheckedAt DESC);
```

---

### 3.5 InfantToileting（排泄記録）

**概要**: おしっこ・うんちの回数と時刻、状態を記録。

```sql
CREATE TABLE InfantToileting (
    -- 主キー（自動採番）
    ToiletingId INT IDENTITY(1,1) NOT NULL,

    -- 関連情報
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,

    -- 排泄データ
    ToiletingTime DATETIME2 NOT NULL, -- 排泄時刻（JST）
    ToiletingType NVARCHAR(20) NOT NULL, -- 'Urine'（おしっこ）, 'Bowel'（うんち）

    -- うんち専用データ
    BowelCondition NVARCHAR(20), -- 'Normal', 'Soft', 'Diarrhea', 'Hard'
    BowelColor NVARCHAR(20), -- 'Normal', 'Green', 'White', 'Black', 'Bloody'

    -- おしっこ専用データ
    UrineAmount NVARCHAR(20), -- 'Little'（少量）, 'Normal'（普通）, 'Lot'（多量）
    DiaperChangeCount INT, -- おむつ交換回数

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,

    -- 主キー
    PRIMARY KEY (ToiletingId)
);

-- インデックス
CREATE INDEX IX_InfantToileting_Record ON InfantToileting(NurseryId, ChildId, RecordDate, ToiletingTime DESC);
CREATE INDEX IX_InfantToileting_Time ON InfantToileting(ToiletingTime DESC);
```

---

### 3.6 InfantMoods（機嫌記録）

**概要**: 朝（登園時）と午後（降園前）の機嫌を記録。

```sql
CREATE TABLE InfantMoods (
    -- 複合主キー
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MoodTime NVARCHAR(20) NOT NULL, -- 'Morning', 'Afternoon'

    -- 機嫌データ
    MoodState NVARCHAR(20) NOT NULL, -- 'Good', 'Normal', 'Bad', 'Crying'
    Notes NVARCHAR(500), -- 備考（保護者申し送り、様子など）

    -- 監査
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,

    -- 主キー
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MoodTime)
);
```

---

## 4. ER図（概念図）

```
Children (園児マスタ)
    │
    ├─ InfantTemperatures (朝・午後の体温)
    ├─ InfantMeals (午前おやつ・昼食・午後おやつ)
    ├─ InfantSleeps (午睡記録)
    │   └─ InfantNapChecks (午睡チェック: 5～10分間隔)
    ├─ InfantToileting (排泄記録: 都度記録)
    ├─ InfantMoods (朝・午後の機嫌)
    └─ DailyReports (個別連絡事項: 全年齢共通)
```

---

## 5. データ型とサイズの根拠

### 5.1 NVARCHAR サイズ
- `NVARCHAR(20)`: 列挙型的な値（'Morning', 'Breakfast', 'Good' など）
- `NVARCHAR(200)`: 短い備考（体温の補足など）
- `NVARCHAR(500)`: 中程度の備考（活動内容、排泄の様子など）
- `NVARCHAR(1000)`: 長い備考（保護者への連絡事項、特記事項）

### 5.2 DECIMAL(3, 1)
- 体温: 34.0～42.0℃ の範囲（小数点以下1桁）

### 5.3 DATETIME2
- プロジェクト標準（JST対応）
- デフォルト値: `[dbo].[GetJstDateTime]()`

---

## 6. インデックス戦略

### 6.1 主キーインデックス
- すべてのテーブルで主キーに自動的にクラスタ化インデックスが作成される

### 6.2 検索用インデックス
- **日付降順**: 最新の記録を高速取得（ReportDate DESC）
- **クラス別**: クラス単位での記録一覧表示（ClassId, RecordDate DESC）
- **公開状態**: 保護者への公開済み記録フィルタ（IsPublished, RecordDate DESC）
- **午睡チェック**: 昼寝中の園児のチェック履歴（ChildId, RecordDate, CheckedAt DESC）

---

## 7. セキュリティ・権限

### 7.1 Row-Level Security（将来検討）
- NurseryId 単位でのアクセス制御
- StaffId 単位での担当クラス制限
- ParentId 単位での自分の子どものみ閲覧制限

### 7.2 監査ログ
- すべてのテーブルで CreatedAt, CreatedBy, UpdatedAt, UpdatedBy を記録
- 変更履歴トラッキング（将来要件）

---

## 8. サンプルデータ挿入例

### 8.1 日次記録作成
```sql
-- 1. 朝の体温
INSERT INTO InfantTemperatures (NurseryId, ChildId, RecordDate, MeasurementType, MeasuredAt, Temperature, CreatedBy, UpdatedBy)
VALUES (1, 101, '2025-12-28', 'Morning', '2025-12-28 08:30:00', 36.5, 20, 20);

-- 2. 昼食
INSERT INTO InfantMeals (NurseryId, ChildId, RecordDate, MealType, OverallAmount, CreatedBy, UpdatedBy)
VALUES (1, 101, '2025-12-28', 'Lunch', 'Most', 20, 20);

-- 3. 午睡
INSERT INTO InfantSleeps (NurseryId, ChildId, RecordDate, SleepSequence, StartTime, EndTime, SleepQuality, CreatedBy, UpdatedBy)
VALUES (1, 101, '2025-12-28', 1, '2025-12-28 13:00:00', '2025-12-28 15:00:00', 'Deep', 20, 20);

-- 4. 午睡チェック（5分間隔で記録）
INSERT INTO InfantNapChecks (NurseryId, ChildId, RecordDate, SleepSequence, CheckedAt, BreathingOk, BodyPosition, CheckedBy)
VALUES
    (1, 101, '2025-12-28', 1, '2025-12-28 13:05:00', 1, 'Supine', 20),
    (1, 101, '2025-12-28', 1, '2025-12-28 13:10:00', 1, 'Side', 20),
    (1, 101, '2025-12-28', 1, '2025-12-28 13:15:00', 1, 'Supine', 20);

-- 5. 排泄
INSERT INTO InfantToileting (NurseryId, ChildId, RecordDate, ToiletingTime, ToiletingType, CreatedBy, UpdatedBy)
VALUES
    (1, 101, '2025-12-28', '2025-12-28 10:00:00', 'Urine', 20, 20),
    (1, 101, '2025-12-28', '2025-12-28 14:30:00', 'Bowel', 20, 20);

-- うんちの詳細を更新
UPDATE InfantToileting
SET BowelCondition = 'Normal', BowelColor = 'Normal'
WHERE ToiletingId = 2;

-- 6. 機嫌
INSERT INTO InfantMoods (NurseryId, ChildId, RecordDate, MoodTime, MoodState, Notes, CreatedBy, UpdatedBy)
VALUES
    (1, 101, '2025-12-28', 'Morning', 'Good', '元気に登園しました', 20, 20),
    (1, 101, '2025-12-28', 'Afternoon', 'Normal', '降園時は少し眠そうでした', 20, 20);

-- 7. 個別連絡（DailyReportsテーブル使用）
INSERT INTO DailyReports (NurseryId, ChildId, ReportDate, ReportKind, Title, Content, StaffNurseryId, StaffId, Status)
VALUES (1, 101, '2025-12-28', 'activity', '今日の様子', '今日はお絵描きに集中して取り組んでいました。', 1, 20, 'published');
```

---

## 9. パフォーマンス考慮事項

### 9.1 想定データ量
- 1園あたり園児数: 30～100名
- 0～2歳児: 10～30名程度
- 年間レコード数: 30名 × 250日 = 7,500レコード/年（InfantDailyRecords）
- 5年間で約37,500レコード

### 9.2 クエリ最適化
- 日付範囲検索が頻繁に発生するため、RecordDate にインデックス必須
- クラス単位での一覧表示が多いため、ClassId の複合インデックス有効

### 9.3 パーティショニング（将来検討）
- データ量が増加した場合、RecordDate でパーティション分割検討

---

## 10. マイグレーション手順

### 10.1 手動実行手順
1. Azure SQL Database にログイン
2. 上記 DDL を順番に実行（InfantDailyRecords → 子テーブル）
3. インデックス作成
4. サンプルデータで動作確認

### 10.2 ロールバック手順
```sql
-- 逆順で削除
DROP TABLE IF EXISTS InfantMoods;
DROP TABLE IF EXISTS InfantToileting;
DROP TABLE IF EXISTS InfantNapChecks;
DROP TABLE IF EXISTS InfantSleeps;
DROP TABLE IF EXISTS InfantMeals;
DROP TABLE IF EXISTS InfantTemperatures;
```

---

## 11. 既存システムとの整合性

### 11.1 既存テーブルとの関連
- **Children**: NurseryId, ChildId で連携
- **Classes**: NurseryId, ClassId で連携
- **Staff**: NurseryId, StaffId で連携（作成者、更新者、チェック実施者）
- **DailyReports**: 個別の連絡事項は年齢に関わらず既存の DailyReports テーブルを使用

### 11.2 命名規則
- プロジェクト標準に準拠: Pascal Case（InfantDailyRecords）
- 列名: Pascal Case（RecordDate, CreatedAt）
- インデックス名: `IX_テーブル名_列名`
- チェック制約名: `CHK_テーブル名_列名`

---

## 12. 補足事項

### 12.1 日本語列挙値の扱い
- データベースには英語で保存（'Morning', 'Good', 'Normal' など）
- フロントエンドで日本語変換（i18n対応）
- **理由**: データの可搬性、国際化対応の容易さ

### 12.2 NULL 許容設計
- 必須項目: NOT NULL
- 任意項目: NULL 許容（備考、詳細情報など）
- うんちの詳細（BowelCondition, BowelColor）: おしっこの場合は NULL

### 12.3 計算列
- InfantSleeps.DurationMinutes: 睡眠時間を自動計算（PERSISTED）
- **利点**: データ整合性、クエリ簡素化

---

## 13. 今後の拡張検討

### 13.1 写真添付機能
- 既存の Photos テーブルを活用（PhotoChildren で園児と紐付け）

### 13.2 保護者フィードバック
- 既存の DailyReportResponses テーブルを活用

### 13.3 アラート機能
- InfantAlerts テーブル新設
- 体温異常、下痢連続、午睡チェック漏れなどを記録

---

## 完成DDL（実行用）

以下は、Azure SQL Databaseに実行可能な完全なDDLです。

```sql
-- ================================================
-- 乳児連絡帳機能 テーブル作成 DDL
-- ================================================

-- 1. InfantTemperatures（体温記録）
CREATE TABLE InfantTemperatures (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MeasurementType NVARCHAR(20) NOT NULL,
    MeasuredAt DATETIME2 NOT NULL,
    Temperature DECIMAL(3, 1) NOT NULL,
    IsAbnormal BIT NOT NULL DEFAULT 0,
    Notes NVARCHAR(200),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MeasurementType)
);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児体温記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'測定タイプ（Morning/Afternoon）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasurementType';
EXECUTE sp_addextendedproperty N'MS_Description', N'測定日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasuredAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'体温（℃）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'Temperature';
EXECUTE sp_addextendedproperty N'MS_Description', N'異常フラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'IsAbnormal';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedBy';
GO

-- 2. InfantMeals（食事記録）
CREATE TABLE InfantMeals (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MealType NVARCHAR(20) NOT NULL,
    OverallAmount NVARCHAR(20),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MealType)
);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児食事記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'食事タイプ（Breakfast:午前おやつ/Lunch:昼食/Snack:午後おやつ）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'MealType';
EXECUTE sp_addextendedproperty N'MS_Description', N'全体の摂取量（All/Most/Half/Little/None）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'OverallAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'UpdatedBy';
GO

-- 3. InfantSleeps（睡眠記録）
CREATE TABLE InfantSleeps (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    SleepSequence INT NOT NULL DEFAULT 1,
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2,
    DurationMinutes AS (DATEDIFF(MINUTE, StartTime, EndTime)) PERSISTED,
    SleepQuality NVARCHAR(20),
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate, SleepSequence)
);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児睡眠記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠シーケンス（同日複数回対応）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'SleepSequence';
EXECUTE sp_addextendedproperty N'MS_Description', N'入眠時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'StartTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'起床時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'EndTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠時間（分）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'DurationMinutes';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠の質（Deep/Normal/Light/Restless）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'SleepQuality';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'UpdatedBy';
GO

-- 4. InfantNapChecks（午睡チェック）
CREATE TABLE InfantNapChecks (
    CheckId INT IDENTITY(1,1) NOT NULL,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    SleepSequence INT NOT NULL DEFAULT 1,
    CheckedAt DATETIME2 NOT NULL,
    BreathingOk BIT NOT NULL,
    BodyPosition NVARCHAR(20) NOT NULL,
    HasAbnormality BIT NOT NULL DEFAULT 0,
    AbnormalityNotes NVARCHAR(500),
    CheckedBy INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    PRIMARY KEY (CheckId)
);
GO

CREATE INDEX IX_InfantNapChecks_Sleep ON InfantNapChecks(NurseryId, ChildId, RecordDate, SleepSequence, CheckedAt DESC);
CREATE INDEX IX_InfantNapChecks_CheckedAt ON InfantNapChecks(CheckedAt DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児午睡チェック記録（SIDS予防）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'チェックID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckId';
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠シーケンス', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'SleepSequence';
EXECUTE sp_addextendedproperty N'MS_Description', N'チェック日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'呼吸確認OK', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'BreathingOk';
EXECUTE sp_addextendedproperty N'MS_Description', N'体位（Supine/Side/Prone）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'BodyPosition';
EXECUTE sp_addextendedproperty N'MS_Description', N'異常フラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'HasAbnormality';
EXECUTE sp_addextendedproperty N'MS_Description', N'異常内容', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'AbnormalityNotes';
EXECUTE sp_addextendedproperty N'MS_Description', N'チェック実施保育士ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CreatedAt';
GO

-- 5. InfantToileting（排泄記録）
CREATE TABLE InfantToileting (
    ToiletingId INT IDENTITY(1,1) NOT NULL,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    ToiletingTime DATETIME2 NOT NULL,
    ToiletingType NVARCHAR(20) NOT NULL,
    BowelCondition NVARCHAR(20),
    BowelColor NVARCHAR(20),
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (ToiletingId)
);
GO

CREATE INDEX IX_InfantToileting_Record ON InfantToileting(NurseryId, ChildId, RecordDate, ToiletingTime DESC);
CREATE INDEX IX_InfantToileting_Time ON InfantToileting(ToiletingTime DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児排泄記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingId';
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄タイプ（Urine/Bowel）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingType';
EXECUTE sp_addextendedproperty N'MS_Description', N'便の状態（Normal/Soft/Diarrhea/Hard）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelCondition';
EXECUTE sp_addextendedproperty N'MS_Description', N'便の色（Normal/Green/White/Black/Bloody）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelColor';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedBy';
GO

-- 6. InfantMoods（機嫌記録）
CREATE TABLE InfantMoods (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MoodTime NVARCHAR(20) NOT NULL,
    MoodState NVARCHAR(20) NOT NULL,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MoodTime)
);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児機嫌記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'機嫌確認時間帯（Morning/Afternoon）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'MoodTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'機嫌状態（Good/Normal/Bad/Crying）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'MoodState';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'UpdatedBy';
GO
```

以上で完成です。
