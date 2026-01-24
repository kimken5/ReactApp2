# 乳児生活記録システム データベース移行計画書

## ドキュメント情報
- **作成日**: 2026-01-17
- **バージョン**: 1.0
- **関連ドキュメント**: [要件定義書 v2.0](./infant-records-requirements-v2.md)

---

## 目次
1. [移行概要](#1-移行概要)
2. [現状分析](#2-現状分析)
3. [新スキーマ設計](#3-新スキーマ設計)
4. [移行戦略](#4-移行戦略)
5. [移行手順](#5-移行手順)
6. [ロールバック計画](#6-ロールバック計画)
7. [検証計画](#7-検証計画)

---

## 1. 移行概要

### 1.1 移行の目的
- 現行の`InfantRecords`テーブルから、記録カテゴリ別の7つの専用テーブルへ移行
- 複数園児一括登録方式から個別園児の時系列記録方式へ変更
- SIDS対策準拠の午睡チェック機能を追加
- ミルク・排泄記録の詳細化

### 1.2 移行対象
- **既存テーブル**: `InfantRecords`（現行の生活記録テーブル）
- **新規テーブル**: 7テーブル（MilkRecords, MealRecords, NapRecords, NapChecks, ExcretionRecords, TemperatureRecords, MoodRecords）

### 1.3 移行方式
- **Zero Downtime Migration**: 新旧テーブルを並行稼働させながら段階的に移行
- **データ保全**: 既存データは削除せず、新テーブルへコピー
- **後方互換性**: 旧APIは移行期間中も動作可能に保つ

---

## 2. 現状分析

### 2.1 現行テーブル構造（InfantRecords）

```sql
CREATE TABLE InfantRecords (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    RecordDate DATE NOT NULL,
    ChildIds NVARCHAR(MAX), -- カンマ区切りの園児ID（例: "1,2,3"）

    -- 食事関連
    BreakfastStatus NVARCHAR(20),
    LunchStatus NVARCHAR(20),
    SnackStatus NVARCHAR(20),

    -- 午睡関連
    NapStartTime TIME,
    NapEndTime TIME,
    NapNotes NVARCHAR(500),

    -- 排泄関連
    ExcretionTimes NVARCHAR(MAX), -- カンマ区切りの時刻（例: "10:00,14:00"）
    ExcretionTypes NVARCHAR(MAX), -- カンマ区切りのタイプ（例: "urine,stool"）

    -- 体温関連
    BodyTemperature DECIMAL(3,1),
    TemperatureTime TIME,

    RecordedByStaffId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2
);
```

### 2.2 現行スキーマの課題

| 課題 | 説明 | 影響 |
|------|------|------|
| 非正規化データ | ChildIds, ExcretionTimesなどがカンマ区切り文字列 | クエリが複雑、インデックス効果なし |
| 柔軟性の欠如 | 固定カラム構造で年齢別の記録に対応できない | 0歳児のミルクmL記録不可 |
| 詳細度不足 | 午睡チェック項目なし、排泄の詳細なし | SIDS対策不十分 |
| 一括登録の制約 | 複数園児を同時に記録する前提 | 個別の詳細記録ができない |

### 2.3 既存データ量の推定
```sql
-- 既存データ件数確認クエリ
SELECT
    COUNT(*) AS TotalRecords,
    MIN(RecordDate) AS OldestRecord,
    MAX(RecordDate) AS LatestRecord,
    COUNT(DISTINCT RecordedByStaffId) AS StaffCount
FROM InfantRecords;
```

**想定データ量**: 約5,000～10,000件/年（保育園1園あたり）

---

## 3. 新スキーマ設計

### 3.1 テーブル一覧

| テーブル名 | 用途 | 主キー | 外部キー |
|-----------|------|--------|---------|
| MilkRecords | ミルク記録 | Id | NurseryId, ChildId, RecordedByStaffId |
| MealRecords | 食事記録 | Id | NurseryId, ChildId, RecordedByStaffId |
| NapRecords | 午睡時間記録 | Id | NurseryId, ChildId, RecordedByStaffId |
| NapChecks | 午睡チェック | Id | NapRecordId, RecordedByStaffId |
| ExcretionRecords | 排泄記録 | Id | NurseryId, ChildId, RecordedByStaffId |
| TemperatureRecords | 体温記録 | Id | NurseryId, ChildId, RecordedByStaffId |
| MoodRecords | 機嫌・様子記録 | Id | NurseryId, ChildId, RecordedByStaffId |

### 3.2 インデックス戦略

#### 3.2.1 検索パフォーマンス最適化
```sql
-- 園児・日付別の検索が最も頻繁
CREATE INDEX IX_MilkRecords_Child_Date
    ON MilkRecords(NurseryId, ChildId, RecordDate DESC);

CREATE INDEX IX_MealRecords_Child_Date
    ON MealRecords(NurseryId, ChildId, RecordDate DESC);

CREATE INDEX IX_NapRecords_Child_Date
    ON NapRecords(NurseryId, ChildId, RecordDate DESC);

CREATE INDEX IX_ExcretionRecords_Child_Date
    ON ExcretionRecords(NurseryId, ChildId, RecordDate DESC);

CREATE INDEX IX_TemperatureRecords_Child_Date
    ON TemperatureRecords(NurseryId, ChildId, RecordDate DESC);

CREATE INDEX IX_MoodRecords_Child_Date
    ON MoodRecords(NurseryId, ChildId, RecordDate DESC);
```

#### 3.2.2 午睡チェック専用インデックス
```sql
-- 午睡記録IDとチェック時刻での検索
CREATE INDEX IX_NapChecks_NapRecordId
    ON NapChecks(NapRecordId, CheckTime);

-- 異常検出用（呼吸異常、うつ伏せ検索）
CREATE INDEX IX_NapChecks_Alerts
    ON NapChecks(NapRecordId)
    WHERE BreathingStatus = '異常' OR BodyPosition = 'うつ伏せ';
```

### 3.3 外部キー制約

```sql
-- NapChecksテーブルはNapRecords削除時にカスケード削除
ALTER TABLE NapChecks
    ADD CONSTRAINT FK_NapChecks_NapRecords
    FOREIGN KEY (NapRecordId) REFERENCES NapRecords(Id) ON DELETE CASCADE;

-- その他のテーブルは削除禁止（データ保全）
ALTER TABLE MilkRecords
    ADD CONSTRAINT FK_MilkRecords_Children
    FOREIGN KEY (NurseryId, ChildId) REFERENCES Children(NurseryId, ChildId) ON DELETE NO ACTION;
```

---

## 4. 移行戦略

### 4.1 段階的移行アプローチ

#### Phase 1: 準備フェーズ（1週間）
1. 新テーブル作成（本番環境）
2. インデックス作成
3. 外部キー制約設定
4. テストデータ投入（検証環境）

#### Phase 2: 並行稼働フェーズ（2週間）
1. 新API実装（v2エンドポイント）
2. 旧API維持（v1エンドポイント）
3. フロントエンド段階的移行
4. データ二重書き込み（旧→新）

#### Phase 3: 完全移行フェーズ（1週間）
1. 旧API廃止
2. 旧テーブル読み取り専用化
3. データ検証
4. パフォーマンス監視

#### Phase 4: 安定化フェーズ（2週間）
1. 運用監視
2. バグ修正
3. 旧テーブルアーカイブ

### 4.2 データ移行マッピング

#### 4.2.1 InfantRecords → MealRecords
```sql
-- 朝食記録の移行
INSERT INTO MealRecords (NurseryId, ChildId, RecordDate, RecordTime, MealType, Amount, RecordedByStaffId, CreatedAt)
SELECT
    ir.NurseryId,
    c.ChildId, -- ChildIdsから分解
    ir.RecordDate,
    '09:00:00' AS RecordTime, -- デフォルト時刻
    '午前おやつ' AS MealType,
    ir.BreakfastStatus AS Amount,
    ir.RecordedByStaffId,
    ir.CreatedAt
FROM InfantRecords ir
CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
WHERE ir.BreakfastStatus IS NOT NULL;

-- 昼食記録の移行
INSERT INTO MealRecords (NurseryId, ChildId, RecordDate, RecordTime, MealType, Amount, RecordedByStaffId, CreatedAt)
SELECT
    ir.NurseryId,
    c.ChildId,
    ir.RecordDate,
    '12:00:00' AS RecordTime,
    '昼食' AS MealType,
    ir.LunchStatus AS Amount,
    ir.RecordedByStaffId,
    ir.CreatedAt
FROM InfantRecords ir
CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
WHERE ir.LunchStatus IS NOT NULL;

-- おやつ記録の移行
INSERT INTO MealRecords (NurseryId, ChildId, RecordDate, RecordTime, MealType, Amount, RecordedByStaffId, CreatedAt)
SELECT
    ir.NurseryId,
    c.ChildId,
    ir.RecordDate,
    '15:00:00' AS RecordTime,
    '午後おやつ' AS MealType,
    ir.SnackStatus AS Amount,
    ir.RecordedByStaffId,
    ir.CreatedAt
FROM InfantRecords ir
CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
WHERE ir.SnackStatus IS NOT NULL;
```

#### 4.2.2 InfantRecords → NapRecords
```sql
INSERT INTO NapRecords (NurseryId, ChildId, RecordDate, StartTime, EndTime, Memo, RecordedByStaffId, CreatedAt)
SELECT
    ir.NurseryId,
    c.ChildId,
    ir.RecordDate,
    ir.NapStartTime,
    ir.NapEndTime,
    ir.NapNotes AS Memo,
    ir.RecordedByStaffId,
    ir.CreatedAt
FROM InfantRecords ir
CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
WHERE ir.NapStartTime IS NOT NULL;
```

#### 4.2.3 InfantRecords → TemperatureRecords
```sql
INSERT INTO TemperatureRecords (NurseryId, ChildId, RecordDate, RecordTime, TemperatureCelsius, RecordedByStaffId, CreatedAt)
SELECT
    ir.NurseryId,
    c.ChildId,
    ir.RecordDate,
    ISNULL(ir.TemperatureTime, '09:00:00') AS RecordTime,
    ir.BodyTemperature AS TemperatureCelsius,
    ir.RecordedByStaffId,
    ir.CreatedAt
FROM InfantRecords ir
CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
WHERE ir.BodyTemperature IS NOT NULL;
```

#### 4.2.4 排泄記録の移行（複雑）
```sql
-- ExcretionTimesとExcretionTypesをパースして移行
-- 注意: カンマ区切りデータの分解が必要
-- 例: ExcretionTimes='10:00,14:00', ExcretionTypes='urine,stool'

-- 一時テーブルでパース処理
WITH ExcretionParsed AS (
    SELECT
        ir.NurseryId,
        c.ChildId,
        ir.RecordDate,
        t.value AS ExcretionTime,
        ty.value AS ExcretionType,
        ROW_NUMBER() OVER (PARTITION BY ir.Id, c.ChildId ORDER BY t.value) AS RowNum,
        ir.RecordedByStaffId,
        ir.CreatedAt
    FROM InfantRecords ir
    CROSS APPLY STRING_SPLIT(ir.ChildIds, ',') AS c
    CROSS APPLY STRING_SPLIT(ir.ExcretionTimes, ',') AS t
    CROSS APPLY STRING_SPLIT(ir.ExcretionTypes, ',') AS ty
    WHERE ir.ExcretionTimes IS NOT NULL
)
INSERT INTO ExcretionRecords (NurseryId, ChildId, RecordDate, RecordTime, HasUrine, HasStool, RecordedByStaffId, CreatedAt)
SELECT
    NurseryId,
    ChildId,
    RecordDate,
    ExcretionTime AS RecordTime,
    CASE WHEN ExcretionType = 'urine' THEN 1 ELSE 0 END AS HasUrine,
    CASE WHEN ExcretionType = 'stool' THEN 1 ELSE 0 END AS HasStool,
    RecordedByStaffId,
    CreatedAt
FROM ExcretionParsed;
```

---

## 5. 移行手順

### 5.1 移行前チェックリスト

- [ ] 本番データベースのバックアップ完了
- [ ] 検証環境での移行スクリプトテスト完了
- [ ] 新テーブルのインデックス作成完了
- [ ] 外部キー制約設定完了
- [ ] ロールバックスクリプト準備完了
- [ ] 関係者への事前通知完了
- [ ] メンテナンスウィンドウ確保（深夜2時～5時）

### 5.2 移行実行手順

#### ステップ1: データベーススキーマ変更（30分）
```sql
-- 1. 新テーブル作成
-- (各テーブルのCREATE TABLE文を実行)

-- 2. インデックス作成
-- (各インデックスのCREATE INDEX文を実行)

-- 3. 外部キー制約追加
-- (各外部キーのALTER TABLE文を実行)

-- 4. デフォルト値・CHECK制約追加
-- (各制約のALTER TABLE文を実行)
```

#### ステップ2: データ移行実行（1～2時間）
```sql
-- トランザクション開始
BEGIN TRANSACTION;

    -- 食事記録移行
    EXEC sp_migrate_meal_records;

    -- 午睡記録移行
    EXEC sp_migrate_nap_records;

    -- 体温記録移行
    EXEC sp_migrate_temperature_records;

    -- 排泄記録移行
    EXEC sp_migrate_excretion_records;

    -- 移行結果検証
    EXEC sp_validate_migration;

-- コミット（検証OKの場合）
COMMIT TRANSACTION;
-- ロールバック（検証NGの場合）
-- ROLLBACK TRANSACTION;
```

#### ステップ3: 検証（30分）
```sql
-- 移行データ件数確認
SELECT 'MealRecords' AS TableName, COUNT(*) AS RecordCount FROM MealRecords
UNION ALL
SELECT 'NapRecords', COUNT(*) FROM NapRecords
UNION ALL
SELECT 'TemperatureRecords', COUNT(*) FROM TemperatureRecords
UNION ALL
SELECT 'ExcretionRecords', COUNT(*) FROM ExcretionRecords;

-- 元データとの整合性確認
SELECT
    (SELECT COUNT(DISTINCT Id) FROM InfantRecords WHERE BreakfastStatus IS NOT NULL) AS OriginalBreakfast,
    (SELECT COUNT(*) FROM MealRecords WHERE MealType = '午前おやつ') AS MigratedBreakfast;
```

#### ステップ4: アプリケーション切り替え（10分）
```bash
# フロントエンドビルド
cd reactapp.client
npm run build

# バックエンド再起動
cd ../ReactApp.Server
dotnet publish -c Release
# IISまたはサービス再起動
```

#### ステップ5: 動作確認（30分）
1. ログイン確認
2. 園児選択確認
3. 各記録カテゴリの新規登録確認
4. タイムライン表示確認
5. 編集・削除確認
6. エラーログ確認

### 5.3 移行後の監視項目

| 項目 | 監視方法 | 閾値 |
|------|---------|------|
| API応答時間 | Application Insights | <1秒 |
| データベースCPU | Azure Monitor | <70% |
| エラー率 | エラーログ | <0.1% |
| ディスク使用量 | Azure Monitor | <80% |

---

## 6. ロールバック計画

### 6.1 ロールバック判断基準
以下のいずれかが発生した場合、ロールバックを実施：
- 移行データの整合性エラーが5%以上
- API応答時間が3秒以上
- エラー率が5%以上
- データ損失の発生

### 6.2 ロールバック手順

#### ステップ1: アプリケーション切り戻し（5分）
```bash
# 旧バージョンのフロントエンドをデプロイ
# 旧バージョンのバックエンドを再起動
```

#### ステップ2: 新テーブルの無効化（5分）
```sql
-- 新テーブルへの書き込みを停止（アプリケーション側で制御）
-- 外部キー制約を一時的に無効化
ALTER TABLE NapChecks NOCHECK CONSTRAINT FK_NapChecks_NapRecords;
```

#### ステップ3: 旧テーブルの復元（30分）
```sql
-- バックアップから復元
RESTORE DATABASE [KindergartenDB]
FROM DISK = 'C:\Backups\KindergartenDB_pre_migration.bak'
WITH REPLACE;
```

### 6.3 ロールバック後の対応
1. 移行失敗の原因分析
2. 修正版の移行スクリプト作成
3. 検証環境で再テスト
4. 再移行の実施日程調整

---

## 7. 検証計画

### 7.1 移行前検証（検証環境）

#### 7.1.1 データ整合性検証
```sql
-- 食事記録の整合性
SELECT
    COUNT(DISTINCT Id) AS OriginalCount,
    (SELECT COUNT(*) FROM MealRecords) / 3 AS MigratedCount -- 朝食、昼食、おやつで3倍
FROM InfantRecords
WHERE BreakfastStatus IS NOT NULL OR LunchStatus IS NOT NULL OR SnackStatus IS NOT NULL;

-- 午睡記録の整合性
SELECT
    COUNT(DISTINCT Id) AS OriginalCount,
    (SELECT COUNT(*) FROM NapRecords) AS MigratedCount
FROM InfantRecords
WHERE NapStartTime IS NOT NULL;
```

#### 7.1.2 パフォーマンス検証
```sql
-- 旧テーブル: 園児の1日の記録取得
SET STATISTICS TIME ON;
SELECT * FROM InfantRecords WHERE ChildIds LIKE '%123%' AND RecordDate = '2026-01-17';
SET STATISTICS TIME OFF;

-- 新テーブル: 園児の1日の記録取得
SET STATISTICS TIME ON;
SELECT * FROM MilkRecords WHERE ChildId = 123 AND RecordDate = '2026-01-17';
SELECT * FROM MealRecords WHERE ChildId = 123 AND RecordDate = '2026-01-17';
SELECT * FROM NapRecords WHERE ChildId = 123 AND RecordDate = '2026-01-17';
SELECT * FROM ExcretionRecords WHERE ChildId = 123 AND RecordDate = '2026-01-17';
SELECT * FROM TemperatureRecords WHERE ChildId = 123 AND RecordDate = '2026-01-17';
SET STATISTICS TIME OFF;
```

#### 7.1.3 機能検証
- [ ] ミルク記録の新規登録・編集・削除
- [ ] 食事記録の新規登録・編集・削除
- [ ] 午睡記録の新規登録・終了記録
- [ ] 午睡チェックの記録・履歴表示
- [ ] 排泄記録の新規登録（おしっこのみ、うんちのみ、両方）
- [ ] 体温記録の新規登録・編集・削除
- [ ] タイムライン表示（時系列ソート、カテゴリ別色分け）

### 7.2 移行後検証（本番環境）

#### 7.2.1 データ件数検証
```sql
-- 各テーブルの件数確認
SELECT
    'MilkRecords' AS TableName,
    COUNT(*) AS RecordCount,
    MIN(CreatedAt) AS OldestRecord,
    MAX(CreatedAt) AS LatestRecord
FROM MilkRecords
UNION ALL
SELECT 'MealRecords', COUNT(*), MIN(CreatedAt), MAX(CreatedAt) FROM MealRecords
UNION ALL
SELECT 'NapRecords', COUNT(*), MIN(CreatedAt), MAX(CreatedAt) FROM NapRecords
UNION ALL
SELECT 'ExcretionRecords', COUNT(*), MIN(CreatedAt), MAX(CreatedAt) FROM ExcretionRecords
UNION ALL
SELECT 'TemperatureRecords', COUNT(*), MIN(CreatedAt), MAX(CreatedAt) FROM TemperatureRecords;
```

#### 7.2.2 ユーザー受入テスト（UAT）
- [ ] 保育士による実際の記録操作テスト
- [ ] 記録の正確性確認
- [ ] UI/UXの使いやすさ確認
- [ ] タブレット操作の快適性確認

### 7.3 性能検証

#### 7.3.1 負荷テスト
```bash
# Apache Benchでの負荷テスト
ab -n 1000 -c 10 https://localhost:7154/api/infant-records/milk

# 期待値: 平均応答時間 < 500ms
```

#### 7.3.2 ストレステスト
```bash
# 同時100ユーザーでの記録登録
# 期待値: エラー率 < 1%
```

---

## 8. まとめ

### 8.1 移行スケジュール

| フェーズ | 期間 | 主要タスク |
|---------|------|----------|
| Phase 1: 準備 | 1週間 | 新テーブル作成、インデックス設定 |
| Phase 2: 並行稼働 | 2週間 | 新API実装、フロントエンド移行 |
| Phase 3: 完全移行 | 1週間 | 旧API廃止、データ検証 |
| Phase 4: 安定化 | 2週間 | 運用監視、バグ修正 |

**合計期間**: 6週間

### 8.2 リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| データ損失 | 高 | 事前バックアップ、トランザクション管理 |
| 性能劣化 | 中 | インデックス最適化、キャッシング |
| ダウンタイム | 中 | 深夜メンテナンス、ロールバック準備 |
| 操作性低下 | 低 | UAT実施、保育士トレーニング |

### 8.3 成功基準
- ✅ データ損失ゼロ
- ✅ API応答時間 < 1秒
- ✅ エラー率 < 0.1%
- ✅ 保育士からの肯定的フィードバック > 80%

---

**END OF DOCUMENT**
