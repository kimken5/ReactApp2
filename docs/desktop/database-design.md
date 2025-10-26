# デスクトップWebアプリ データベース拡張設計書

## 概要

本設計書では、保育園管理デスクトップWebアプリに必要なデータベース拡張を定義します。モバイルアプリと同一のAzure SQL Databaseを使用し、既存テーブルへの項目追加と新規テーブルの作成を行います。

**本設計書の内容は承認済みです。**
- 既存テーブル拡張: 9テーブルに合計28カラムを追加
- 新規テーブル作成: 4テーブル（年度管理、進級履歴、監査ログ、出席統計）

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

**追加理由**: 年度管理、過去クラスの履歴管理に必要

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Classes ADD
    AcademicYear INT NOT NULL DEFAULT YEAR(GETDATE()),  -- 年度
    IsActive BIT NOT NULL DEFAULT 1;  -- 有効/無効フラグ

-- インデックス追加
CREATE INDEX IX_Classes_AcademicYear ON Classes (NurseryId, AcademicYear);
CREATE INDEX IX_Classes_IsActive ON Classes (NurseryId, IsActive) WHERE IsActive = 1;

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '年度（西暦）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'AcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ（年度終了後は無効化）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'IsActive';
```

**ビジネスルール**
- 同一年度内でClassIdは一意
- IsActive=0のクラスは過去年度のクラスとして保持

### 1.3 Children テーブル拡張

**追加理由**: 卒園管理、血液型管理、出席記録に必要

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE Children ADD
    GraduationDate DATE NULL,  -- 卒園日
    GraduationStatus NVARCHAR(20) NULL,  -- 卒園ステータス（Graduated/Withdrawn）
    WithdrawalReason NVARCHAR(200) NULL,  -- 退園理由
    BloodType NVARCHAR(5) NULL,  -- 血液型（A/B/O/AB）
    LastAttendanceDate DATE NULL;  -- 最終登園日

-- インデックス追加
CREATE INDEX IX_Children_GraduationDate ON Children (NurseryId, GraduationDate) WHERE GraduationDate IS NOT NULL;
CREATE INDEX IX_Children_IsActive_Class ON Children (NurseryId, IsActive, ClassId);
CREATE INDEX IX_Children_LastAttendanceDate ON Children (NurseryId, LastAttendanceDate) WHERE LastAttendanceDate IS NOT NULL;

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '卒園日', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'GraduationDate';
EXEC sp_addextendedproperty 'MS_Description', '卒園ステータス', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'GraduationStatus';
EXEC sp_addextendedproperty 'MS_Description', '退園理由', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'WithdrawalReason';
EXEC sp_addextendedproperty 'MS_Description', '血液型', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'BloodType';
EXEC sp_addextendedproperty 'MS_Description', '最終登園日', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'LastAttendanceDate';
```

**ビジネスルール**
- IsActive=0かつGraduationStatusがNULLの場合は「在籍中だが休園中」
- GraduationStatus='Graduated'の場合は卒園
- GraduationStatus='Withdrawn'の場合は途中退園

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

### 1.5 StaffClassAssignments テーブル拡張

**追加理由**: 年度別のクラス割り当て管理

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE StaffClassAssignments ADD
    AcademicYear INT NOT NULL DEFAULT YEAR(GETDATE()),  -- 年度
    IsActive BIT NOT NULL DEFAULT 1,  -- 有効フラグ
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE();  -- 割り当て日時

-- インデックス追加
CREATE INDEX IX_StaffClassAssignments_AcademicYear ON StaffClassAssignments (NurseryId, AcademicYear);
CREATE INDEX IX_StaffClassAssignments_IsActive ON StaffClassAssignments (NurseryId, IsActive) WHERE IsActive = 1;

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '年度（西暦）', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'AcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '割り当て日時', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'AssignedAt';
```

**ビジネスルール**
- 同一年度内で有効なStaff-Class割り当ては重複不可
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

### 1.7 DailyReports テーブル拡張

**追加理由**: 管理者による代理作成記録

```sql
-- 既存テーブルに以下のカラムを追加
ALTER TABLE DailyReports ADD
    CreatedByAdminUser BIT NOT NULL DEFAULT 0;  -- 管理者作成フラグ

