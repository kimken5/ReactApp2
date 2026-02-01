# デスクトップWebアプリ データベース拡張設計書

## 概要

本設計書では、保育園管理デスクトップWebアプリに必要なデータベース拡張を定義します。モバイルアプリと同一のAzure SQL Databaseを使用し、既存テーブルへの項目追加と新規テーブルの作成を行います。

**本設計書の内容は承認済みです。**
- 既存テーブル拡張: 9テーブルに合計28カラムを追加
- 新規テーブル作成: 4テーブル(年度管理、進級履歴、監査ログ、日次出欠表)

**変更履歴**:
- 2025-12-01: AcademicYearsテーブルのスキーマ変更(ID列削除、複合主キー(NurseryId, Year)採用)
- 2025-12-01: AttendanceStatisticsテーブル削除(リアルタイム統計計算方式に変更)
- 2025-12-01: バッチ処理による統計計算を廃止(画面上での条件指定によるリアルタイムクエリ方式に変更)

## 1. 既存テーブルへの項目追加

### 1.1 Nurseries テーブル拡張

**追加理由**: デスクトップアプリのログイン認証、セキュリティ管理、年度管理に必要

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Nurseries ADD
    LoginID NVARCHAR(50) NULL,  -- 既存
    Password NVARCHAR(255) NULL,  -- 既存（BCryptハッシュ化、256文字確保）
    LastLoginAt DATETIME2 NULL,  -- 最終ログイン日時
    LoginAttempts INT NOT NULL DEFAULT 0,  -- ログイン試行回数（セキュリティ）
    IsLocked BIT NOT NULL DEFAULT 0,  -- アカウントロック状態
    LockedUntil DATETIME2 NULL,  -- ロック解除日時
    CurrentAcademicYear INT NOT NULL DEFAULT YEAR(GETDATE());  -- 現在の年度

-- インデックス追加
CREATE INDEX IX_Nurseries_LoginID ON Nurseries (LoginID) WHERE LoginID IS NOT NULL;
CREATE INDEX IX_Nurseries_CurrentAcademicYear ON Nurseries (CurrentAcademicYear);

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'ログインID（デスクトップアプリ用）', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LoginID';
EXEC sp_addextendedproperty 'MS_Description', 'パスワード（BCryptハッシュ）', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Password';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LastLoginAt';
EXEC sp_addextendedproperty 'MS_Description', 'ログイン試行回数', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LoginAttempts';
EXEC sp_addextendedproperty 'MS_Description', 'アカウントロック状態', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'IsLocked';
EXEC sp_addextendedproperty 'MS_Description', 'ロック解除日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LockedUntil';
EXEC sp_addextendedproperty 'MS_Description', '現在の年度', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'CurrentAcademicYear';
```

**ビジネスルール**
- LoginIDは一意（NULL許可だがユニーク制約）
- ログイン試行回数が5回を超えるとアカウントロック（30分間）
- CurrentAcademicYearは年度切り替え時に自動更新

### 1.2 Classes テーブル拡張

**追加理由**: 有効/無効フラグによるクラス管理に必要

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Classes ADD
    IsActive BIT NOT NULL DEFAULT 1;  -- 有効/無効フラグ

-- インデックス追加
CREATE INDEX IX_Classes_IsActive ON Classes (NurseryId, IsActive) WHERE IsActive = 1;

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'IsActive';
```

**ビジネスルール**
- ClassIdは保育園内で一意
- IsActive=0のクラスは無効化されたクラスとして保持

**変更履歴**
- 2025-11-20: AcademicYearカラムを削除（年度管理はAcademicYearsテーブルとStaffClassAssignments.AcademicYearで管理）

### 1.3 Children テーブル拡張

**追加理由**: 卒園管理、血液型管理、出席記録、名前フィールド分割、アレルギー管理に必要

**変更履歴**:
- 2025-12-31: 名前フィールド分割（Name → FamilyName + FirstName、Furigana → FamilyFurigana + FirstFurigana）
- 2025-12-31: Allergyフィールド追加
- 2025-12-31: MedicalNotes, SpecialInstructions を nvarchar(500) に変更

**現在のChildrenテーブル構造**:
```sql
CREATE TABLE [dbo].[Children] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [FamilyName] NVARCHAR(20) NOT NULL,  -- 苗字
    [FirstName] NVARCHAR(20) NOT NULL,  -- 名前
    [FamilyFurigana] NVARCHAR(20),  -- ふりがな（苗字）
    [FirstFurigana] NVARCHAR(20),  -- ふりがな（名前）
    [DateOfBirth] DATETIME2 NOT NULL,
    [Gender] NVARCHAR(10) NOT NULL,
    [ClassId] NVARCHAR(50),
    [Allergy] NVARCHAR(200),  -- アレルギー情報
    [MedicalNotes] NVARCHAR(500),  -- 医療メモ
    [SpecialInstructions] NVARCHAR(500),  -- 特別指示
    [NoPhoto] BIT DEFAULT 0 NOT NULL,
    [IsActive] BIT DEFAULT 1 NOT NULL,
    [GraduationDate] DATE,
    [GraduationStatus] NVARCHAR(20),
    [WithdrawalReason] NVARCHAR(200),
    [BloodType] NVARCHAR(5),
    [LastAttendanceDate] DATE,
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedAt] DATETIME2,
    CONSTRAINT [PK_Children] PRIMARY KEY ([NurseryId], [ChildId])
);

-- インデックス
CREATE INDEX IX_Children_BirthDate ON Children (DateOfBirth);
CREATE INDEX IX_Children_Class_Active ON Children (ClassId, IsActive);
CREATE INDEX IX_Children_GraduationDate ON Children (NurseryId, GraduationDate) WHERE GraduationDate IS NOT NULL;
CREATE INDEX IX_Children_LastAttendanceDate ON Children (NurseryId, LastAttendanceDate) WHERE LastAttendanceDate IS NOT NULL;
```

**ビジネスルール**
- IsActive=0かつGraduationStatusがNULLの場合は「在籍中だが休園中」
- GraduationStatus='Graduated'の場合は卒園
- GraduationStatus='Withdrawn'の場合は途中退園
- **画面表示時の名前**: `FamilyName + " " + FirstName` で結合（例: "山田 太郎"）

### 1.4 Staff テーブル拡張

**追加理由**: 退職日管理、備考管理に必要

**実装済み**: 2025/10/26 - ResignationDate列、Remark列追加完了

```sql
-- 既存テーブルに以下のカラムを追加（実装済み）
ALTER TABLE Staff ADD
    ResignationDate DATE NULL,  -- 退職日
    Remark NVARCHAR(500) NULL;  -- 備考

-- カラムコメント追加（実装済み）
EXEC sp_addextendedproperty 'MS_Description', '退職日', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'ResignationDate';
EXEC sp_addextendedproperty 'MS_Description', '備考', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'Remark';
```

