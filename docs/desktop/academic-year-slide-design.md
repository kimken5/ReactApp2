# 年度スライド設計書

## 概要

本設計書は、保育園管理システムにおける年度スライド（年度切り替え）機能の詳細設計を記載します。

## ユーザー要件

### 年度スライドの運用フロー

1. **3月（年度末）**: 新年度のクラス構成を事前に設定
   - 翌年度のクラスに所属する園児を設定
   - 翌年度のクラスの担任スタッフを設定

2. **4月（年度初）**: 年度変更を画面で実行
   - 年度スライド処理により、事前設定した構成が現年度として反映
   - スマホアプリにも新しいクラス構成・担任が表示される

3. **過去年度の参照**: 過去のクラス構成を確認可能
   - 過去年度のクラスに所属していた園児
   - 過去年度のクラスの担任スタッフ

## 現在の設計との比較

### 現在の設計の問題点

| 要素 | 現在の設計 | 問題点 |
|------|-----------|--------|
| **園児のクラス所属** | Children.ClassId (現年度のみ) | 過去・未来のクラス構成を保持できない |
| **進級履歴** | PromotionHistory (履歴のみ記録) | 未来のクラス構成を事前設定できない |
| **担任割り当て** | StaffClassAssignments.AcademicYear | 現年度と過去の年度は管理可能だが、未来年度の事前設定が不明確 |

### 必要なテーブル

| テーブル名 | 目的 | 主キー |
|-----------|------|--------|
| **ChildClassAssignments** | 園児のクラス所属履歴（過去・現在・未来） | (AcademicYear, NurseryId, ChildId) |
| **StaffClassAssignments** | 担任割り当て履歴（過去・現在・未来） | (AcademicYear, NurseryId, StaffId, ClassId) ※既存テーブルを拡張 |

## 新テーブル設計

### ChildClassAssignments（園児クラス所属履歴）

**目的**: 園児のクラス所属を年度別に管理（過去・現在・未来）

```sql
CREATE TABLE [dbo].[ChildClassAssignments] (
    [AcademicYear] INT NOT NULL,  -- 年度（西暦）(複合主キー 1/3)
    [NurseryId] INT NOT NULL,  -- 保育園ID (複合主キー 2/3)
    [ChildId] INT NOT NULL,  -- 園児ID (複合主キー 3/3)
    [ClassId] NVARCHAR(50) NOT NULL,  -- 所属クラスID
    [IsCurrent] BIT NOT NULL DEFAULT 0,  -- 現在年度フラグ
    [IsFuture] BIT NOT NULL DEFAULT 0,  -- 未来年度フラグ（事前設定）
    [AssignedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 割り当て日時
    [AssignedByUserId] INT NULL,  -- 割り当て実行者
    [Notes] NVARCHAR(200) NULL,  -- 備考
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT PK_ChildClassAssignments PRIMARY KEY ([AcademicYear], [NurseryId], [ChildId])
);

-- インデックス作成
CREATE INDEX IX_ChildClassAssignments_Class_Year ON ChildClassAssignments (NurseryId, ClassId, AcademicYear);
CREATE INDEX IX_ChildClassAssignments_Year_Current ON ChildClassAssignments (NurseryId, AcademicYear, IsCurrent) WHERE IsCurrent = 1;
CREATE INDEX IX_ChildClassAssignments_Year_Future ON ChildClassAssignments (NurseryId, AcademicYear, IsFuture) WHERE IsFuture = 1;

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '園児クラス所属履歴テーブル', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '年度(西暦)(複合主キー 1/3)', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'AcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID(複合主キー 2/3)', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID(複合主キー 3/3)', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '所属クラスID', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', '現在年度フラグ', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'IsCurrent';
EXEC sp_addextendedproperty 'MS_Description', '未来年度フラグ（事前設定）', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'IsFuture';
EXEC sp_addextendedproperty 'MS_Description', '割り当て日時', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'AssignedAt';
EXEC sp_addextendedproperty 'MS_Description', '割り当て実行者ID', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'AssignedByUserId';
EXEC sp_addextendedproperty 'MS_Description', '備考', 'SCHEMA', 'dbo', 'TABLE', 'ChildClassAssignments', 'COLUMN', 'Notes';
```

**ビジネスルール**:
- 園児1人につき、1年度1クラスのみ所属可能（複合主キー (AcademicYear, NurseryId, ChildId) で保証）
- IsCurrent=1 のレコードは、現在年度のクラス所属を示す
- IsFuture=1 のレコードは、未来年度の事前設定を示す
- 年度スライド時に、IsFuture=1 → IsCurrent=1 に変更される

### StaffClassAssignments の拡張

**実装済み**: 既存のStaffClassAssignmentsテーブルにIsCurrent、IsFutureカラムが追加され、複合主キーがAcademicYearを含むよう変更されました。