-- インデックス追加
CREATE INDEX IX_DailyReports_CreatedByAdminUser ON DailyReports (CreatedByAdminUser);

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '管理者作成フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'CreatedByAdminUser';
```

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
CREATE TABLE AcademicYears (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    Year INT NOT NULL,  -- 年度（西暦）
    StartDate DATE NOT NULL,  -- 年度開始日（通常4月1日）
    EndDate DATE NOT NULL,  -- 年度終了日（通常3月31日）
    IsCurrent BIT NOT NULL DEFAULT 0,  -- 現在年度フラグ
    IsArchived BIT NOT NULL DEFAULT 0,  -- アーカイブ済みフラグ
    ArchivedAt DATETIME2 NULL,  -- アーカイブ日時
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- インデックス作成
CREATE INDEX IX_AcademicYears_NurseryId_IsCurrent ON AcademicYears (NurseryId, IsCurrent) WHERE IsCurrent = 1;
CREATE INDEX IX_AcademicYears_NurseryId_Year ON AcademicYears (NurseryId, Year);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '年度管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '年度ID', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '年度（西暦）', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'Year';
EXEC sp_addextendedproperty 'MS_Description', '年度開始日', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'StartDate';
EXEC sp_addextendedproperty 'MS_Description', '年度終了日', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'EndDate';
EXEC sp_addextendedproperty 'MS_Description', '現在年度フラグ', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'IsCurrent';
EXEC sp_addextendedproperty 'MS_Description', 'アーカイブ済みフラグ', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'IsArchived';
EXEC sp_addextendedproperty 'MS_Description', 'アーカイブ日時', 'SCHEMA', 'dbo', 'TABLE', 'AcademicYears', 'COLUMN', 'ArchivedAt';
```

**ビジネスルール**
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

### 2.4 AttendanceStatistics（出席統計キャッシュ）

**目的**: 出席状況レポートのパフォーマンス向上のため、日次・月次集計データをキャッシュ

```sql
CREATE TABLE AttendanceStatistics (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    ChildId INT NULL,  -- 園児別統計の場合はChildId、クラス別統計の場合はNULL
    ClassId NVARCHAR(50) NULL,  -- クラス別統計の場合はClassId
    AcademicYear INT NOT NULL,  -- 年度
    Month INT NULL,  -- 月（1-12）、年度全体の場合はNULL
    Date DATE NULL,  -- 日付、月次・年度全体の場合はNULL
    StatisticType NVARCHAR(20) NOT NULL,  -- 集計種別（Daily/Monthly/Yearly）
    TotalDays INT NOT NULL DEFAULT 0,  -- 総日数
    PresentDays INT NOT NULL DEFAULT 0,  -- 出席日数
    AbsentDays INT NOT NULL DEFAULT 0,  -- 欠席日数
    TardyDays INT NOT NULL DEFAULT 0,  -- 遅刻日数
    AttendanceRate DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 出席率
    LastCalculatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),  -- 最終計算日時
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL
);

-- インデックス作成
CREATE INDEX IX_AttendanceStatistics_Child ON AttendanceStatistics (NurseryId, ChildId, AcademicYear) WHERE ChildId IS NOT NULL;
CREATE INDEX IX_AttendanceStatistics_Class ON AttendanceStatistics (NurseryId, ClassId, AcademicYear) WHERE ClassId IS NOT NULL;
CREATE INDEX IX_AttendanceStatistics_AcademicYear_Month ON AttendanceStatistics (NurseryId, AcademicYear, Month);
CREATE INDEX IX_AttendanceStatistics_Type ON AttendanceStatistics (StatisticType);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '出席統計キャッシュテーブル', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '統計ID', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', 'クラスID', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', '年度', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'AcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '月', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'Month';
EXEC sp_addextendedproperty 'MS_Description', '日付', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'Date';
EXEC sp_addextendedproperty 'MS_Description', '集計種別', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'StatisticType';
EXEC sp_addextendedproperty 'MS_Description', '総日数', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'TotalDays';
EXEC sp_addextendedproperty 'MS_Description', '出席日数', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'PresentDays';
EXEC sp_addextendedproperty 'MS_Description', '欠席日数', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'AbsentDays';
EXEC sp_addextendedproperty 'MS_Description', '遅刻日数', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'TardyDays';
EXEC sp_addextendedproperty 'MS_Description', '出席率', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'AttendanceRate';
EXEC sp_addextendedproperty 'MS_Description', '最終計算日時', 'SCHEMA', 'dbo', 'TABLE', 'AttendanceStatistics', 'COLUMN', 'LastCalculatedAt';
```