**現在のStaffテーブル構造**:
- NurseryId (int, PK)
- StaffId (int, PK)
- Name (nvarchar(50))
- PhoneNumber (nvarchar(15), ユニーク)
- Email (nvarchar(200))
- Role (nvarchar(50))
- Position (nvarchar(100))
- **ResignationDate (date)** ← 追加済み
- **Remark (nvarchar(500))** ← 追加済み
- LastLoginAt (datetime2)
- IsActive (bit)
- CreatedAt (datetime2)
- UpdatedAt (datetime2)

### 1.5 StaffClassAssignments テーブル再構築（年度スライド対応）

**変更理由**: 年度別のクラス割り当て管理、年度スライド機能のサポート

**実装済み**: 既存テーブルを再構築し、以下の変更を実施

```sql
-- テーブル再構築（実装済み）
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

**主な変更点**
- 複合主キーに AcademicYear を追加 (先頭に配置)
- IsCurrent、IsFuture カラムを追加（年度スライド管理用）
- AssignedByUserId、Notes カラムを追加

**ビジネスルール**
- 複合主キー (AcademicYear, NurseryId, StaffId, ClassId) で、1人のスタッフが同じ年度・クラスに重複割り当てされることを防止
- IsCurrent=1 のレコードは現在年度の担任割り当てを示す
- IsFuture=1 のレコードは未来年度の事前設定を示す
- 年度スライド時に IsFuture=1 → IsCurrent=1 に変更される
- 過去年度の割り当てはIsActive=0で保持

### 1.6 AbsenceNotifications テーブル拡張

**追加理由**: 管理者による確認、スタッフ指定の記録

```sql
-- 既存テーブル名が不明なため、想定される構造に基づいて提案
-- モバイルアプリの仕様書で "ContactNotifications" として記載されている可能性あり

-- 以下のカラムを追加（テーブル名はContactNotificationsと仮定）
ALTER TABLE AbsenceNotifications ADD
    AcknowledgedByAdminUser BIT NOT NULL DEFAULT 0,  -- 管理者による確認フラグ
    RespondedByStaffId INT NULL,  -- 対応したスタッフID
    AcknowledgedByAdminAt DATETIME2 NULL;  -- 管理者確認日時

-- インデックス追加
CREATE INDEX IX_AbsenceNotifications_AcknowledgedByAdmin ON AbsenceNotifications (AcknowledgedByAdminUser, AcknowledgedByAdminAt);
CREATE INDEX IX_AbsenceNotifications_RespondedByStaffId ON AbsenceNotifications (RespondedByStaffId) WHERE RespondedByStaffId IS NOT NULL;

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '管理者による確認フラグ', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotifications', 'COLUMN', 'AcknowledgedByAdminUser';
EXEC sp_addextendedproperty 'MS_Description', '対応したスタッフID', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotifications', 'COLUMN', 'RespondedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '管理者確認日時', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotifications', 'COLUMN', 'AcknowledgedByAdminAt';
```

### 1.7 DailyReports テーブル

**変更内容**: スキーマ変更（CategoryをReportKindに変更、Tagsフィールドを削除）

**最新スキーマ**:

```sql
CREATE TABLE [dbo].[DailyReports] (
    [Id] INT IDENTITY NOT NULL,
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [StaffNurseryId] INT NOT NULL,
    [StaffId] INT NOT NULL,
    [ReportDate] DATE NOT NULL,
    [ReportKind] NVARCHAR(50) NOT NULL,  -- レポート種別（activity, meal, sleep, health, incident, behavior）
    [Title] NVARCHAR(200) NOT NULL,
    [Content] NVARCHAR(1000) NOT NULL,
    [Photos] NVARCHAR(1000),  -- JSON配列形式の写真URL
    [Status] NVARCHAR(20) DEFAULT N'draft' NOT NULL,
    [PublishedAt] DATETIME2,
    [ParentAcknowledged] BIT DEFAULT 0 NOT NULL,
    [AcknowledgedAt] DATETIME2,
    [CreatedByAdminUser] BIT DEFAULT 0 NOT NULL,  -- 管理者作成フラグ
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    [UpdatedAt] DATETIME2,
    CONSTRAINT [PK_DailyReports] PRIMARY KEY ([Id])
);

-- インデックス
CREATE INDEX IX_DailyReports_Child_Date_Status ON [dbo].[DailyReports]([NurseryId], [ChildId], [ReportDate], [Status]);
CREATE INDEX IX_DailyReports_Date_Status ON [dbo].[DailyReports]([ReportDate], [Status]);
CREATE INDEX IX_DailyReports_Staff_Created ON [dbo].[DailyReports]([StaffNurseryId], [StaffId], [CreatedAt]);

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '連絡帳ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '職員保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'StaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', '職員ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'StaffId';
EXEC sp_addextendedproperty 'MS_Description', '対象日', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ReportDate';
EXEC sp_addextendedproperty 'MS_Description', 'レポート種別', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ReportKind';
EXEC sp_addextendedproperty 'MS_Description', 'タイトル', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Title';
EXEC sp_addextendedproperty 'MS_Description', '内容', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Content';
EXEC sp_addextendedproperty 'MS_Description', '写真', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Photos';
EXEC sp_addextendedproperty 'MS_Description', 'ステータス', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Status';
EXEC sp_addextendedproperty 'MS_Description', '公開日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'PublishedAt';
EXEC sp_addextendedproperty 'MS_Description', '保護者確認', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ParentAcknowledged';
EXEC sp_addextendedproperty 'MS_Description', '保護者日報確認日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'AcknowledgedAt';
EXEC sp_addextendedproperty 'MS_Description', '管理者作成フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'CreatedByAdminUser';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'UpdatedAt';
```

**ReportKind値**:
- `activity`: 活動
- `meal`: 食事
- `sleep`: 睡眠
- `health`: 健康
- `incident`: 事故
- `behavior`: 行動

### 1.8 Photos テーブル拡張

**追加理由**: 管理者による代理アップロード記録（写真のタグ付けは既存のPhotoChildrenテーブルを使用）

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Photos ADD
    UploadedByAdminUser BIT NOT NULL DEFAULT 0;  -- 管理者アップロードフラグ

-- インデックス追加
CREATE INDEX IX_Photos_UploadedByAdminUser ON Photos (UploadedByAdminUser);

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '管理者アップロードフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UploadedByAdminUser';
```

**備考**
- 写真への園児タグ付けは既存のPhotoChildrenテーブルを使用

### 1.9 Announcements テーブル拡張

**追加理由**: 管理者による代理作成記録

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Announcements ADD
    CreatedByAdminUser BIT NOT NULL DEFAULT 0;  -- 管理者作成フラグ

-- インデックス追加
CREATE INDEX IX_Announcements_CreatedByAdminUser ON Announcements (CreatedByAdminUser);

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '管理者作成フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'CreatedByAdminUser';
```

## 2. 新規テーブル作成

### 2.1 AcademicYears（年度管理）

**目的**: 年度の定義、年度切り替え履歴の管理

```sql
CREATE TABLE [dbo].[AcademicYears] (
    [NurseryId] INT NOT NULL,
    [Year] INT NOT NULL,  -- 年度(西暦)
    [StartDate] DATE NOT NULL,  -- 年度開始日(通常4月1日)
    [EndDate] DATE NOT NULL,  -- 年度終了日(通常3月31日)
    [IsCurrent] BIT NOT NULL DEFAULT 0,  -- 現在年度フラグ
    [IsArchived] BIT NOT NULL DEFAULT 0,  -- アーカイブ済みフラグ
    [ArchivedAt] DATETIME2 NULL,  -- アーカイブ日時
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT PK_AcademicYears PRIMARY KEY ([NurseryId], [Year])
);

