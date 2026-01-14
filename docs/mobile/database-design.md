# データベース設計書 - 保育園保護者向けモバイルアプリ

## 1. データベース設計概要

### 1.1 設計原則
- **正規化**: 第3正規形まで正規化し、データの整合性を保証
- **パフォーマンス**: 適切なインデックス設計によるクエリ最適化
- **拡張性**: 将来的な機能追加に対応できる柔軟な設計
- **セキュリティ**: 個人情報保護とアクセス制御の組み込み
- **整合性**: 制約条件による データ整合性保証

### 1.2 データベース構成
- **主データベース**: SQL Server (Azure SQL Database / AWS RDS)
- **キャッシュ**: Redis (セッション・一時データ)
- **ファイルストレージ**: Azure Blob Storage / AWS S3 (写真・ドキュメント)
- **バックアップ**: Point-in-time recovery対応、日次フルバックアップ

## 2. エンティティ関係図 (ERD)

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     Nursery     │         │      Class      │         │      Staff      │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ Id (PK)         │◄────────┤ NurseryId (PK)  │◄────────┤ NurseryId (PK)  │
│ Name            │         │ ClassId (PK)    │         │ StaffId (PK)    │
│ Address         │         │ Name            │         │ Name            │
│ PhoneNumber     │         │ AgeGroupMin     │         │ PhoneNumber     │
│ Email           │         │ AgeGroupMax     │         │ Email           │
│ PrincipalName   │         │ MaxCapacity     │         │ Role            │
│ EstablishedDate │         │ CreatedAt       │         │ Position        │
│ LogoUrl         │         │ UpdatedAt       │         │ IsActive        │
│ CreatedAt       │         │ IsActive        │         │ LastLoginAt     │
│ UpdatedAt       │         └─────────────────┘         └─────────────────┘
└─────────────────┘                 │ ▲                         │
                                    │ │                         │
                                    │ └─────────────────────────┘
                                    │  ┌────────────────────────────────────┐
                                    │  │   StaffClassAssignments (多対多)   │
                                    │  ├────────────────────────────────────┤
                                    │  │ NurseryId (PK, FK)                 │
                                    │  │ StaffId (PK, FK)                   │
                                    │  │ ClassId (PK, FK)                   │
                                    │  │ AssignmentRole (MainT/AssistantT)  │
                                    │  └────────────────────────────────────┘
                                    ▼
                            ┌─────────────────┐
                            │      Child      │
                            ├─────────────────┤
                            │ Id (PK)         │
                            │ FirstName       │
                            │ LastName        │
                            │ DateOfBirth     │
                            │ NurseryId (FK)  │
                            │ ClassId (FK)    │
                            └─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │   ParentChildRelationship       │
                    ├─────────────────────────────────┤
                    │ ParentId (PK, FK)               │
                    │ ChildId (PK, FK)                │
                    │ RelationshipType                │
                    │ IsPrimaryContact                │
                    │ IsAuthorizedPickup              │
                    │ CanReceiveReports               │
                    │ CreatedAt                       │
                    └─────────────────────────────────┘
                                    │
                                    ▼
                            ┌─────────────────┐
                            │     Parent      │
                            ├─────────────────┤
                            │ Id (PK)         │
                            │ PhoneNumber     │
                            │ Name            │
                            │ Email           │
                            │ Address         │
                            │ NurseryId (FK)  │◄─┐
                            │ IsActive        │  │
                            │ CreatedAt       │  │
                            │ UpdatedAt       │  │
                            │ LastLoginAt     │  │
                            └─────────────────┘  │
                                               │
    ┌──────────────────────────────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│SmsAuthentication│    │ContactNotificatn│    │   DailyReport   │    │      Event      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Id (PK)         │    │ Id (PK)         │    │ Id (PK)         │    │ Id (PK)         │
│ PhoneNumber     │    │ ChildId (FK)    │    │ ChildId (FK)    │    │ Title           │
│ AuthCode        │    │ Type            │    │ ReportDate      │    │ Description     │
│ CreatedAt       │    │ TargetDate      │    │ Type            │    │ Category        │
│ ExpiresAt       │    │ Reason          │    │ Content         │    │ StartDateTime   │
│ IsUsed          │    │ PickupPerson    │    │ StaffMember     │    │ EndDateTime     │
│ AttemptCount    │    │ PickupTime      │    └─────────────────┘    │ IsRecurring     │
│ IpAddress       │    │ ExpArrivalTime  │                         │ RecurrPattern   │
└─────────────────┘    │ AdditionalNotes │                         └─────────────────┘
                       │ Status          │
                       └─────────────────┘
                                                           
┌─────────────────┐    ┌─────────────────┐
│      Photo      │    │ FamilyRegistration│
├─────────────────┤    ├─────────────────┤
│ Id (PK)         │    │ Id (PK)         │
│ ChildId (FK)    │    │ InviterId (FK)  │
│ FileName        │    │ InviteePhone    │
│ OriginalUrl     │    │ InviteeFirstName│
│ ThumbnailUrl    │    │ InviteeLastName │
│ ActivityType    │    │ RelationshipType│
│ CapturedDate    │    │ InvitationCode  │
│ StaffMember     │    │ CreatedAt       │
└─────────────────┘    │ ExpiresAt       │
                       │ Status          │
                       │ AcceptedParentId│
                       └─────────────────┘
```

## 3. テーブル詳細設計

### 3.1 基本マスタテーブル

#### 3.1.1 Nurseries (保育園)
```sql
CREATE TABLE Nurseries (
    Id INT PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    LoginID NVARCHAR(10) NULL,
    Password NVARCHAR(255) NULL,
    Address NVARCHAR(500) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PrincipalName NVARCHAR(100) NOT NULL,
    EstablishedDate DATETIME2 NOT NULL,
    ApplicationKey NVARCHAR(50) NULL,
    LastLoginAt DATETIME2 NULL,
    KeyLockCode NVARCHAR(4) NOT NULL,
    LoginAttempts INT NOT NULL DEFAULT 0,
    IsLocked BIT NOT NULL DEFAULT 0,
    LockedUntil DATETIME2 NULL,
    CurrentAcademicYear INT NOT NULL DEFAULT DATEPART(YEAR, GETDATE()),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    UpdatedAt DATETIME2,

    CONSTRAINT UK_Nurseries_PhoneNumber UNIQUE (PhoneNumber),
    CONSTRAINT UK_Nurseries_Email UNIQUE (Email)
);

-- インデックスの作成
CREATE INDEX IX_Nurseries_Name ON Nurseries (Name);
CREATE INDEX IX_Nurseries_LoginID ON Nurseries (LoginID);
CREATE INDEX IX_Nurseries_CurrentAcademicYear ON Nurseries (CurrentAcademicYear);

-- テーブルコメント
EXEC sp_addextendedproperty 'MS_Description', '保育園マスタ', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries';

-- カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園名', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', 'ログインID', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LoginID';
EXEC sp_addextendedproperty 'MS_Description', 'パスワード', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Password';
EXEC sp_addextendedproperty 'MS_Description', '住所', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Address';
EXEC sp_addextendedproperty 'MS_Description', '電話番号', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', 'メールアドレス', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Email';
EXEC sp_addextendedproperty 'MS_Description', '園長名', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'PrincipalName';
EXEC sp_addextendedproperty 'MS_Description', '設立日', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'EstablishedDate';
EXEC sp_addextendedproperty 'MS_Description', '入園申込キー', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'ApplicationKey';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LastLoginAt';
EXEC sp_addextendedproperty 'MS_Description', 'キーロックコード', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'KeyLockCode';
EXEC sp_addextendedproperty 'MS_Description', 'ログイン試行回数', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LoginAttempts';
EXEC sp_addextendedproperty 'MS_Description', 'アカウントロック状態', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'IsLocked';
EXEC sp_addextendedproperty 'MS_Description', 'ロック解除日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LockedUntil';
EXEC sp_addextendedproperty 'MS_Description', '現在の年度', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'CurrentAcademicYear';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'UpdatedAt';
```

#### 3.1.2 Classes (クラス)
```sql
-- クラス情報管理テーブル
-- 複合主キー: (NurseryId, ClassId)
CREATE TABLE Classes (
    NurseryId INT NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    Name NVARCHAR(50) NOT NULL,
    AgeGroupMin INT NOT NULL,
    AgeGroupMax INT NOT NULL,
    MaxCapacity INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,
    IsActive BIT NOT NULL DEFAULT 1,

    CONSTRAINT PK_Classes PRIMARY KEY (NurseryId, ClassId),
    CONSTRAINT FK_Classes_Nurseries FOREIGN KEY (NurseryId) REFERENCES Nurseries(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Classes_NurseryId ON Classes (NurseryId);
CREATE INDEX IX_Classes_IsActive ON Classes (IsActive) WHERE IsActive = 1;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'クラス情報管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'Classes';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID（複合主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', 'クラスID（複合主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', 'クラス名', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', '年齢グループ最小値', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'AgeGroupMin';
EXEC sp_addextendedproperty 'MS_Description', '年齢グループ最大値', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'AgeGroupMax';
EXEC sp_addextendedproperty 'MS_Description', '最大定員数', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'MaxCapacity';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '有効/無効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'IsActive';
```

#### 3.1.3 Parents (保護者)
```sql
-- 保護者マスタテーブル
-- 複合ユニーク制約: (PhoneNumber, NurseryId) - 同一電話番号でも異なる保育園では登録可能
CREATE TABLE Parents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber NVARCHAR(15) NOT NULL,
    Name NVARCHAR(100),
    NameKana NVARCHAR(100),
    DateOfBirth DATETIME2,
    PostalCode NVARCHAR(8),
    Prefecture NVARCHAR(10),
    City NVARCHAR(50),
    AddressLine NVARCHAR(200),
    HomePhone NVARCHAR(20),
    Email NVARCHAR(200),
    NurseryId INT NOT NULL,
    PushNotificationsEnabled BIT DEFAULT 1,
    AbsenceConfirmationEnabled BIT DEFAULT 1,
    DailyReportEnabled BIT DEFAULT 1,
    EventNotificationEnabled BIT DEFAULT 1,
    AnnouncementEnabled BIT DEFAULT 1,
    FontSize NVARCHAR(10) DEFAULT 'medium' NOT NULL,
    Language NVARCHAR(10) DEFAULT 'ja' NOT NULL,
    IsPrimary BIT DEFAULT 1 NOT NULL,
    IsActive BIT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    UpdatedAt DATETIME2,
    LastLoginAt DATETIME2,

    CONSTRAINT FK_Parents_Nurseries FOREIGN KEY (NurseryId) REFERENCES Nurseries(Id) ON DELETE CASCADE
);

-- インデックスとユニーク制約の作成
CREATE INDEX IX_Parents_Active_Created ON Parents (IsActive, CreatedAt);
CREATE INDEX IX_Parents_Email ON Parents (Email);
CREATE INDEX IX_Parents_PhoneNumber_Active_Children ON Parents (PhoneNumber, IsActive, Id, Name, Email, LastLoginAt);
CREATE INDEX IX_Parents_PostalCode ON Parents (PostalCode);
CREATE UNIQUE INDEX IX_Parents_PhoneNumber_Unique ON Parents (PhoneNumber, NurseryId);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者マスタ', 'SCHEMA', 'dbo', 'TABLE', 'Parents';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '電話番号', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', '氏名', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', '氏名ふりがな', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'NameKana';
EXEC sp_addextendedproperty 'MS_Description', '生年月日', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'DateOfBirth';
EXEC sp_addextendedproperty 'MS_Description', '郵便番号', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'PostalCode';
EXEC sp_addextendedproperty 'MS_Description', '都道府県', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Prefecture';
EXEC sp_addextendedproperty 'MS_Description', '市区町村', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'City';
EXEC sp_addextendedproperty 'MS_Description', '番地・建物名', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'AddressLine';
EXEC sp_addextendedproperty 'MS_Description', '固定電話', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'HomePhone';
EXEC sp_addextendedproperty 'MS_Description', 'メールアドレス', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Email';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', 'プッシュ通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'PushNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', '欠席確認通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'AbsenceConfirmationEnabled';
EXEC sp_addextendedproperty 'MS_Description', '連絡帳通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'DailyReportEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'イベント通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'EventNotificationEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'AnnouncementEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'フォントサイズ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'FontSize';
EXEC sp_addextendedproperty 'MS_Description', '言語', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Language';
EXEC sp_addextendedproperty 'MS_Description', '主親（0:家族登録で追加/1:保育園側で追加）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'IsPrimary';
EXEC sp_addextendedproperty 'MS_Description', 'アクティブフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'LastLoginAt';

-- 主キーの作成
ALTER TABLE [dbo].[DailyReports] ADD CONSTRAINT [PK_DailyReports] PRIMARY KEY ([Id]);

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'連絡帳テーブル', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', NULL, NULL;
EXECUTE sp_addextendedproperty N'MS_Description', N'連絡帳ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'Id';
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'職員保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'StaffNurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'職員ID', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'StaffId';
EXECUTE sp_addextendedproperty N'MS_Description', N'対象日', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'ReportDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'レポート種別（activity,meal,sleep,injury,accident,fight）', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'ReportKind';
EXECUTE sp_addextendedproperty N'MS_Description', N'タイトル', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'Title';
EXECUTE sp_addextendedproperty N'MS_Description', N'内容', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'Content';
EXECUTE sp_addextendedproperty N'MS_Description', N'写真', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'Photos';
EXECUTE sp_addextendedproperty N'MS_Description', N'ステータス', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'Status';
EXECUTE sp_addextendedproperty N'MS_Description', N'公開日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'PublishedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'保護者確認', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'ParentAcknowledged';
EXECUTE sp_addextendedproperty N'MS_Description', N'保護者日報確認日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'AcknowledgedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'アクティブフラグ', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'IsActive';
EXECUTE sp_addextendedproperty N'MS_Description', N'管理者作成フラグ', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'CreatedByAdminUser';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'DailyReports', N'COLUMN', N'UpdatedAt';
```

#### 3.3.3-A DailyReportResponses (日報への返信)
```sql
--   ReportId -> DailyReports(Id) (CASCADE削除)
--   ParentId -> Parents(Id) (CASCADE削除)
CREATE TABLE DailyReportResponses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ReportId NVARCHAR(100) NOT NULL,
    ParentId INT NOT NULL,
    ResponseText NVARCHAR(1000) NULL,
    ResponseType NVARCHAR(50) NOT NULL DEFAULT 'Comment',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_DailyReportResponses_Reports FOREIGN KEY (ReportId) REFERENCES DailyReports(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DailyReportResponses_Parents FOREIGN KEY (ParentId) REFERENCES Parents(Id) ON DELETE CASCADE
);

CREATE INDEX IX_DailyReportResponses_ReportId ON DailyReportResponses (ReportId);
CREATE INDEX IX_DailyReportResponses_ParentId ON DailyReportResponses (ParentId);
CREATE INDEX IX_DailyReportResponses_CreatedAt ON DailyReportResponses (CreatedAt DESC);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '日報への保護者返信を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '返信ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '日報ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'ReportId';
EXEC sp_addextendedproperty 'MS_Description', '返信した保護者ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', '返信内容', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'ResponseText';
EXEC sp_addextendedproperty 'MS_Description', '返信種別', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'ResponseType';
EXEC sp_addextendedproperty 'MS_Description', '返信作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReportResponses', 'COLUMN', 'CreatedAt';
```

#### 3.3.4 Photos (写真)
```sql
-- 写真管理テーブル
-- チェック制約:
--   VisibilityLevel: 'all', 'grade', 'class' のみ
--   FileSize: 0より大きく10485760以下（10MB制限）
--   Width/Height: 0より大きい値
CREATE TABLE Photos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    ThumbnailPath NVARCHAR(500) NOT NULL,
    OriginalFileName NVARCHAR(255),
    FileSize BIGINT NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    Width INT NOT NULL,
    Height INT NOT NULL,
    Description NVARCHAR(500),
    UploadedByStaffNurseryId INT NOT NULL,
    UploadedByStaffId INT NOT NULL,
    UploadedAt DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    PublishedAt DATETIME2 NOT NULL,
    VisibilityLevel NVARCHAR(20) DEFAULT 'class' NOT NULL, -- all/grade/class
    TargetClassId NVARCHAR(50),
    Status NVARCHAR(20) DEFAULT 'draft' NOT NULL, -- draft/published/archived
    IsReportCreate BIT DEFAULT 0 NOT NULL, -- レポート作成フラグ
    RequiresConsent BIT DEFAULT 1 NOT NULL,
    ViewCount INT DEFAULT 0 NOT NULL,
    DownloadCount INT DEFAULT 0 NOT NULL,
    UploadedByAdminUser BIT DEFAULT 0 NOT NULL,
    IsActive BIT NOT NULL,
    DeletedAt DATETIME2,
    UpdatedAt DATETIME2
);