**更新タイミング**
- 日次統計: 毎日深夜0時にバッチ処理で更新
- 月次統計: 月末に計算
- 年度統計: 年度末に計算

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

### Phase 4: 新規テーブル作成（履歴・集計系）
12. PromotionHistory テーブル作成
13. AttendanceStatistics テーブル作成

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

### 4.2 Classesテーブルへの年度情報追加

```sql
-- 既存のClassesレコードに現在年度を設定
UPDATE Classes
SET AcademicYear = YEAR(GETDATE())
WHERE AcademicYear IS NULL OR AcademicYear = 0;
```

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

```sql
CREATE VIEW v_ChildAttendanceSummary AS
SELECT
    ast.NurseryId,
    ast.ChildId,
    c.Name AS ChildName,
    c.ClassId,
    cl.Name AS ClassName,
    ast.AcademicYear,
    SUM(ast.PresentDays) AS TotalPresentDays,
    SUM(ast.AbsentDays) AS TotalAbsentDays,
    SUM(ast.TardyDays) AS TotalTardyDays,
    AVG(ast.AttendanceRate) AS AverageAttendanceRate
FROM AttendanceStatistics ast
INNER JOIN Children c ON ast.NurseryId = c.NurseryId AND ast.ChildId = c.ChildId
INNER JOIN Classes cl ON c.NurseryId = cl.NurseryId AND c.ClassId = cl.ClassId
WHERE ast.StatisticType = 'Monthly' AND ast.ChildId IS NOT NULL
GROUP BY ast.NurseryId, ast.ChildId, c.Name, c.ClassId, cl.Name, ast.AcademicYear;
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

### 6.2 sp_CalculateAttendanceStatistics（出席統計計算）

```sql
CREATE PROCEDURE sp_CalculateAttendanceStatistics
    @NurseryId INT,
    @AcademicYear INT,
    @Month INT = NULL  -- NULLの場合は年度全体を計算
AS
BEGIN
    SET NOCOUNT ON;

    -- 園児別月次統計を計算
    IF @Month IS NOT NULL
    BEGIN
        MERGE INTO AttendanceStatistics AS target
        USING (
            SELECT
                @NurseryId AS NurseryId,
                an.ChildId,
                NULL AS ClassId,
                @AcademicYear AS AcademicYear,
                @Month AS Month,
                NULL AS Date,
                'Monthly' AS StatisticType,
                COUNT(DISTINCT CAST(an.Ymd AS DATE)) AS TotalDays,
                SUM(CASE WHEN an.NotificationType <> 'absence' THEN 1 ELSE 0 END) AS PresentDays,
                SUM(CASE WHEN an.NotificationType = 'absence' THEN 1 ELSE 0 END) AS AbsentDays,
                SUM(CASE WHEN an.NotificationType = 'lateness' THEN 1 ELSE 0 END) AS TardyDays,
                CAST(SUM(CASE WHEN an.NotificationType <> 'absence' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(DISTINCT CAST(an.Ymd AS DATE)), 0) * 100 AS DECIMAL(5,2)) AS AttendanceRate
            FROM AbsenceNotifications an
            WHERE an.NurseryId = @NurseryId
                AND YEAR(an.Ymd) = @AcademicYear
                AND MONTH(an.Ymd) = @Month
            GROUP BY an.ChildId
        ) AS source
        ON target.NurseryId = source.NurseryId
            AND target.ChildId = source.ChildId
            AND target.AcademicYear = source.AcademicYear
            AND target.Month = source.Month
            AND target.StatisticType = 'Monthly'
        WHEN MATCHED THEN
            UPDATE SET
                target.TotalDays = source.TotalDays,
                target.PresentDays = source.PresentDays,
                target.AbsentDays = source.AbsentDays,
                target.TardyDays = source.TardyDays,
                target.AttendanceRate = source.AttendanceRate,
                target.LastCalculatedAt = GETUTCDATE(),
                target.UpdatedAt = GETUTCDATE()
        WHEN NOT MATCHED THEN
            INSERT (NurseryId, ChildId, ClassId, AcademicYear, Month, Date, StatisticType, TotalDays, PresentDays, AbsentDays, TardyDays, AttendanceRate)
            VALUES (source.NurseryId, source.ChildId, source.ClassId, source.AcademicYear, source.Month, source.Date, source.StatisticType, source.TotalDays, source.PresentDays, source.AbsentDays, source.TardyDays, source.AttendanceRate);
    END