**テーブル定義** (実装済み):
```sql
CREATE TABLE [dbo].[StaffClassAssignments] (
    [AcademicYear] INT NOT NULL,  -- 年度（西暦）(複合主キー 1/4)
    [NurseryId] INT NOT NULL,  -- 保育園ID (複合主キー 2/4)
    [StaffId] INT NOT NULL,  -- スタッフID (複合主キー 3/4)
    [ClassId] NVARCHAR(50) NOT NULL,  -- クラスID (複合主キー 4/4)
    [AssignmentRole] NVARCHAR(50) NULL,  -- 役割（主担任、副担任等）
    [IsCurrent] BIT NOT NULL DEFAULT 0,  -- 現在年度フラグ
    [IsFuture] BIT NOT NULL DEFAULT 0,  -- 未来年度フラグ（事前設定）
    [IsActive] BIT NOT NULL DEFAULT 1,  -- 有効フラグ
    [AssignedByUserId] INT NULL,  -- 割り当て実行者
    [Notes] NVARCHAR(200) NULL,  -- 備考
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT PK_StaffClassAssignments PRIMARY KEY ([AcademicYear], [NurseryId], [StaffId], [ClassId])
);

-- インデックス
CREATE INDEX IX_StaffClassAssignments_Year_Current ON StaffClassAssignments (NurseryId, AcademicYear, IsCurrent) WHERE IsCurrent = 1;
CREATE INDEX IX_StaffClassAssignments_Year_Future ON StaffClassAssignments (NurseryId, AcademicYear, IsFuture) WHERE IsFuture = 1;
```

**ビジネスルール**:
- 複合主キー (AcademicYear, NurseryId, StaffId, ClassId) で、1人のスタッフが同じ年度・クラスに複数の役割で重複割り当てされることを防止
- IsCurrent=1 のレコードは、現在年度の担任割り当てを示す
- IsFuture=1 のレコードは、未来年度の事前設定を示す
- 年度スライド時に、IsFuture=1 → IsCurrent=1 に変更される
- IsActive は引き続き有効/無効の制御に使用

## 年度スライド処理フロー

### 1. 事前準備（3月）

#### 1.1 翌年度のクラス構成設定

**画面**: 年度管理 > 翌年度クラス構成設定

**処理内容**:
```sql
-- 翌年度の園児クラス所属を登録
INSERT INTO ChildClassAssignments (AcademicYear, NurseryId, ChildId, ClassId, IsCurrent, IsFuture, AssignedByUserId)
VALUES (@NextYear, @NurseryId, @ChildId, @ClassId, 0, 1, @UserId);
```

**UI操作**:
1. 翌年度 (例: 2026年度) を選択
2. クラスごとに所属する園児を選択・登録
3. 一括登録、個別編集が可能

#### 1.2 翌年度の担任設定

**画面**: 年度管理 > 翌年度担任設定

**処理内容**:
```sql
-- 翌年度のスタッフクラス割り当てを登録
INSERT INTO StaffClassAssignments (AcademicYear, NurseryId, StaffId, ClassId, AssignmentRole, IsCurrent, IsFuture, IsActive)
VALUES (@NextYear, @NurseryId, @StaffId, @ClassId, @Role, 0, 1, 1);
```

**UI操作**:
1. 翌年度 (例: 2026年度) を選択
2. クラスごとに担任スタッフを選択・登録
3. 主担任・副担任の役割を指定

### 2. 年度スライド実行（4月1日）

**画面**: 年度管理 > 年度スライド実行

**実行条件**:
- 現在の日付が年度開始日以降であること
- 翌年度のクラス構成・担任設定が完了していること

**処理フロー**:

#### Step 1: トランザクション開始
```sql
BEGIN TRANSACTION;
BEGIN TRY
```

#### Step 2: 現在年度を過去年度に移行
```sql
-- AcademicYears: 現在年度をアーカイブ
UPDATE AcademicYears
SET IsCurrent = 0, IsArchived = 1, ArchivedAt = GETUTCDATE(), UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND IsCurrent = 1;

-- ChildClassAssignments: 現在年度フラグをクリア
UPDATE ChildClassAssignments
SET IsCurrent = 0, UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND IsCurrent = 1;

-- StaffClassAssignments: 現在年度フラグをクリア、過去年度は無効化
UPDATE StaffClassAssignments
SET IsCurrent = 0, IsActive = 0, UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND IsCurrent = 1;
```