-- インデックス作成
CREATE INDEX IX_Photos_Class_Status_Published ON Photos (TargetClassId, Status, PublishedAt);
CREATE INDEX IX_Photos_Staff_Uploaded ON Photos (UploadedByStaffNurseryId, UploadedByStaffId, UploadedAt);
CREATE INDEX IX_Photos_Visibility_Status_Published ON Photos (VisibilityLevel, Status, PublishedAt);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '写真管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'Photos';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '写真ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', 'ファイル名', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'FileName';
EXEC sp_addextendedproperty 'MS_Description', 'ファイルパス', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'FilePath';
EXEC sp_addextendedproperty 'MS_Description', 'サムネイルパス', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'ThumbnailPath';
EXEC sp_addextendedproperty 'MS_Description', '元のファイル名', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'OriginalFileName';
EXEC sp_addextendedproperty 'MS_Description', 'ファイルサイズ（バイト）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'FileSize';
EXEC sp_addextendedproperty 'MS_Description', 'MIMEタイプ', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'MimeType';
EXEC sp_addextendedproperty 'MS_Description', '画像幅（ピクセル）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'Width';
EXEC sp_addextendedproperty 'MS_Description', '画像高さ（ピクセル）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'Height';
EXEC sp_addextendedproperty 'MS_Description', '写真の説明', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'Description';
EXEC sp_addextendedproperty 'MS_Description', 'アップロードしたスタッフの保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UploadedByStaffNurseryId';
EXEC sp_addextendedproperty 'MS_Description', 'アップロードしたスタッフID', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UploadedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', 'アップロード日時', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UploadedAt';
EXEC sp_addextendedproperty 'MS_Description', '公開日時', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'PublishedAt';
EXEC sp_addextendedproperty 'MS_Description', '公開範囲（all:全体公開/grade:学年限定/class:クラス限定）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'VisibilityLevel';
EXEC sp_addextendedproperty 'MS_Description', '対象クラスID（VisibilityLevel=classの場合）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'TargetClassId';
EXEC sp_addextendedproperty 'MS_Description', 'ステータス（draft:下書き/published:公開済み/archived:アーカイブ）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'Status';
EXEC sp_addextendedproperty 'MS_Description', 'レポート作成フラグ（1:レポート作成時の写真/0:写真管理から登録）', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'IsReportCreate';
EXEC sp_addextendedproperty 'MS_Description', '保護者同意が必要か', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'RequiresConsent';
EXEC sp_addextendedproperty 'MS_Description', '閲覧回数', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'ViewCount';
EXEC sp_addextendedproperty 'MS_Description', 'ダウンロード回数', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'DownloadCount';
EXEC sp_addextendedproperty 'MS_Description', '管理者アップロードフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UploadedByAdminUser';
EXEC sp_addextendedproperty 'MS_Description', 'アクティブフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '削除日時', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'DeletedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'UpdatedAt';
```

#### 3.3.4-A PhotoAccesses (写真アクセス記録)
```sql
--   PhotoId -> Photos(Id) (CASCADE削除)
--   ParentId -> Parents(Id) (CASCADE削除)
CREATE TABLE PhotoAccesses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhotoId INT NOT NULL,
    ParentId INT NOT NULL,
    AccessType NVARCHAR(20) NOT NULL,
    AccessedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_PhotoAccesses_Photos FOREIGN KEY (PhotoId) REFERENCES Photos(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PhotoAccesses_Parents FOREIGN KEY (ParentId) REFERENCES Parents(Id) ON DELETE CASCADE
);

CREATE INDEX IX_PhotoAccesses_PhotoId ON PhotoAccesses (PhotoId);
CREATE INDEX IX_PhotoAccesses_ParentId ON PhotoAccesses (ParentId);
CREATE INDEX IX_PhotoAccesses_AccessedAt ON PhotoAccesses (AccessedAt DESC);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '写真へのアクセス履歴を記録するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'アクセスID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '写真ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses', 'COLUMN', 'PhotoId';
EXEC sp_addextendedproperty 'MS_Description', '保護者ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', 'アクセス種別（View/Download）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses', 'COLUMN', 'AccessType';
EXEC sp_addextendedproperty 'MS_Description', 'アクセス日時', 'SCHEMA', 'dbo', 'TABLE', 'PhotoAccesses', 'COLUMN', 'AccessedAt';
```

#### 3.3.4-B PhotoChildren (写真と園児の関連)
```sql
--   PhotoId -> Photos(Id) (CASCADE削除)
--   NurseryId, ChildId -> Children(NurseryId, ChildId) (CASCADE削除)
CREATE TABLE PhotoChildren (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhotoId INT NOT NULL,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,

    CONSTRAINT FK_PhotoChildren_Photos FOREIGN KEY (PhotoId) REFERENCES Photos(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PhotoChildren_Children FOREIGN KEY (NurseryId, ChildId) REFERENCES Children(NurseryId, ChildId) ON DELETE CASCADE
);

CREATE INDEX IX_PhotoChildren_PhotoId ON PhotoChildren (PhotoId);
CREATE INDEX IX_PhotoChildren_ChildId ON PhotoChildren (NurseryId, ChildId);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '写真に写っている園児を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'PhotoChildren';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoChildren', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '写真ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoChildren', 'COLUMN', 'PhotoId';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoChildren', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'PhotoChildren', 'COLUMN', 'ChildId';
```

### 3.4 通知関連テーブル

#### 3.4.1 NotificationSettings (通知設定)
```sql
--   ParentId -> Parents(Id) (CASCADE削除)
CREATE TABLE NotificationSettings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ParentId INT NOT NULL UNIQUE,
    PushNotificationsEnabled BIT NOT NULL DEFAULT 1,
    ReportNotificationsEnabled BIT NOT NULL DEFAULT 1,
    AbsenceConfirmationEnabled BIT NOT NULL DEFAULT 1,
    EventNotificationsEnabled BIT NOT NULL DEFAULT 1,
    AnnouncementNotificationsEnabled BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
);