END;
```

**変更点**:
- `an.StartDate` → `an.Ymd` (実際のカラム名に修正)
- `an.Type` → `an.NotificationType` (実際のカラム名に修正)
- `COUNT(DISTINCT CAST(an.Ymd AS DATE))` で日付部分のみを集計
- `NULLIF(..., 0)` を追加してゼロ除算を防止

**注意**: AbsenceNotificationsテーブルの実際のカラム構造:
- `Ymd` (DATETIME2): 連絡対象日（欠席・遅刻の日付）
- `NotificationType` (NVARCHAR(20)): 'absence' | 'lateness' | 'pickup'
- `Status` (NVARCHAR(20)): 'submitted' | 'acknowledged'

## 7. Entity Framework Core エンティティクラス

### 7.1 AcademicYear.cs

```csharp
public class AcademicYear
{
    public int Id { get; set; }
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

### 7.4 AttendanceStatistic.cs

```csharp
public class AttendanceStatistic
{
    public int Id { get; set; }
    public int NurseryId { get; set; }
    public int? ChildId { get; set; }
    public string? ClassId { get; set; }
    public int AcademicYear { get; set; }
    public int? Month { get; set; }
    public DateTime? Date { get; set; }
    public string StatisticType { get; set; }  // "Daily", "Monthly", "Yearly"
    public int TotalDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int TardyDays { get; set; }
    public decimal AttendanceRate { get; set; }
    public DateTime LastCalculatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

## 8. まとめ

### 8.1 追加項目のサマリー（承認済み）

| テーブル | 追加カラム数 | 主な目的 |
|---------|------------|---------|
| Nurseries | 5 | ログイン認証、セキュリティ、年度管理 |
| Classes | 2 | 年度管理、有効/無効フラグ |
| Children | 5 | 卒園管理、血液型、出席記録 |
| Staff | 7 | 詳細情報、入退社管理、緊急連絡先 |
| StaffClassAssignments | 3 | 年度別クラス割り当て |
| AbsenceNotifications | 3 | 管理者確認、スタッフ対応記録 |
| DailyReports | 1 | 管理者作成記録 |
| Photos | 1 | 管理者アップロード記録 |
| Announcements | 1 | 管理者作成記録 |

**合計: 28カラム（既存テーブル拡張）**

### 8.2 新規テーブルのサマリー（承認済み）

| テーブル名 | 主な目的 |
|-----------|---------|
| AcademicYears | 年度管理、年度切り替え |
| PromotionHistory | 進級履歴の記録 |
| AuditLogs | 操作ログ、セキュリティ監査 |
| AttendanceStatistics | 出席統計の高速化 |

**合計: 4テーブル（新規作成）**

### 8.3 次のステップ

データベース拡張設計が完了しました。次は以下のいずれかに進むことをお勧めします：

1. **マイグレーションスクリプトの実装**
2. **API設計書の作成**（デスクトップアプリ専用エンドポイント）
3. **Entity Framework Core のDbContext更新**

どれから進めますか？