#### Step 3: 翌年度を現在年度に昇格
```sql
-- AcademicYears: 翌年度を現在年度に設定
UPDATE AcademicYears
SET IsCurrent = 1, UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND Year = @NextYear;

-- ChildClassAssignments: 未来年度フラグを現在年度フラグに変更
UPDATE ChildClassAssignments
SET IsCurrent = 1, IsFuture = 0, UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND AcademicYear = @NextYear AND IsFuture = 1;

-- StaffClassAssignments: 未来年度フラグを現在年度フラグに変更
UPDATE StaffClassAssignments
SET IsCurrent = 1, IsFuture = 0, UpdatedAt = GETUTCDATE()
WHERE NurseryId = @NurseryId AND AcademicYear = @NextYear AND IsFuture = 1;
```

#### Step 4: Children テーブルの ClassId を更新
```sql
-- Childrenテーブルに反映（現年度として使用）
UPDATE c
SET c.ClassId = cca.ClassId, c.UpdatedAt = GETUTCDATE()
FROM Children c
INNER JOIN ChildClassAssignments cca
    ON c.NurseryId = cca.NurseryId AND c.ChildId = cca.ChildId
WHERE cca.NurseryId = @NurseryId
    AND cca.AcademicYear = @NextYear
    AND cca.IsCurrent = 1;
```

#### Step 5: PromotionHistory に進級履歴を記録
```sql
-- 進級履歴を作成
INSERT INTO PromotionHistory (NurseryId, ChildId, FromAcademicYear, ToAcademicYear, FromClassId, ToClassId, PromotedByUserId)
SELECT
    @NurseryId,
    current.ChildId,
    @CurrentYear AS FromAcademicYear,
    @NextYear AS ToAcademicYear,
    current.ClassId AS FromClassId,
    next.ClassId AS ToClassId,
    @UserId AS PromotedByUserId
FROM ChildClassAssignments current
INNER JOIN ChildClassAssignments next
    ON current.NurseryId = next.NurseryId
    AND current.ChildId = next.ChildId
WHERE current.NurseryId = @NurseryId
    AND current.AcademicYear = @CurrentYear
    AND next.AcademicYear = @NextYear
    AND next.IsCurrent = 1;
```

#### Step 6: コミット
```sql
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
```

### 3. 過去年度の参照

**画面**: 年度管理 > 過去年度参照

**クラス構成の取得**:
```sql
-- 指定年度のクラス構成を取得
SELECT
    c.ChildId,
    c.Name AS ChildName,
    cca.ClassId,
    cl.Name AS ClassName,
    cca.AcademicYear
FROM ChildClassAssignments cca
INNER JOIN Children c ON cca.NurseryId = c.NurseryId AND cca.ChildId = c.ChildId
INNER JOIN Classes cl ON cca.NurseryId = cl.NurseryId AND cca.ClassId = cl.ClassId
WHERE cca.NurseryId = @NurseryId
    AND cca.AcademicYear = @Year
ORDER BY cca.ClassId, c.Name;
```

**担任構成の取得**:
```sql
-- 指定年度の担任構成を取得
SELECT
    sca.ClassId,
    cl.Name AS ClassName,
    s.StaffId,
    s.Name AS StaffName,
    sca.AssignmentRole,
    sca.AcademicYear
FROM StaffClassAssignments sca
INNER JOIN Staff s ON sca.NurseryId = s.NurseryId AND sca.StaffId = s.StaffId
INNER JOIN Classes cl ON sca.NurseryId = cl.NurseryId AND sca.ClassId = cl.ClassId
WHERE sca.NurseryId = @NurseryId
    AND sca.AcademicYear = @Year
ORDER BY sca.ClassId, sca.AssignmentRole, s.Name;
```

## データ整合性の確保

### 制約事項

1. **年度の一意性**
   - 1つの保育園で同時に複数の IsCurrent=1 の年度は存在しない
   - AcademicYears テーブルでユニークインデックスで保証

2. **園児のクラス所属**
   - 1人の園児は1年度につき1クラスのみ所属
   - ChildClassAssignments の複合主キー (AcademicYear, NurseryId, ChildId) で保証

3. **担任の重複防止**
   - 1人のスタッフが同じ年度・クラスに複数の役割で割り当てられない
   - StaffClassAssignments の複合主キー (AcademicYear, NurseryId, StaffId, ClassId) で制御

### エラーハンドリング

**年度スライド時のチェック**:

```sql
-- 翌年度のクラス構成が存在するか確認
IF NOT EXISTS (
    SELECT 1 FROM ChildClassAssignments
    WHERE NurseryId = @NurseryId AND AcademicYear = @NextYear AND IsFuture = 1
)
BEGIN
    THROW 50001, '翌年度のクラス構成が設定されていません', 1;
END

-- 翌年度の担任設定が存在するか確認
IF NOT EXISTS (
    SELECT 1 FROM StaffClassAssignments
    WHERE NurseryId = @NurseryId AND AcademicYear = @NextYear AND IsFuture = 1
)
BEGIN
    THROW 50002, '翌年度の担任設定が登録されていません', 1;
END

-- 既に年度スライドが実行済みでないか確認
IF EXISTS (
    SELECT 1 FROM AcademicYears
    WHERE NurseryId = @NurseryId AND Year = @NextYear AND IsCurrent = 1
)
BEGIN
    THROW 50003, '既に年度スライドが実行されています', 1;
END
```