CREATE INDEX IX_NotificationSettings_ParentId ON NotificationSettings (ParentId);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者の通知設定を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '通知設定ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', 'プッシュ通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'PushNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'レポート通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'ReportNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', '欠席確認通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'AbsenceConfirmationEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'イベント通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'EventNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'AnnouncementNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationSettings', 'COLUMN', 'UpdatedAt';
```

#### 3.4.2 Announcements (お知らせ通知)
```sql
--   CreatedByStaffId -> Staff(Id) (NO ACTION削除)
-- チェック制約:
--   Category: 'emergency', 'cooperation', 'general', 'important' のみ
--   Priority: 'high', 'normal', 'low' のみ
--   TargetAudience: 'all', 'specific_class', 'specific_child' のみ
CREATE TABLE Announcements (
    Id NVARCHAR(100) PRIMARY KEY, -- announce-123形式のID
    Title NVARCHAR(200) NOT NULL,
    Summary NVARCHAR(500) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Category NVARCHAR(50) NOT NULL, -- emergency|cooperation|general|important
    Priority NVARCHAR(20) NOT NULL DEFAULT 'normal', -- high|normal|low
    TargetAudience NVARCHAR(50) NOT NULL DEFAULT 'all', -- all|specific_class|specific_child
    TargetClassId INT NULL, -- specific_class の場合のクラスID
    TargetChildId INT NULL, -- specific_child の場合の子どもID
    CreatedByStaffId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
);

CREATE INDEX IX_Announcements_CreatedAt ON Announcements (CreatedAt DESC);
CREATE INDEX IX_Announcements_Category_Priority ON Announcements (Category, Priority);
CREATE INDEX IX_Announcements_TargetAudience ON Announcements (TargetAudience, TargetClassId, TargetChildId);
CREATE INDEX IX_Announcements_IsActive ON Announcements (IsActive) WHERE IsActive = 1;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ通知を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'Announcements';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'お知らせID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせタイトル', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Title';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ概要', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Summary';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ詳細内容', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Content';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせカテゴリ', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Category';
EXEC sp_addextendedproperty 'MS_Description', '優先度', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'Priority';
EXEC sp_addextendedproperty 'MS_Description', '対象', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'TargetAudience';
EXEC sp_addextendedproperty 'MS_Description', '対象クラスID', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'TargetClassId';
EXEC sp_addextendedproperty 'MS_Description', '対象子どもID', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'TargetChildId';
EXEC sp_addextendedproperty 'MS_Description', '作成者（スタッフID）', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'CreatedByStaffId';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '有効期限', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'ExpiresAt';
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Announcements', 'COLUMN', 'IsActive';
```

#### 3.4.3 NotificationLogs (通知一覧)
```sql
--   ParentId -> Parents(Id) (CASCADE削除)
-- チェック制約:
--   Type: 'announcement', 'report', 'event', 'absence_confirmation' のみ
--   Priority: 'high', 'normal', 'low' のみ
CREATE TABLE NotificationLogs (
    Id NVARCHAR(100) PRIMARY KEY, -- notif-001形式のID
    ParentId INT NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- announcement|report|event|absence_confirmation
    Title NVARCHAR(200) NOT NULL,
    Summary NVARCHAR(500) NOT NULL,
    RelatedId NVARCHAR(100) NULL, -- 関連するID（announce-123, report-456等）
    Priority NVARCHAR(20) NOT NULL DEFAULT 'normal', -- high|normal|low
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
);