-- インデックス作成
CREATE INDEX IX_AcademicYears_NurseryId_IsCurrent ON AcademicYears (NurseryId, IsCurrent) WHERE IsCurrent = 1;

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '年度管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '保育園ID(複合主キー)', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '年度（西暦）', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'Year';
EXEC sp_addextendedproperty 'MS_Description', '年度開始日', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'StartDate';
EXEC sp_addextendedproperty 'MS_Description', '年度終了日', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'EndDate';
EXEC sp_addextendedproperty 'MS_Description', '現在年度フラグ', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'IsCurrent';
EXEC sp_addextendedproperty 'MS_Description', 'アーカイブ済みフラグ', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'IsArchived';
EXEC sp_addextendedproperty 'MS_Description', 'アーカイブ日時', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'ArchivedAt';
```

**ビジネスルール**
- 複合主キー: (NurseryId, Year)
- 保育園ごとに同時に複数のIsCurrent=1レコードは存在しない
- 年度終了時に自動的にIsArchived=1に更新

### 2.2 PromotionHistory（進級履歴）

**目的**: 園児の進級履歴を記録

```sql
CREATE TABLE PromotionHistory (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    FromAcademicYear INT NOT NULL,  -- 進級元年度
    ToAcademicYear INT NOT NULL,  -- 進級先年度
    FromClassId NVARCHAR(50) NOT NULL,  -- 進級元クラス
    ToClassId NVARCHAR(50) NOT NULL,  -- 進級先クラス
    PromotedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 進級実行日時
    PromotedByUserId INT NULL,  -- 進級処理実行者
    Notes NVARCHAR(200) NULL,  -- 備考
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- インデックス作成
CREATE INDEX IX_PromotionHistory_Child ON PromotionHistory (NurseryId, ChildId);
CREATE INDEX IX_PromotionHistory_AcademicYear ON PromotionHistory (NurseryId, ToAcademicYear);
CREATE INDEX IX_PromotionHistory_PromotedAt ON PromotionHistory (NurseryId, PromotedAt);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '進級履歴テーブル', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '進級履歴ID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '進級元年度', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'FromAcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '進級先年度', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'ToAcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '進級元クラスID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'FromClassId';
EXEC sp_addextendedproperty 'MS_Description', '進級先クラスID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'ToClassId';
EXEC sp_addextendedproperty 'MS_Description', '進級実行日時', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'PromotedAt';
EXEC sp_addextendedproperty 'MS_Description', '進級処理実行者ID', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'PromotedByUserId';
EXEC sp_addextendedproperty 'MS_Description', '備考', 'SCHEMA', 'dbo', 'TABLE', 'PromotionHistory', 'COLUMN', 'Notes';
```

### 2.3 AuditLogs（監査ログ）

**目的**: 管理画面での操作ログを記録（セキュリティ、トレーサビリティ）

```sql
CREATE TABLE AuditLogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    UserId INT NULL,  -- 操作者ID（Nursery.Idを想定）
    UserName NVARCHAR(100) NULL,  -- 操作者名
    Action NVARCHAR(50) NOT NULL,  -- 操作種別（Create/Update/Delete/Login/Logout等）
    EntityType NVARCHAR(50) NOT NULL,  -- 対象エンティティ種別（Child/Staff/Class等）
    EntityId NVARCHAR(50) NULL,  -- 対象エンティティID
    BeforeValue NVARCHAR(MAX) NULL,  -- 変更前の値（JSON）
    AfterValue NVARCHAR(MAX) NULL,  -- 変更後の値（JSON）
    IpAddress NVARCHAR(45) NULL,  -- IPアドレス
    UserAgent NVARCHAR(500) NULL,  -- ユーザーエージェント
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE()  -- 操作日時
);

-- インデックス作成
CREATE INDEX IX_AuditLogs_NurseryId_Timestamp ON AuditLogs (NurseryId, Timestamp DESC);
CREATE INDEX IX_AuditLogs_UserId ON AuditLogs (UserId) WHERE UserId IS NOT NULL;
CREATE INDEX IX_AuditLogs_Action ON AuditLogs (Action);
CREATE INDEX IX_AuditLogs_EntityType ON AuditLogs (EntityType);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '監査ログテーブル', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', 'ログID', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '操作者ID', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'UserId';
EXEC sp_addextendedproperty 'MS_Description', '操作者名', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'UserName';
EXEC sp_addextendedproperty 'MS_Description', '操作種別', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'Action';
EXEC sp_addextendedproperty 'MS_Description', '対象エンティティ種別', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'EntityType';
EXEC sp_addextendedproperty 'MS_Description', '対象エンティティID', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'EntityId';
EXEC sp_addextendedproperty 'MS_Description', '変更前の値（JSON）', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'BeforeValue';
EXEC sp_addextendedproperty 'MS_Description', '変更後の値（JSON）', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'AfterValue';
EXEC sp_addextendedproperty 'MS_Description', 'IPアドレス', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'IpAddress';
EXEC sp_addextendedproperty 'MS_Description', 'ユーザーエージェント', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'UserAgent';
EXEC sp_addextendedproperty 'MS_Description', '操作日時', 'SCHEMA', 'dbo', 'TABLE', 'AuditLogs', 'COLUMN', 'Timestamp';
```

**記録対象の操作**
- ログイン/ログアウト
- マスタデータの作成・更新・削除（園児、スタッフ、クラス、保護者）
- 進級処理、卒園処理
- 日報の承認・却下
- 写真の承認・却下
- 連絡の確認・返信
- お知らせの配信

### 2.4 DailyAttendances（日次出欠表）

**目的**: 園児の日々の出欠状況を記録・管理

```sql
CREATE TABLE DailyAttendances (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    CONSTRAINT PK_DailyAttendances PRIMARY KEY (NurseryId, ChildId, AttendanceDate),
    Status NVARCHAR(20) NOT NULL DEFAULT 'blank',  -- blank(未記録), present(出席), absent(欠席), late(遅刻)
    ArrivalTime TIME NULL,  -- 到着時刻（遅刻の場合など）
    Notes NVARCHAR(500) NULL,  -- 備考（体調、様子など）
    AbsenceNotificationId INT NULL,  -- 欠席連絡ID（欠席連絡経由の場合）
    RecordedByStaffId INT NULL,  -- 記録スタッフID
    RecordedByStaffNurseryId INT NULL,  -- 記録スタッフ保育園ID
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 記録日時
    UpdatedByStaffId INT NULL,  -- 更新スタッフID
    UpdatedByStaffNurseryId INT NULL,  -- 更新スタッフ保育園ID
    UpdatedAt DATETIME2 NULL,  -- 更新日時
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 作成日時
    IsActive BIT NOT NULL DEFAULT 1  -- 論理削除フラグ
);