## 画面設計

### 年度管理メニュー

```
年度管理
├── 現在年度確認
├── 翌年度クラス構成設定
│   ├── クラス別園児割り当て
│   └── 一括登録
├── 翌年度担任設定
│   ├── クラス別担任割り当て
│   └── 役割設定（主担任/副担任）
├── 年度スライド実行
│   ├── 事前チェック
│   ├── プレビュー（変更内容確認）
│   └── 実行確認ダイアログ
└── 過去年度参照
    ├── 年度選択
    ├── クラス構成表示
    └── 担任構成表示
```

### UI/UX の重要ポイント

1. **翌年度設定時のプレビュー**
   - 現年度と翌年度のクラス構成を並べて表示
   - 変更点（進級、担任変更）をハイライト表示

2. **年度スライド実行前の確認**
   - 変更内容のサマリー表示
   - 「実行すると元に戻せません」の警告
   - 最終確認ダイアログ

3. **過去年度参照**
   - 年度プルダウンで簡単に切り替え
   - 現年度との比較表示オプション

## API設計

### エンドポイント

```
POST   /api/academic-years/{nurseryId}/slide          # 年度スライド実行
GET    /api/academic-years/{nurseryId}/current        # 現在年度取得
GET    /api/academic-years/{nurseryId}/{year}         # 指定年度取得

POST   /api/child-class-assignments/{nurseryId}       # 園児クラス所属登録
GET    /api/child-class-assignments/{nurseryId}/{year} # 指定年度のクラス構成取得
PUT    /api/child-class-assignments/{nurseryId}/{year} # クラス構成一括更新

POST   /api/staff-class-assignments/{nurseryId}       # 担任割り当て登録
GET    /api/staff-class-assignments/{nurseryId}/{year} # 指定年度の担任構成取得
PUT    /api/staff-class-assignments/{nurseryId}/{year} # 担任構成一括更新

GET    /api/promotion-history/{nurseryId}             # 進級履歴取得
GET    /api/promotion-history/{nurseryId}/child/{childId} # 園児別進級履歴
```

## まとめ

### 新規テーブル

| テーブル名 | 目的 | 主キー |
|-----------|------|--------|
| ChildClassAssignments | 園児のクラス所属履歴（過去・現在・未来） | (AcademicYear, NurseryId, ChildId) |

### 既存テーブル拡張

| テーブル名 | 変更内容 | 目的 |
|-----------|---------|------|
| StaffClassAssignments | 複合主キーに AcademicYear を追加<br>IsCurrent, IsFuture カラム追加 | 年度別の担任割り当て管理<br>現在年度・未来年度の区別 |

### 年度スライドの流れ

1. **3月**: 翌年度のクラス構成・担任を事前設定 (IsFuture=1)
2. **4月1日**: 年度スライド実行
   - 現年度を過去年度に移行 (IsCurrent=0, IsArchived=1)
   - 翌年度を現年度に昇格 (IsFuture=0, IsCurrent=1)
   - Children.ClassId を更新
   - PromotionHistory に履歴記録
3. **通年**: 過去年度のクラス構成・担任を参照可能

### 設計上の利点

1. **履歴管理**: 過去の全ての年度のクラス構成・担任を保持
2. **事前設定**: 年度末に余裕を持って翌年度の準備が可能
3. **トレーサビリティ**: PromotionHistory で進級の履歴を追跡
4. **柔軟性**: 年度スライド前に何度でも翌年度の設定を変更可能
5. **データ整合性**: トランザクションで一貫性を保証

---

**作成日**: 2025-12-01
**更新日**: 2025-12-01
**バージョン**: 1.1
**ステータス**: 実装済み (Phase 1)

## 変更履歴

### v1.1 (2025-12-01)
- **Phase 1実装完了**: ChildClassAssignments、StaffClassAssignmentsテーブルの作成・拡張完了
- **主キー設計変更**: 複合主キーの先頭をAcademicYearに変更
  - ChildClassAssignments: (AcademicYear, NurseryId, ChildId)
  - StaffClassAssignments: (AcademicYear, NurseryId, StaffId, ClassId)
- **命名統一**: すべての年度カラムを "AcademicYear" に統一
- StaffClassAssignmentsのテーブル定義を実装済みの形式に更新

### v1.0 (2025-12-01)
- 初版作成
- 年度スライド機能の設計