CREATE INDEX IX_NotificationLogs_ParentId_CreatedAt ON NotificationLogs (ParentId, CreatedAt DESC);
CREATE INDEX IX_NotificationLogs_Type ON NotificationLogs (Type);
CREATE INDEX IX_NotificationLogs_IsRead ON NotificationLogs (IsRead) WHERE IsRead = 0;
CREATE INDEX IX_NotificationLogs_Priority ON NotificationLogs (Priority) WHERE Priority = 'high';

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '統合通知ログを管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '通知ログID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', '通知種別', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'Type';
EXEC sp_addextendedproperty 'MS_Description', '通知タイトル', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'Title';
EXEC sp_addextendedproperty 'MS_Description', '通知概要', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'Summary';
EXEC sp_addextendedproperty 'MS_Description', '関連ID', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'RelatedId';
EXEC sp_addextendedproperty 'MS_Description', '優先度', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'Priority';
EXEC sp_addextendedproperty 'MS_Description', '既読フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'IsRead';
EXEC sp_addextendedproperty 'MS_Description', '既読日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'ReadAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationLogs', 'COLUMN', 'CreatedAt';
```

#### 3.4.4 Azure Notification Hub関連テーブル

##### DeviceRegistrations (デバイス登録管理)
```sql
--   なし（独立テーブル）
CREATE TABLE DeviceRegistrations (
    DeviceId          NVARCHAR(255) NOT NULL PRIMARY KEY,
    IsAndroid         BIT NOT NULL,
    PushToken         NVARCHAR(1000) NULL,
    RegistrationId    NVARCHAR(500) NULL,
    DeviceInfo        NVARCHAR(1000) NULL,
    AppVersion        NVARCHAR(50) NULL,
    IsActive          BIT NOT NULL DEFAULT CONVERT(BIT, 1),
    LastLoginAt       DATETIME2 NOT NULL,
    CreatedAt         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_DeviceRegistrations_IsActive ON DeviceRegistrations (IsActive, LastLoginAt);
CREATE INDEX IX_DeviceRegistrations_LastLoginAt ON DeviceRegistrations (LastLoginAt DESC);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'デバイス登録管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'デバイス固有ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'DeviceId';
EXEC sp_addextendedproperty 'MS_Description', 'Androidフラグ', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'IsAndroid';
EXEC sp_addextendedproperty 'MS_Description', 'プッシュ通知トークン', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'PushToken';
EXEC sp_addextendedproperty 'MS_Description', 'Azure Notification Hub登録ID', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'RegistrationId';
EXEC sp_addextendedproperty 'MS_Description', 'デバイス情報（JSON）', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'DeviceInfo';
EXEC sp_addextendedproperty 'MS_Description', 'アプリバージョン', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'AppVersion';
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'LastLoginAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'DeviceRegistrations', 'COLUMN', 'UpdatedAt';
```

##### NotificationTemplates (通知テンプレート管理)
```sql
--   なし（独立テーブル）
-- チェック制約:
--   NotificationType: 'general', 'absence', 'report' のみ
--   Platform: 'Android', 'iOS' のみ
CREATE TABLE NotificationTemplates (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    NotificationType  NVARCHAR(50) NOT NULL,
    Platform          NVARCHAR(20) NOT NULL,
    TemplateJson      NVARCHAR(MAX) NOT NULL,
    IsActive          BIT NOT NULL DEFAULT 1,
    CreatedAt         DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt         DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UK_NotificationTemplates UNIQUE (NotificationType, Platform),
    CONSTRAINT CK_NotificationTemplates_Type CHECK (NotificationType IN ('general', 'absence', 'report')),
    CONSTRAINT CK_NotificationTemplates_Platform CHECK (Platform IN ('Android', 'iOS'))
);

CREATE INDEX IX_NotificationTemplates_Type ON NotificationTemplates (NotificationType);
CREATE INDEX IX_NotificationTemplates_Platform ON NotificationTemplates (Platform);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'Azure Notification Hub用通知テンプレート管理テーブル', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'テンプレートID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '通知種別（general/absence/report）', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'NotificationType';
EXEC sp_addextendedproperty 'MS_Description', 'プラットフォーム（Android/iOS）', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'Platform';
EXEC sp_addextendedproperty 'MS_Description', 'JSON通知テンプレート', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'TemplateJson';
EXEC sp_addextendedproperty 'MS_Description', '有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'NotificationTemplates', 'COLUMN', 'UpdatedAt';
```

##### AzureNotificationLogs (Azure通知ログ)
```sql
--   なし（独立テーブル）
-- チェック制約:
--   NotificationType: 'general', 'absence', 'report' のみ
--   Platform: 'Android', 'iOS', 'Web' のみ
--   NotificationState: 'pending', 'sent', 'failed', 'delivered' のみ
CREATE TABLE AzureNotificationLogs (
    Id                INT IDENTITY(1,1) PRIMARY KEY,
    DeviceId          NVARCHAR(255) NOT NULL,
    NotificationType  NVARCHAR(50) NOT NULL,
    Title             NVARCHAR(200) NOT NULL,
    Body              NVARCHAR(1000) NOT NULL,
    JsonPayload       NVARCHAR(MAX) NULL,
    Platform          NVARCHAR(20) NOT NULL,
    NotificationState NVARCHAR(50) NULL,
    SentAt            DATETIME2 NULL,
    ScheduledAt       DATETIME2 NULL,
    CreatedAt         DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT CK_AzureNotificationLogs_Type CHECK (NotificationType IN ('general', 'absence', 'report')),
    CONSTRAINT CK_AzureNotificationLogs_Platform CHECK (Platform IN ('Android', 'iOS', 'Web')),
    CONSTRAINT CK_AzureNotificationLogs_State CHECK (NotificationState IN ('pending', 'sent', 'failed', 'delivered'))
);

CREATE INDEX IX_AzureNotificationLogs_DeviceId ON AzureNotificationLogs (DeviceId);
CREATE INDEX IX_AzureNotificationLogs_SentAt ON AzureNotificationLogs (SentAt);
CREATE INDEX IX_AzureNotificationLogs_Type ON AzureNotificationLogs (NotificationType);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'Azure Notification Hub通知送信ログテーブル', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '通知ログID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', 'デバイスID', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'DeviceId';
EXEC sp_addextendedproperty 'MS_Description', '通知種別（general/absence/report）', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'NotificationType';
EXEC sp_addextendedproperty 'MS_Description', '通知タイトル', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'Title';
EXEC sp_addextendedproperty 'MS_Description', '通知本文', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'Body';
EXEC sp_addextendedproperty 'MS_Description', 'JSON通知ペイロード', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'JsonPayload';
EXEC sp_addextendedproperty 'MS_Description', 'プラットフォーム（Android/iOS/Web）', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'Platform';
EXEC sp_addextendedproperty 'MS_Description', '通知状態（pending/sent/failed/delivered）', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'NotificationState';
EXEC sp_addextendedproperty 'MS_Description', '送信日時', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'SentAt';
EXEC sp_addextendedproperty 'MS_Description', '送信予定日時', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'ScheduledAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'AzureNotificationLogs', 'COLUMN', 'CreatedAt';
```


### 3.6 認証・セキュリティ関連テーブル

#### 3.6.1 SmsAuthentications (SMS認証)
```sql
-- チェック制約:
--   ExpiresAt: CreatedAtより後
--   AuthenticationCode: 長さが6文字
--   AttemptCount: 0以上10以下
CREATE TABLE SmsAuthentications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber NVARCHAR(20) NOT NULL,
    AuthenticationCode NVARCHAR(10) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2 NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    UsedAt DATETIME2 NULL,
    AttemptCount INT NOT NULL DEFAULT 0,
    IpAddress NVARCHAR(45), -- IPv6対応
    UserAgent NVARCHAR(500)
);

CREATE INDEX IX_SmsAuthentications_PhoneNumber_CreatedAt ON SmsAuthentications (PhoneNumber, CreatedAt DESC);
CREATE INDEX IX_SmsAuthentications_ExpiresAt ON SmsAuthentications (ExpiresAt);
CREATE INDEX IX_SmsAuthentications_IsUsed ON SmsAuthentications (IsUsed) WHERE IsUsed = 0;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'SMS認証情報を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'SMS認証ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '認証用電話番号', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', '認証コード', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'AuthenticationCode';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '有効期限', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'ExpiresAt';
EXEC sp_addextendedproperty 'MS_Description', '使用済みフラグ', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'IsUsed';
EXEC sp_addextendedproperty 'MS_Description', '使用日時', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'UsedAt';
EXEC sp_addextendedproperty 'MS_Description', '認証試行回数', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'AttemptCount';
EXEC sp_addextendedproperty 'MS_Description', 'アクセス元IPアドレス', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'IpAddress';
EXEC sp_addextendedproperty 'MS_Description', 'ユーザーエージェント情報', 'SCHEMA', 'dbo', 'TABLE', 'SmsAuthentications', 'COLUMN', 'UserAgent';
```


## 4. ビューとストアドプロシージャ

### 4.1 ビュー定義

#### 4.1.1 ParentChildrenView (保護者の子ども一覧)
```sql
CREATE VIEW ParentChildrenView
AS
SELECT
    p.Id AS ParentId,
    p.Name AS ParentName,
    p.PhoneNumber AS ParentPhoneNumber,
    c.NurseryId,
    c.ChildId,
    c.Name AS ChildName,
    c.DateOfBirth,
    c.Gender,
    n.Name AS NurseryName,
    c.ClassId,
    cl.Name AS ClassName,
    pcr.RelationshipType,
    pcr.IsPrimaryContact,
    pcr.HasPickupPermission,
    pcr.CanReceiveEmergencyNotifications