-- インデックス作成
CREATE INDEX IX_DailyAttendances_Date_Status ON DailyAttendances (NurseryId, AttendanceDate, Status);
CREATE INDEX IX_DailyAttendances_Child_Date ON DailyAttendances (NurseryId, ChildId, AttendanceDate DESC);
CREATE INDEX IX_DailyAttendances_AbsenceNotification ON DailyAttendances (AbsenceNotificationId) WHERE AbsenceNotificationId IS NOT NULL;
CREATE INDEX IX_DailyAttendances_IsActive ON DailyAttendances (NurseryId, IsActive) WHERE IsActive = 1;

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '日次出欠表テーブル', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '出欠日', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'AttendanceDate';
EXEC sp_addextendedproperty 'MS_Description', '出欠ステータス', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'Status';
EXEC sp_addextendedproperty 'MS_Description', '到着時刻', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'ArrivalTime';
EXEC sp_addextendedproperty 'MS_Description', '備考', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'Notes';
EXEC sp_addextendedproperty 'MS_Description', '欠席連絡ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'AbsenceNotificationId';
EXEC sp_addextendedproperty 'MS_Description', '記録スタッフID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '記録スタッフ保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedByStaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', '記録日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'RecordedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新スタッフID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '更新スタッフ保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedByStaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '論理削除フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyAttendances', 'COLUMN', 'IsActive';
```

**ビジネスルール**
- 複合主キー (NurseryId, ChildId, AttendanceDate)
- Status値: 'blank' (未記録), 'present' (出席), 'absent' (欠席), 'late' (遅刻)
- 欠席連絡経由で作成された場合は AbsenceNotificationId が設定される
- 過去30日以前のデータは編集不可（閲覧のみ）

**外部キー制約** (論理的な関係、EF Coreでは無視)
- NurseryId, ChildId → Children(NurseryId, ChildId)
- AbsenceNotificationId → ContactNotifications(Id)
- RecordedByStaffNurseryId, RecordedByStaffId → Staff(NurseryId, StaffId)
- UpdatedByStaffNurseryId, UpdatedByStaffId → Staff(NurseryId, StaffId)

### 2.5 NurseryDayTypes（休園日・休日保育管理）

**目的**: 休園日と休日保育の日付を一元管理

```sql
CREATE TABLE [dbo].[NurseryDayTypes] (
  [Id] INT IDENTITY(1,1) NOT NULL,
  [NurseryId] NVARCHAR(50) NOT NULL,
  [Date] DATE NOT NULL,
  [DayType] NVARCHAR(20) NOT NULL,
  [CreatedBy] INT NOT NULL,
  [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  CONSTRAINT [PK__NurseryDayTypes] PRIMARY KEY ([Id]),
  CONSTRAINT [UQ_NurseryDayTypes_NurseryId_Date] UNIQUE ([NurseryId], [Date])
);

-- インデックス作成
CREATE INDEX [IX_NurseryDayTypes_NurseryId_Date] ON [dbo].[NurseryDayTypes]([NurseryId], [Date]);
CREATE INDEX [IX_NurseryDayTypes_Date] ON [dbo].[NurseryDayTypes]([Date]);
CREATE INDEX [IX_NurseryDayTypes_DayType] ON [dbo].[NurseryDayTypes]([DayType]);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '休園日・休日保育管理', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', 'ID', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '日付', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'Date';
EXEC sp_addextendedproperty 'MS_Description', '日付種別（ClosedDay:休園日 / HolidayCare:休日保育）', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'DayType';
EXEC sp_addextendedproperty 'MS_Description', '作成者ID', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'CreatedBy';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'NurseryDayTypes', 'COLUMN', 'UpdatedAt';
```

**ビジネスルール**
- ユニーク制約: 同じ保育園・同じ日付で重複不可
- DayType値: `ClosedDay` (休園日), `HolidayCare` (休日保育)
- 1日1件のみ登録可能（休園日と休日保育の両方を同日に設定することは不可）

**カレンダーイベントとの統合**
- CalendarEventsテーブルの`nursery_holiday`カテゴリは削除
- 休園日・休日保育はNurseryDayTypesテーブルで一元管理
- カレンダー表示時は、CalendarEventsとNurseryDayTypesの両方から情報を取得して統合表示

**外部キー制約** (論理的な関係、EF Coreでは無視)
- NurseryId → Nurseries(Id)
- CreatedBy → Nurseries(Id) または Staff(NurseryId, StaffId)

## 3. マイグレーション順序

データベース拡張を安全に実行するための推奨順序：

### Phase 1: 既存テーブル拡張（依存関係なし）
1. Nurseries テーブル拡張
2. Classes テーブル拡張
3. Children テーブル拡張
4. Staff テーブル拡張

### Phase 2: 既存テーブル拡張（依存関係あり）
5. StaffClassAssignments テーブル拡張
6. AbsenceNotifications テーブル拡張
7. DailyReports テーブル拡張
8. Photos テーブル拡張
9. Announcements テーブル拡張

### Phase 3: 新規テーブル作成（基本）
10. AcademicYears テーブル作成
11. AuditLogs テーブル作成

### Phase 4: 新規テーブル作成(履歴系)
12. PromotionHistory テーブル作成
13. DailyAttendances テーブル作成

### Phase 5: 新規テーブル作成(カレンダー関連)
14. NurseryDayTypes テーブル作成

## 4. データ移行スクリプト

### 4.1 現在年度の初期化

```sql
-- 現在の年度レコードを作成（初回のみ実行）
INSERT INTO AcademicYears (NurseryId, Year, StartDate, EndDate, IsCurrent)
SELECT
    Id AS NurseryId,
    YEAR(GETDATE()) AS Year,
    DATEFROMPARTS(YEAR(GETDATE()), 4, 1) AS StartDate,
    DATEFROMPARTS(YEAR(GETDATE()) + 1, 3, 31) AS EndDate,
    1 AS IsCurrent
FROM Nurseries
WHERE NOT EXISTS (
    SELECT 1 FROM AcademicYears WHERE NurseryId = Nurseries.Id AND IsCurrent = 1
);
```

### 4.2 ~~Classesテーブルへの年度情報追加~~（削除済み）

**変更履歴**
- 2025-11-20: AcademicYearカラム削除により、このセクションは不要となりました

### 4.3 StaffClassAssignmentsテーブルへの年度情報追加

```sql
-- 既存のStaffClassAssignmentsレコードに現在年度を設定
UPDATE StaffClassAssignments
SET AcademicYear = YEAR(GETDATE())
WHERE AcademicYear IS NULL OR AcademicYear = 0;
```

## 5. ビュー定義

### 5.1 v_CurrentYearChildren（現在年度の園児一覧）

```sql
CREATE VIEW v_CurrentYearChildren AS
SELECT
    c.*,
    cl.Name AS ClassName,
    cl.GradeLevel,
    cl.AcademicYear,
    ay.IsCurrent
FROM Children c
INNER JOIN Classes cl ON c.NurseryId = cl.NurseryId AND c.ClassId = cl.ClassId
INNER JOIN AcademicYears ay ON c.NurseryId = ay.NurseryId AND cl.AcademicYear = ay.Year
WHERE c.IsActive = 1 AND ay.IsCurrent = 1;
```

### 5.2 v_CurrentYearStaffAssignments（現在年度のスタッフ配置）

```sql
CREATE VIEW v_CurrentYearStaffAssignments AS
SELECT
    sca.*,
    s.Name AS StaffName,
    s.Role,
    s.IsActive AS StaffIsActive,
    cl.Name AS ClassName,
    cl.GradeLevel,
    ay.IsCurrent
FROM StaffClassAssignments sca
INNER JOIN Staff s ON sca.NurseryId = s.NurseryId AND sca.StaffId = s.StaffId
INNER JOIN Classes cl ON sca.NurseryId = cl.NurseryId AND sca.ClassId = cl.ClassId
INNER JOIN AcademicYears ay ON sca.NurseryId = ay.NurseryId AND sca.AcademicYear = ay.Year
WHERE sca.IsActive = 1 AND ay.IsCurrent = 1 AND s.IsActive = 1;
```

### 5.3 v_ChildAttendanceSummary（園児出席状況サマリー）

**注意**: 出席統計はAttendanceStatisticsテーブルを使用せず、DailyAttendancesテーブルから直接リアルタイムで計算します。
画面上で条件(年度、月、クラスなど)を指定し、その場でクエリを発行してリアルタイムな統計値を表示する設計としています。

```sql
-- リアルタイム集計クエリ例: 指定年度・月・クラスの出席統計
SELECT
    c.NurseryId,
    c.ChildId,
    c.Name AS ChildName,
    c.ClassId,
    COUNT(CASE WHEN da.Status = 'present' THEN 1 END) AS PresentDays,
    COUNT(CASE WHEN da.Status = 'absent' THEN 1 END) AS AbsentDays,
    COUNT(CASE WHEN da.Status = 'late' THEN 1 END) AS TardyDays,
    COUNT(*) AS TotalDays,
    CAST(COUNT(CASE WHEN da.Status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS AttendanceRate
FROM Children c
INNER JOIN DailyAttendances da ON c.NurseryId = da.NurseryId AND c.ChildId = da.ChildId
WHERE c.NurseryId = @NurseryId
    AND c.ClassId = @ClassId  -- 必要に応じてフィルタ
    AND YEAR(da.AttendanceDate) = @Year
    AND MONTH(da.AttendanceDate) = @Month  -- 必要に応じてフィルタ
    AND da.IsActive = 1
GROUP BY c.NurseryId, c.ChildId, c.Name, c.ClassId;
```

## 6. ストアドプロシージャ

### 6.1 sp_PromoteChildren（進級処理）

```sql
CREATE PROCEDURE sp_PromoteChildren
    @NurseryId INT,
    @FromAcademicYear INT,
    @ToAcademicYear INT,
    @PromotedByUserId INT,
    @PromotionMappings NVARCHAR(MAX)  -- JSON形式: [{"ChildId": 1, "ToClassId": "sakura-2025"}]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- 一時テーブルにJSONをパース
        SELECT
            JSON_VALUE(value, '$.ChildId') AS ChildId,
            JSON_VALUE(value, '$.ToClassId') AS ToClassId
        INTO #PromotionTemp
        FROM OPENJSON(@PromotionMappings);

        -- 進級処理実行
        UPDATE c
        SET
            c.ClassId = pt.ToClassId,
            c.UpdatedAt = GETUTCDATE()
        FROM Children c
        INNER JOIN #PromotionTemp pt ON c.ChildId = pt.ChildId
        WHERE c.NurseryId = @NurseryId AND c.IsActive = 1;

        -- 進級履歴を記録
        INSERT INTO PromotionHistory (NurseryId, ChildId, FromAcademicYear, ToAcademicYear, FromClassId, ToClassId, PromotedByUserId)
        SELECT
            @NurseryId,
            c.ChildId,
            @FromAcademicYear,
            @ToAcademicYear,
            c.ClassId AS FromClassId,
            pt.ToClassId,
            @PromotedByUserId
        FROM Children c
        INNER JOIN #PromotionTemp pt ON c.ChildId = pt.ChildId
        WHERE c.NurseryId = @NurseryId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
```

## 7. Entity Framework Core エンティティクラス

### 7.1 AcademicYear.cs

```csharp
public class AcademicYear
{
    // 複合主キー: (NurseryId, Year)
    public int NurseryId { get; set; }
    public int Year { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public int TotalChildren { get; set; }
    public int TotalClasses { get; set; }
    public int TotalStaff { get; set; }
    public decimal? AverageAttendanceRate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### 7.2 PromotionHistory.cs

```csharp
public class PromotionHistory
{
    public int Id { get; set; }
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public int FromAcademicYear { get; set; }
    public int ToAcademicYear { get; set; }
    public string FromClassId { get; set; }
    public string ToClassId { get; set; }
    public DateTime PromotedAt { get; set; }
    public int? PromotedByUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### 7.3 AuditLog.cs

```csharp
public class AuditLog
{
    public long Id { get; set; }
    public int NurseryId { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; }
    public string EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### 7.4 DailyAttendance.cs

```csharp
public class DailyAttendance
{
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string Status { get; set; }  // "blank", "present", "absent", "late"
    public TimeSpan? ArrivalTime { get; set; }
    public string? Notes { get; set; }
    public int? AbsenceNotificationId { get; set; }
    public int? RecordedByStaffId { get; set; }
    public int? RecordedByStaffNurseryId { get; set; }
    public DateTime RecordedAt { get; set; }
    public int? UpdatedByStaffId { get; set; }
    public int? UpdatedByStaffNurseryId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

### 7.5 ApplicationWork.cs

**追加日**: 2025-12-08
**目的**: 入園申込ワークテーブル（保護者Web申込からデスクトップアプリ取込までの一時保管）

**変更履歴**:
- 2025-12-31: 園児名フィールド分割（ChildName → ChildFamilyName + ChildFirstName、ChildNameKana → ChildFamilyNameKana + ChildFirstNameKana）
- 2025-12-31: ChildAllergyフィールド追加
- 2025-12-31: ChildMedicalNotes, ChildSpecialInstructions を nvarchar(500) に変更
- 2025-12-31: ChildNoPhotoフィールド追加

**現在のApplicationWorksテーブル構造**:
```sql
CREATE TABLE [dbo].[ApplicationWorks] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [NurseryId] INT NOT NULL,

    -- 申請保護者情報
    [ApplicantName] NVARCHAR(100) NOT NULL,
    [ApplicantNameKana] NVARCHAR(100) NOT NULL,
    [DateOfBirth] DATE NOT NULL,
    [PostalCode] NVARCHAR(8),
    [Prefecture] NVARCHAR(10),
    [City] NVARCHAR(50),
    [AddressLine] NVARCHAR(200),
    [MobilePhone] NVARCHAR(20) NOT NULL,
    [HomePhone] NVARCHAR(20),
    [Email] NVARCHAR(255),
    [RelationshipToChild] NVARCHAR(20) NOT NULL,

    -- 園児情報
    [ChildFamilyName] NVARCHAR(20) NOT NULL,  -- 園児苗字
    [ChildFirstName] NVARCHAR(20) NOT NULL,  -- 園児名前
    [ChildFamilyNameKana] NVARCHAR(20) NOT NULL,  -- 園児ふりがな（苗字）
    [ChildFirstNameKana] NVARCHAR(20) NOT NULL,  -- 園児ふりがな（名前）
    [ChildDateOfBirth] DATE NOT NULL,
    [ChildGender] NVARCHAR(2) NOT NULL,
    [ChildBloodType] NVARCHAR(10),
    [ChildAllergy] NVARCHAR(200),  -- 園児アレルギー
    [ChildMedicalNotes] NVARCHAR(500),  -- 園児医療メモ
    [ChildSpecialInstructions] NVARCHAR(500),  -- 園児特別指示
    [ChildNoPhoto] BIT DEFAULT 1,  -- 撮影禁止

    -- 申込管理情報
    [ApplicationStatus] NVARCHAR(20) DEFAULT 'Pending' NOT NULL,
    [IsImported] BIT DEFAULT 0 NOT NULL,
    [ImportedAt] DATETIME2,
    [ImportedByUserId] INT,
    [CreatedAt] DATETIME2 DEFAULT [dbo].[GetJstDateTime]() NOT NULL,
    [UpdatedAt] DATETIME2,
    [RejectionReason] NVARCHAR(500),

    CONSTRAINT [PK__ApplicationWorks] PRIMARY KEY ([Id])
)
GO

-- インデックス
CREATE INDEX [IX_ApplicationWork_NurseryId] ON [dbo].[ApplicationWorks]([NurseryId])
CREATE INDEX [IX_ApplicationWork_MobilePhone] ON [dbo].[ApplicationWorks]([MobilePhone])
CREATE INDEX [IX_ApplicationWork_ApplicationStatus] ON [dbo].[ApplicationWorks]([ApplicationStatus])
CREATE INDEX [IX_ApplicationWork_IsImported] ON [dbo].[ApplicationWorks]([IsImported])
CREATE INDEX [IX_ApplicationWork_CreatedAt] ON [dbo].[ApplicationWork]([CreatedAt])
```

**C# モデルクラス**:
```csharp
public class ApplicationWork
{
    public int Id { get; set; }
    public int NurseryId { get; set; }

    // 申請保護者情報
    public string ApplicantName { get; set; } = string.Empty;
    public string ApplicantNameKana { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? PostalCode { get; set; }
    public string? Prefecture { get; set; }
    public string? City { get; set; }
    public string? AddressLine { get; set; }
    public string MobilePhone { get; set; } = string.Empty;
    public string? HomePhone { get; set; }
    public string? Email { get; set; }
    public string RelationshipToChild { get; set; } = string.Empty;

    // 園児情報
    public string ChildFamilyName { get; set; } = string.Empty;  // 園児苗字
    public string ChildFirstName { get; set; } = string.Empty;  // 園児名前
    public string ChildFamilyNameKana { get; set; } = string.Empty;  // 園児ふりがな（苗字）
    public string ChildFirstNameKana { get; set; } = string.Empty;  // 園児ふりがな（名前）
    public DateTime ChildDateOfBirth { get; set; }
    public string ChildGender { get; set; } = string.Empty;
    public string? ChildBloodType { get; set; }
    public string? ChildAllergy { get; set; }  // 園児アレルギー
    public string? ChildMedicalNotes { get; set; }
    public string? ChildSpecialInstructions { get; set; }
    public bool ChildNoPhoto { get; set; } = true;  // 撮影禁止

    // 申込管理情報
    public string ApplicationStatus { get; set; } = "Pending";  // Pending/Imported/Rejected
    public bool IsImported { get; set; } = false;
    public DateTime? ImportedAt { get; set; }
    public int? ImportedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? RejectionReason { get; set; }
}
```

**カラム説明**:
- `Id`: 申込ID（自動採番）
- `NurseryId`: 保育園ID（Nurseriesテーブルとの関連、外部キー制約なし）
- `ApplicantName` ~ `RelationshipToChild`: 申請保護者の情報（15項目）
- `ChildName` ~ `ChildSpecialInstructions`: 園児情報（7項目）
- `ApplicationStatus`: 申込状態（Pending: 受付済み、Imported: 取込完了、Rejected: 却下）
- `IsImported`: 取込済みフラグ（trueの場合は再取込不可）
- `ImportedAt`: 取込日時（取込実行時に設定）
- `ImportedByUserId`: 取込実行者ID（Nurseries.Idを想定）
- `CreatedAt`: 申込受付日時（保護者が送信した日時）
- `UpdatedAt`: 更新日時（却下時などに設定）
- `RejectionReason`: 却下理由（却下時のみ）

**ビジネスルール**:
- ApplicationStatusは "Pending" → "Imported" または "Rejected" への一方向遷移のみ
- IsImported=true のレコードは削除不可（監査目的で永続保存）
- MobilePhoneは正規化（ハイフン除去）後の値で保存
- 取込時に保護者マスタの重複チェック（MobilePhoneで照合）を実施

**関連テーブル**:
- Nurseries: ApplicationKeyによる保育園特定
- Parents: 取込時に携帯電話番号で重複チェック
- Children: 取込時に新規作成

---

## 8. まとめ

### 8.1 追加項目のサマリー（承認済み）

| テーブル | 追加カラム数 | 主な目的 |
|---------|------------|---------|
| Nurseries | 5 | ログイン認証、セキュリティ、年度管理 |
| Classes | 1 | 有効/無効フラグ（~~AcademicYear削除済み~~） |
| Children | 5 | 卒園管理、血液型、出席記録 |
| Staff | 7 | 詳細情報、入退社管理、緊急連絡先 |
| StaffClassAssignments | 5 | 年度別クラス割り当て、年度スライド管理（複合主キー変更含む） |
| AbsenceNotifications | 3 | 管理者確認、スタッフ対応記録 |
| DailyReports | 1 | 管理者作成記録 |
| Photos | 1 | 管理者アップロード記録 |
| Announcements | 1 | 管理者作成記録 |

**合計: 30カラム（既存テーブル拡張）**
※ StaffClassAssignments: 3カラム→5カラムに増加（IsCurrent, IsFuture追加）

### 8.2 新規テーブルのサマリー（承認済み）

| テーブル名 | 主な目的 |
|-----------|---------|
| AcademicYears | 年度管理、年度切り替え |
| ChildClassAssignments | 園児のクラス所属履歴（過去・現在・未来）、年度スライド管理 |
| PromotionHistory | 進級履歴の記録 |
| AuditLogs | 操作ログ、セキュリティ監査 |
| DailyAttendances | 日次出欠状況の記録・管理 |
| ApplicationWork | 入園申込ワークテーブル（保護者Web申込の一時保管） *(2025-12-08追加)* |
| NurseryDayTypes | 休園日・休日保育管理 *(2026-02-01追加)* |

**合計: 7テーブル(新規作成)**

**設計方針の変更**: 
- **AttendanceStatisticsテーブルは不要**: 出席統計はDailyAttendancesテーブルから直接リアルタイムで計算します
- **バッチ処理なし**: 日次・月次・年度バッチ処理による事前計算は行いません
- **リアルタイム集計**: 画面上で条件(年度、月、クラスなど)を入力し、その場でSQLクエリを発行してリアルタイムな統計値を表示する設計です

### 8.3 次のステップ

データベース拡張設計が完了しました。次は以下のいずれかに進むことをお勧めします：

1. **マイグレーションスクリプトの実装**
2. **API設計書の作成**（デスクトップアプリ専用エンドポイント）
3. **Entity Framework Core のDbContext更新**

どれから進めますか？

---

## 9. 献立管理機能のテーブル設計 *(2026-01-01追加)*

### 9.1 概要

給食・おやつ（午前・午後）の献立を登録し、保護者が閲覧できる機能を実装します。アレルギー対応として、食材ごとにアレルゲン情報を管理し、保護者の子供のアレルギーに該当する食材を自動的にハイライト表示します。

### 9.2 テーブル構成

#### 9.2.1 AllergenMaster（アレルゲンマスター）

28項目の特定原材料・特定原材料に準ずるものを一元管理

```sql
create table [dbo].[AllergenMaster] (
  [Id] int identity not null
  , [AllergenName] nvarchar(50) not null
  , [SortOrder] int not null
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
)

-- インデックス
create index IX_AllergenMaster_SortOrder on [dbo].[AllergenMaster]([SortOrder])

-- 主キー
alter table [dbo].[AllergenMaster] add constraint [PK__AllergenMaster] primary key ([Id])
```

**カラム説明**:
- `Id`: アレルゲンID（主キー）
- `AllergenName`: アレルゲン名（例：卵、牛乳・乳製品、小麦）
- `SortOrder`: 表示順
- `CreatedAt`: 作成日時

**初期データ（28項目）**:
```
卵、牛乳・乳製品、小麦、そば、落花生（ピーナッツ）、えび、かに、アーモンド、
あわび、いか、いくら、オレンジ、カシューナッツ、キウイフルーツ、牛肉、くるみ、
ごま、さけ、さば、大豆、鶏肉、バナナ、豚肉、まつたけ、もも、やまいも、りんご、ゼラチン
```

#### 9.2.2 MenuMaster（献立マスター）

よく使う献立の再利用可能なテンプレート

**設計方針**:
- MenuTypeカラムは削除（献立は種類に関係なく使い回し可能）
- 例：「みかん」はおやつでも給食のデザートでも使用可能

```sql
create table [dbo].[MenuMaster] (
  [Id] int identity not null
  , [NurseryId] int not null
  , [MenuName] nvarchar(200) not null
  , [IngredientName] nvarchar(200)
  , [Allergens] nvarchar(200)
  , [Description] nvarchar(500)
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , [UpdatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
)

-- インデックス
create index IX_MenuMaster_NurseryId on [dbo].[MenuMaster]([NurseryId])
create index IX_MenuMaster_MenuName on [dbo].[MenuMaster]([MenuName])

-- 主キー
alter table [dbo].[MenuMaster] add constraint [PK__MenuMaster] primary key ([Id])
```

**カラム説明**:
- `Id`: 献立ID（主キー）
- `NurseryId`: 保育園ID
- `MenuName`: 献立名（例：カレーライス、白身魚のフライ、みかん）
- `IngredientName`: 食材名（例：豚肉、じゃがいも、カレールウ）
- `Allergens`: アレルゲン（カンマ区切りID：例：3,28 → 小麦,ゼラチン）
- `Description`: 説明・備考
- `CreatedAt`: 作成日時
- `UpdatedAt`: 更新日時

**設計変更の経緯**:
- 2025-12-31以前: MenuMasterIngredientsテーブルを削除し、食材とアレルゲン情報はMenuMasterテーブルに直接格納
- 2026-01-01: MenuTypeカラムを削除（献立は種類を問わず使い回し可能に）

#### 9.2.3 DailyMenus（日別献立）

実際に提供する日別の献立

**設計方針**:
- 1日に複数献立を登録可能（例：給食でカレーライス、サラダ、スープ、みかんの4品）
- 献立の詳細情報（食材、アレルゲン）はMenuMasterから参照
- SortOrderで同じ日・同じ種類内での表示順を管理

```sql
create table [dbo].[DailyMenus] (
  [Id] int identity not null
  , [NurseryId] int not null
  , [MenuDate] date not null
  , [MenuType] nvarchar(50) not null
  , [MenuMasterId] int not null
  , [SortOrder] int not null default 0
  , [Notes] nvarchar(500)
  , [CreatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , [UpdatedAt] datetime2 default [dbo].[GetJstDateTime]() not null
  , constraint FK_DailyMenus_MenuMaster foreign key ([MenuMasterId]) references [dbo].[MenuMaster]([Id])
)

-- インデックス
create index IX_DailyMenus_NurseryId on [dbo].[DailyMenus]([NurseryId])
create index IX_DailyMenus_MenuDate on [dbo].[DailyMenus]([MenuDate])
create index IX_DailyMenus_MenuType on [dbo].[DailyMenus]([MenuType])
create index IX_DailyMenus_NurseryDate on [dbo].[DailyMenus]([NurseryId], [MenuDate])
create index IX_DailyMenus_MenuMasterId on [dbo].[DailyMenus]([MenuMasterId])
create index IX_DailyMenus_SortOrder on [dbo].[DailyMenus]([SortOrder])

-- 主キー
alter table [dbo].[DailyMenus] add constraint [PK__DailyMenus] primary key ([Id])

-- ユニーク制約: 同じ日・同じタイプで同じ献立マスターは重複不可
alter table [dbo].[DailyMenus] add constraint UQ_DailyMenus_Date_Type_Master unique ([NurseryId], [MenuDate], [MenuType], [MenuMasterId])
```

**カラム説明**:
- `Id`: 日別献立ID（主キー）
- `NurseryId`: 保育園ID
- `MenuDate`: 提供日
- `MenuType`: 種類（`Lunch`/`MorningSnack`/`AfternoonSnack`）
- `MenuMasterId`: 献立マスターID（必須、MenuMasterを参照）
- `SortOrder`: 表示順（同じ日・種類内での並び順、0から始まる連番）
- `Notes`: 当日の特記事項（任意）
- `CreatedAt`: 作成日時
- `UpdatedAt`: 更新日時

**ビジネスルール**:
- 1日1タイプに複数献立を登録可能（例：給食で4品、午前おやつで2品）
- MenuMasterIdは必須（カスタム献立を登録する場合、まずMenuMasterに登録してから使用）
- 同じ日・同じタイプで同じMenuMasterIdは重複不可（ユニーク制約で保証）
- 献立の詳細（食材、アレルゲン）はMenuMasterから取得（DailyMenusには保持しない）

**設計変更の経緯**:
- 2025-12-31以前: CustomMenuName, IngredientName, Allergens, Descriptionカラムを保持
- 2026-01-01:
  - CustomMenuNameを削除、MenuMasterIdを必須化（常に献立マスター経由）
  - IngredientName, Allergens, Descriptionを削除（MenuMasterから参照）
  - SortOrderを追加（1日複数献立対応）
  - ユニーク制約追加（同じ日・タイプで同じ献立の重複防止）

### 9.3 データ整合性とビジネスルール

#### 9.3.1 アレルゲン管理
- `AllergenMaster`に登録された28項目のアレルゲンを基準とする
- `ChildAllergy`フィールド（Children/ApplicationWorksテーブル）とアレルゲン形式を統一
  - 両方ともカンマ区切り文字列（例：`卵、牛乳・乳製品、小麦`）
- フロントエンドでは`AllergenMaster`を参照してチェックボックスUI生成

#### 9.3.2 献立マスターと日別献立の関係
- **献立マスター**: 再利用可能な献立データ（例：カレーライス、サラダ、みかん）
- **日別献立**: 実際の提供予定（MenuMasterへの参照のみ）
- 日別献立を登録する際、新しい献立名を入力した場合は自動的にMenuMasterに登録
- 既存の献立名はオートコンプリートで選択可能
- 献立の詳細（食材、アレルゲン）は常にMenuMasterから参照

#### 9.3.3 複数献立登録と表示順
- 1日の同じ種類（Lunch/MorningSnack/AfternoonSnack）に複数献立を登録可能
- SortOrderで表示順を管理（0, 1, 2, ...）
- 例：給食 = カレーライス(0) + サラダ(1) + スープ(2) + みかん(3)
- ユニーク制約により、同じ日・同じタイプで同じMenuMasterIdの重複は不可

#### 9.3.4 献立マスターの自動登録フロー
1. ユーザーが日別献立画面で献立名をオートコンプリート入力
2. 既存の献立名にマッチしない場合、「新しい献立『〇〇』を登録」を表示
3. 選択すると献立登録モーダルを表示（献立名、食材、アレルゲン入力）
4. MenuMasterに登録後、自動的に日別献立に追加

### 9.4 保護者向けアレルギーハイライト機能

#### 9.4.1 ハイライト表示の仕組み
1. 子供の`ChildAllergy`フィールドを取得（例：`豚肉、牛乳・乳製品`）
2. 日別献立の各食材の`Allergens`フィールドと照合
3. 一致するアレルゲンがある食材を赤文字＋⚠️マークで表示
4. 献立カード全体に警告バッジを表示

#### 9.4.2 表示例（保護者アプリ）
```
🍽️ 給食: カレーライス
  使用食材:
  • 豚肉 ⚠️ (豚肉)          ← 赤文字＋警告マーク
  • じゃがいも
  • にんじん
  • 玉ねぎ
  • カレールウ ⚠️ (小麦、乳) ← 赤文字＋警告マーク

  ┌────────────────────────────┐
  │ ⚠️ お子様のアレルギーに      │
  │    該当する食材が含まれています│
  └────────────────────────────┘
```

### 9.5 テーブル一覧サマリー

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| AllergenMaster | アレルゲンマスター（28項目） | Id, AllergenName, SortOrder |
| MenuMaster | 献立マスター | Id, NurseryId, MenuName, IngredientName, Allergens |
| DailyMenus | 日別献立 | Id, NurseryId, MenuDate, MenuType, MenuMasterId, SortOrder |

**合計: 3テーブル(献立管理機能)**

**削除されたテーブル**:
- MenuMasterIngredients（MenuMasterに統合、2025-12-31削除）
- DailyMenuIngredients（2026-01-01削除、MenuMaster参照方式に変更）

### 9.6 実装フェーズ

#### Phase 1: データベース基盤（1-2日）
- [x] テーブル作成スクリプト作成（`create_menu_tables.sql`）
- [ ] Azure SQL Databaseでスクリプト実行
- [ ] AllergenMaster初期データ投入確認（28件）

#### Phase 2: バックエンドAPI（3-4日）
- [ ] Entity Frameworkモデル作成
- [ ] AllergenMaster取得API
- [ ] MenuMaster CRUD API
- [ ] DailyMenu CRUD API

#### Phase 3: デスクトップUI（4-5日）
- [ ] 献立マスター管理画面
- [ ] 日別献立編集画面
- [ ] 食材追加UI（アレルゲンチェックボックス）

#### Phase 4: 保護者閲覧機能（3-4日）
- [ ] 献立カレンダー画面（スマホ）
- [ ] 献立詳細画面（アレルギーハイライト）

#### Phase 5: 既存機能の統合（2-3日）
- [ ] 申込フォームの食物アレルギーをAllergenMasterから動的生成
- [ ] デスクトップ申込詳細画面のアレルギー表示をAllergenMasterから取得

---

## 10. 献立管理機能とアレルギー管理の統合

### 10.1 ChildAllergyフィールドの統一

既存の`Children`テーブルおよび`ApplicationWorks`テーブルの`ChildAllergy`フィールドは、現在28項目のチェックボックスから生成されるカンマ区切り文字列です。献立管理機能でも同じ形式を採用することで、システム全体でアレルギー管理を統一します。

#### 現在の実装（ハードコード）
```typescript
// ApplicationFormPage.tsx
const allergyItems = [
  '卵', '牛乳・乳製品', '小麦', 'そば', '落花生（ピーナッツ）',
  'えび', 'かに', 'アーモンド', // ... 28項目
];
```

#### 新しい実装（AllergenMasterから動的取得）
```typescript
// AllergenMasterから取得
const allergyItems = await fetchAllergens(); // API呼び出し
// → ['卵', '牛乳・乳製品', '小麦', ...] （28項目）
```

### 10.2 影響範囲

#### 変更が必要な画面・コンポーネント
1. **申込フォーム**（`ApplicationFormPage.tsx`）
   - 食物アレルギーチェックボックスを動的生成
   - AllergenMaster APIから取得したデータで生成

2. **デスクトップ申込詳細画面**（`ApplicationDetailModal.tsx`）
   - アレルギー情報表示部分
   - カンマ区切り文字列をそのまま表示（変更不要の可能性）

3. **園児編集画面**（`ChildEditModal.tsx`）
   - 食物アレルギーチェックボックス（現在は未実装？）
   - 今後AllergenMasterから動的生成する

### 10.3 データフロー

```
[AllergenMaster DB]
       ↓ (GET /api/allergens)
[フロントエンド]
       ↓ (チェックボックス生成)
[ユーザー選択: 卵、牛乳・乳製品、小麦]
       ↓ (カンマ区切り文字列化)
[ApplicationWorks.ChildAllergy = "卵、牛乳・乳製品、小麦"]
       ↓ (保存)
[Azure SQL Database]
```

### 10.4 実装優先順位

1. **高優先度**: 申込フォームのAllergenMaster連携（保護者が直接使用）
2. **中優先度**: デスクトップ申込詳細のAllergenMaster参照
3. **低優先度**: 園児編集画面のAllergenMaster連携（将来対応）