FROM Parents p
INNER JOIN ParentChildRelationships pcr ON p.Id = pcr.ParentId
INNER JOIN Children c ON pcr.NurseryId = c.NurseryId AND pcr.ChildId = c.ChildId
INNER JOIN Nurseries n ON c.NurseryId = n.Id
LEFT JOIN Classes cl ON c.NurseryId = cl.NurseryId AND c.ClassId = cl.ClassId
WHERE p.IsActive = 1 AND c.IsActive = 1;
```

#### 4.1.2 DailyReportSummaryView (日次レポート要約)
```sql
CREATE VIEW DailyReportSummaryView
AS
SELECT 
    dr.Id AS ReportId,
    dr.ChildId,
    c.FirstName + ' ' + c.LastName AS ChildName,
    dr.ReportDate,
    dr.Type,
    t.FirstName + ' ' + t.LastName AS StaffName,
    dr.RequiresParentResponse,
    dr.ParentAcknowledged,
    dr.CreatedAt
FROM DailyReports dr
INNER JOIN Children c ON dr.ChildId = c.Id
INNER JOIN Staff s ON dr.StaffMemberId = s.Id
WHERE c.IsActive = 1;
```

### 4.2 ストアドプロシージャ

#### 4.2.1 GetParentDashboardData (保護者ダッシュボードデータ取得)
```sql
CREATE PROCEDURE GetParentDashboardData
    @ParentId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 子ども一覧
    SELECT * FROM ParentChildrenView WHERE ParentId = @ParentId;
    
    -- 未読レポート数
    SELECT 
        c.Id AS ChildId,
        c.FirstName + ' ' + c.LastName AS ChildName,
        COUNT(dr.Id) AS UnreadReportCount
    FROM ParentChildRelationships pcr
    INNER JOIN Children c ON pcr.ChildId = c.Id
    LEFT JOIN DailyReports dr ON c.Id = dr.ChildId 
        AND dr.ParentAcknowledged = 0 
        AND dr.RequiresParentResponse = 1
        AND dr.ReportDate >= DATEADD(day, -7, GETDATE()) -- 過去7日間
    WHERE pcr.ParentId = @ParentId 
        AND pcr.CanReceiveReports = 1
        AND c.IsActive = 1
    GROUP BY c.Id, c.FirstName, c.LastName;
    
    -- 新しい写真数
    SELECT 
        c.Id AS ChildId,
        c.FirstName + ' ' + c.LastName AS ChildName,
        COUNT(p.Id) AS NewPhotosCount
    FROM ParentChildRelationships pcr
    INNER JOIN Children c ON pcr.ChildId = c.Id
    LEFT JOIN Photos p ON c.Id = p.ChildId 
        AND p.UploadedDate >= DATEADD(day, -3, GETDATE()) -- 過去3日間
        AND p.IsDeleted = 0
    WHERE pcr.ParentId = @ParentId 
        AND c.IsActive = 1
    GROUP BY c.Id, c.FirstName, c.LastName;
    
    -- 今後のイベント
    SELECT TOP 5
        e.Id,
        e.Title,
        e.StartDateTime,
        e.EndDateTime,
        e.Category
    FROM Events e
    LEFT JOIN Children c ON e.TargetClassId = c.ClassId
    LEFT JOIN ParentChildRelationships pcr ON c.Id = pcr.ChildId
    WHERE (e.TargetAudience = 'All' OR pcr.ParentId = @ParentId)
        AND e.StartDateTime >= GETDATE()
    ORDER BY e.StartDateTime;
END;
```

## 5. セキュリティ設計

### 5.1 行レベルセキュリティ (RLS)
```sql
-- 保護者は自分の子どもの情報のみアクセス可能
CREATE SECURITY POLICY ParentChildAccessPolicy
ADD FILTER PREDICATE 
    dbo.fn_CanAccessChild(USER_NAME(), ChildId) = 1
ON dbo.DailyReports,
ADD FILTER PREDICATE 
    dbo.fn_CanAccessChild(USER_NAME(), ChildId) = 1
ON dbo.Photos,
ADD FILTER PREDICATE 
    dbo.fn_CanAccessChild(USER_NAME(), ChildId) = 1
ON dbo.ContactNotifications
WITH (STATE = ON);

-- アクセス可能性判定関数
CREATE FUNCTION fn_CanAccessChild(@UserContext NVARCHAR(128), @ChildId INT)
RETURNS BIT
AS
BEGIN
    DECLARE @ParentId INT;
    DECLARE @CanAccess BIT = 0;
    
    -- ユーザーコンテキストからParentIdを取得
    SELECT @ParentId = CAST(@UserContext AS INT);
    
    -- 親子関係の確認
    IF EXISTS (
        SELECT 1 FROM ParentChildRelationships 
        WHERE ParentId = @ParentId AND ChildId = @ChildId
    )
        SET @CanAccess = 1;
    
    RETURN @CanAccess;
END;
```

### 5.2 暗号化設定
```sql
-- 機密データの暗号化 (Always Encrypted)
CREATE TABLE Parents_Encrypted (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(255) ENCRYPTED WITH (
        COLUMN_ENCRYPTION_KEY = PersonalInfoCEK,
        ENCRYPTION_TYPE = DETERMINISTIC,
        ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
    ),
    PhoneNumber NVARCHAR(20) ENCRYPTED WITH (
        COLUMN_ENCRYPTION_KEY = PersonalInfoCEK,
        ENCRYPTION_TYPE = DETERMINISTIC,
        ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
    ) NOT NULL,
    Address NVARCHAR(500) ENCRYPTED WITH (
        COLUMN_ENCRYPTION_KEY = PersonalInfoCEK,
        ENCRYPTION_TYPE = RANDOMIZED,
        ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
    )
);
```

## 6. パフォーマンス最適化

### 6.1 インデックス戦略
```sql
-- 複合インデックスでクエリを最適化
CREATE INDEX IX_DailyReports_Complex 
ON DailyReports (ChildId, ReportDate DESC, RequiresParentResponse)
INCLUDE (Type, Content, StaffMemberId);

CREATE INDEX IX_Photos_Complex 
ON Photos (ChildId, CapturedDate DESC, IsDeleted)
INCLUDE (FileName, ThumbnailUrl, ActivityType);

-- フィルタードインデックスで容量を節約
CREATE INDEX IX_Events_Upcoming 
ON Events (StartDateTime)
WHERE StartDateTime >= GETDATE();

CREATE INDEX IX_SmsAuth_Active 
ON SmsAuthentications (PhoneNumber, CreatedAt DESC)
WHERE IsUsed = 0 AND ExpiresAt > GETDATE();
```

### 6.2 パーティショニング戦略
```sql
-- 写真テーブルの月別パーティショニング
CREATE PARTITION FUNCTION pf_MonthlyPartition (DATETIME2)
AS RANGE RIGHT FOR VALUES 
('2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', 
 '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01',
 '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01',
 '2025-01-01');

CREATE PARTITION SCHEME ps_MonthlyPartition
AS PARTITION pf_MonthlyPartition
ALL TO ([PRIMARY]);

-- パーティション化されたPhotosテーブル
CREATE TABLE Photos_Partitioned (
    -- 列定義は同じ
    CapturedDate DATETIME2 NOT NULL,
    -- その他の列...
) ON ps_MonthlyPartition (CapturedDate);
```

このデータベース設計書により、保育園保護者向けモバイルアプリに必要な全てのデータを効率的に管理し、高いパフォーマンスとセキュリティを実現できます。

### 3.7 乳児連絡帳関連テーブル (Infant Daily Records)

0～2歳児を対象とした日々の記録（体温、食事、睡眠、排泄、機嫌など）を管理する連絡帳機能のテーブル群です。

**重要**: 個別の連絡事項は年齢に関わらず既存の `DailyReports` テーブルで管理します。

#### 3.7.1 InfantTemperatures (乳児体温記録)

朝（自宅・保護者入力または園・スタッフ入力）と午後（園・スタッフ入力）の体温記録を管理します。

**2026-01-02更新**: `CreatedByType` フィールドを追加し、保護者とスタッフの入力を区別できるようにしました。`Notes` フィールドは削除しました。

```sql
-- 1. InfantTemperatures（乳児体温記録）
CREATE TABLE InfantTemperatures (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MeasurementType NVARCHAR(20) NOT NULL,
    Temperature DECIMAL(3, 1) NOT NULL,
    MeasuredAt DATETIME2 NOT NULL,
    IsAbnormal BIT NOT NULL DEFAULT 0,
    CreatedByType VARCHAR(20) NOT NULL DEFAULT 'Staff',  -- 2026-01-02追加: Parent/Staff
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MeasurementType)
);
GO

-- インデックス作成
CREATE INDEX IX_InfantTemperatures_Abnormal ON InfantTemperatures (IsAbnormal, RecordDate DESC) WHERE IsAbnormal = 1;
CREATE INDEX IX_InfantTemperatures_CreatedByType ON InfantTemperatures (NurseryId, ChildId, RecordDate, CreatedByType) WHERE CreatedByType = 'Parent';
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児体温記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'測定種別（Morning:朝/Afternoon:午後）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasurementType';
EXECUTE sp_addextendedproperty N'MS_Description', N'体温（℃）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'Temperature';
EXECUTE sp_addextendedproperty N'MS_Description', N'測定日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'MeasuredAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'異常値フラグ（37.5℃以上）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'IsAbnormal';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者タイプ（Parent:保護者入力/Staff:スタッフ入力）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedByType';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID（ParentIdまたはStaffId）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID（ParentIdまたはStaffId）', N'SCHEMA', N'dbo', N'TABLE', N'InfantTemperatures', N'COLUMN', N'UpdatedBy';
GO
```

#### 3.7.2 InfantMeals (乳児食事記録)

午前おやつ（園）、昼食（園）、午後おやつ（園）の食事記録を管理します。

```sql
-- 2. InfantMeals（乳児食事記録）
CREATE TABLE InfantMeals (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MealType NVARCHAR(20) NOT NULL,
    MainDishAmount NVARCHAR(20),
    SideDishAmount NVARCHAR(20),
    SoupAmount NVARCHAR(20),
    TotalAmount NVARCHAR(20) NOT NULL,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    PRIMARY KEY (NurseryId, ChildId, RecordDate, MealType)
);
GO

-- インデックス作成
CREATE INDEX IX_InfantMeals_Date ON InfantMeals (RecordDate DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児食事記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'食事種別（breakfast:午前おやつ/lunch:昼食/snack:午後おやつ）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'MealType';
EXECUTE sp_addextendedproperty N'MS_Description', N'主食の摂取量（all:完食/most:ほとんど/half:半分/little:少し/none:なし）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'MainDishAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'副食の摂取量（all:完食/most:ほとんど/half:半分/little:少し/none:なし）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'SideDishAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'汁物の摂取量（all:完食/most:ほとんど/half:半分/little:少し/none:なし）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'SoupAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'全体の摂取量（all:完食/most:ほとんど/half:半分/little:少し/none:なし）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'TotalAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考（食べ方の様子、嫌いな食材など）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMeals', N'COLUMN', N'UpdatedAt';
GO
```

#### 3.7.3 InfantSleeps (乳児睡眠記録)

昼寝の開始・終了時刻、睡眠時間、睡眠の質を記録します。

```sql
-- 3. InfantSleeps（乳児睡眠記録）
CREATE TABLE InfantSleeps (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2,
    DurationMinutes AS DATEDIFF(MINUTE, StartTime, EndTime) PERSISTED,
    Quality NVARCHAR(20),
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    PRIMARY KEY (NurseryId, ChildId, RecordDate)
);
GO

-- インデックス作成
CREATE INDEX IX_InfantSleeps_StartTime ON InfantSleeps (StartTime DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児睡眠記録（昼寝）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'開始時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'StartTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'終了時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'EndTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠時間（分）計算カラム', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'DurationMinutes';
EXECUTE sp_addextendedproperty N'MS_Description', N'睡眠の質（sound:ぐっすり/normal:普通/light:浅い/restless:何度も起きた）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'Quality';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考（寝つきの様子、起き方など）', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantSleeps', N'COLUMN', N'UpdatedAt';
GO
```

#### 3.7.4 InfantNapChecks (乳児午睡チェック)

SIDS予防のための5～10分間隔の午睡チェック記録です。

```sql
-- 4. InfantNapChecks（乳児午睡チェック）
CREATE TABLE InfantNapChecks (
    CheckId INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    CheckTime DATETIME2 NOT NULL,
    BreathingOk BIT NOT NULL,
    BodyPosition NVARCHAR(20) NOT NULL,
    IsAbnormal BIT NOT NULL DEFAULT 0,
    Notes NVARCHAR(500),
    CheckedByStaffId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime]()
);
GO

-- インデックス作成
CREATE INDEX IX_InfantNapChecks_Child_Date ON InfantNapChecks (NurseryId, ChildId, RecordDate, CheckTime DESC);
CREATE INDEX IX_InfantNapChecks_Abnormal ON InfantNapChecks (IsAbnormal, CheckTime DESC) WHERE IsAbnormal = 1;
CREATE INDEX IX_InfantNapChecks_Staff ON InfantNapChecks (CheckedByStaffId, CheckTime DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児午睡チェック（SIDS予防）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'チェックID（主キー、自動採番）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckId';
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'チェック時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'呼吸確認OK', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'BreathingOk';
EXECUTE sp_addextendedproperty N'MS_Description', N'体位（supine:仰向け/side:横向き/prone:うつ伏せ）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'BodyPosition';
EXECUTE sp_addextendedproperty N'MS_Description', N'異常フラグ', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'IsAbnormal';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考（異常時の詳細など）', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'チェック実施保育士ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CheckedByStaffId';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantNapChecks', N'COLUMN', N'CreatedAt';
GO
```

#### 3.7.5 InfantToileting (乳児排泄記録)

おしっこ（尿）とうんち（便）の記録を管理します。1日1レコードで管理します。

```sql
-- 5. InfantToileting（乳児排泄記録）
CREATE TABLE [dbo].[InfantToileting] (
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [RecordDate] DATE NOT NULL,
    [ToiletingTime] DATETIME2 NOT NULL,
    [ToiletingType] NVARCHAR(20) NOT NULL,
    [BowelCondition] NVARCHAR(20),
    [BowelColor] NVARCHAR(20),
    [UrineAmount] NVARCHAR(20),
    [DiaperChangeCount] INT,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    [CreatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    [UpdatedBy] INT NOT NULL,
    CONSTRAINT [PK__InfantTo__7633B73838B467A0] PRIMARY KEY ([NurseryId], [ChildId], [RecordDate])
);
GO

-- インデックス作成
CREATE INDEX IX_InfantToileting_Record ON [dbo].[InfantToileting] ([NurseryId], [ChildId], [RecordDate], [ToiletingTime]);
CREATE INDEX IX_InfantToileting_Time ON [dbo].[InfantToileting] ([ToiletingTime]);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児排泄記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄時刻', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingTime';
EXECUTE sp_addextendedproperty N'MS_Description', N'排泄タイプ（Urine/Bowel）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'ToiletingType';
EXECUTE sp_addextendedproperty N'MS_Description', N'便の状態（Normal/Soft/Diarrhea/Hard）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelCondition';
EXECUTE sp_addextendedproperty N'MS_Description', N'便の色（Normal/Green/White/Black/Bloody）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'BowelColor';
EXECUTE sp_addextendedproperty N'MS_Description', N'おしっこの量（Little/Normal/Lot）', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UrineAmount';
EXECUTE sp_addextendedproperty N'MS_Description', N'おむつ交換回数', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'DiaperChangeCount';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantToileting', N'COLUMN', N'UpdatedBy';
GO
```

#### 3.7.6 InfantMoods (乳児機嫌記録)

朝（登園時）と午後（降園前）の機嫌状態を記録します。

```sql
-- 6. InfantMoods（乳児機嫌記録）
CREATE TABLE InfantMoods (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    TimeOfDay NVARCHAR(20) NOT NULL,
    MoodState NVARCHAR(20) NOT NULL,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    PRIMARY KEY (NurseryId, ChildId, RecordDate, TimeOfDay)
);
GO

-- インデックス作成
CREATE INDEX IX_InfantMoods_Date ON InfantMoods (RecordDate DESC);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'乳児機嫌記録', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'時間帯（morning:朝/afternoon:午後）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'TimeOfDay';
EXECUTE sp_addextendedproperty N'MS_Description', N'機嫌の状態（good:良い/normal:普通/bad:悪い/crying:泣いていた）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'MoodState';
EXECUTE sp_addextendedproperty N'MS_Description', N'備考（保護者からの申し送り、様子の詳細など）', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'Notes';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'InfantMoods', N'COLUMN', N'UpdatedAt';
GO
```

#### 3.7.7 ParentMorningNote (保護者からの申し送り)

**2026-01-02追加**: 保護者が朝に入力する子供の様子と申し送り事項を記録します。

```sql
-- 7. ParentMorningNote（保護者からの申し送り）
CREATE TABLE ParentMorningNote (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    Note NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime](),
    UpdatedBy INT NOT NULL,
    PRIMARY KEY (NurseryId, ChildId, RecordDate)
);
GO

-- インデックス作成
CREATE INDEX IX_ParentMorningNote_Child_Date ON ParentMorningNote (NurseryId, ChildId, RecordDate);
CREATE INDEX IX_ParentMorningNote_RecordDate ON ParentMorningNote (RecordDate);
CREATE INDEX IX_ParentMorningNote_CreatedBy ON ParentMorningNote (CreatedBy, RecordDate);
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保護者からの申し送り', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', NULL, NULL;
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID（複合主キー1）', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'NurseryId';
EXECUTE sp_addextendedproperty N'MS_Description', N'園児ID（複合主キー2）', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'ChildId';
EXECUTE sp_addextendedproperty N'MS_Description', N'記録日（複合主キー3）', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'RecordDate';
EXECUTE sp_addextendedproperty N'MS_Description', N'子供の様子（フリーフォーマット、最大500文字）朝食の食べ具合、夜の睡眠状況、体調、保育士への申し送りなど', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'Note';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'CreatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID（ParentId）', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'CreatedBy';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'UpdatedAt';
EXECUTE sp_addextendedproperty N'MS_Description', N'更新者ID（ParentId）', N'SCHEMA', N'dbo', N'TABLE', N'ParentMorningNote', N'COLUMN', N'UpdatedBy';
GO
```

#### 設計のポイント

**複合主キーの使用**
- 7つの Infant テーブルで (NurseryId, ChildId, RecordDate) を基本とした複合主キーを採用
- InfantNapChecks は1日に複数回記録されるため、IDENTITY カラムを使用
- InfantToileting は1日1レコード管理のため、(NurseryId, ChildId, RecordDate) の複合主キーのみ
- InfantSleeps は同日複数回の昼寝に対応するため SleepSequence を含む複合主キー
- ParentMorningNote は1日1レコード管理のため、(NurseryId, ChildId, RecordDate) の複合主キーのみ

**時刻の扱い**
- DEFAULT値には `[dbo].[GetJstDateTime]()` 関数を使用（JST対応）
- 体温・排泄・午睡チェックは DATETIME2 で時刻まで記録
- 睡眠時間は計算カラム (PERSISTED) で自動算出

**外部キー制約なし**
- プロジェクトのポリシーに従い、外部キー制約は設定していません
- アプリケーション層で整合性を保証

**CHECK制約なし**
- プロジェクトのポリシーに従い、CHECK制約は設定していません
- アプリケーション層でバリデーション実施

**拡張プロパティ**
- すべてのテーブルとカラムに日本語の論理名を設定
- `sp_addextendedproperty` でデータベースカタログに保存

## 12. 変更履歴

### 2025-12-28: 乳児連絡帳機能追加
- **新規テーブル追加**: 0～2歳児向け連絡帳機能のための6テーブルを追加
  - InfantTemperatures: 乳児体温記録（朝・午後）
  - InfantMeals: 乳児食事記録（午前おやつ・昼食・午後おやつ）
  - InfantSleeps: 乳児睡眠記録（昼寝）
  - InfantNapChecks: 乳児午睡チェック（SIDS予防）
  - InfantToileting: 乳児排泄記録（おしっこ・うんち）
  - InfantMoods: 乳児機嫌記録（朝・午後）
- **設計方針**: 複合主キー、外部キーなし、CHECK制約なし、JST対応DEFAULT値
- **既存テーブル活用**: 個別連絡事項は既存の DailyReports テーブルを使用（年齢共通）
- **関連ドキュメント**:
  - [docs/requirements/infant-daily-records-requirements.md](../requirements/infant-daily-records-requirements.md)
  - [docs/database/infant-daily-records-schema.md](../database/infant-daily-records-schema.md)
  - [docs/specifications/infant-daily-records-ui-spec.md](../specifications/infant-daily-records-ui-spec.md)

### 2025-12-17: 撮影禁止(NoPhoto)機能追加

#### Childrenテーブル
- **NoPhotoカラム追加**: 園児の写真撮影・共有を禁止するフラグ
  - カラム名: `NoPhoto`
  - データ型: `BIT`
  - NULL許可: `NOT NULL`
  - デフォルト値: `0` (FALSE - 撮影・共有を許可)
  - 説明: 保護者が園児の写真撮影・共有を望まない場合にtrueを設定

#### ApplicationWorksテーブル
- **ChildNoPhotoカラム追加**: 入園申込時の撮影禁止希望フラグ
  - カラム名: `ChildNoPhoto`
  - データ型: `BIT`
  - NULL許可: `NOT NULL`
  - デフォルト値: `0` (FALSE - 撮影・共有を許可)
  - 説明: 入園申込時に保護者が撮影禁止を希望した場合にtrueを設定。園児登録時にChildren.NoPhotoに引き継がれる