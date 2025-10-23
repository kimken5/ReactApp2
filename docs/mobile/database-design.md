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
│ EstablishedDate │         └─────────────────┘         │ Position        │
│ LogoUrl         │                 │ ▲                 │ IsActive        │
└─────────────────┘                 │ │                 │ LastLoginAt     │
                                    │ │                 └─────────────────┘
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
                            │ FirstName       │
                            │ LastName        │
                            │ Email           │
                            │ PhoneNumber     │◄─┐
                            │ DeviceToken     │  │
                            │ Address         │  │
                            │ EmergencyContact│  │
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
    Password NVARCHAR(10) NULL,
    Address NVARCHAR(500) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PrincipalName NVARCHAR(100) NOT NULL,
    EstablishedDate DATETIME2 NOT NULL,
    LogoUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    UpdatedAt DATETIME2,

    CONSTRAINT UK_Nurseries_PhoneNumber UNIQUE (PhoneNumber),
    CONSTRAINT UK_Nurseries_Email UNIQUE (Email)
);

CREATE INDEX IX_Nurseries_Name ON Nurseries (Name);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園マスタ', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保育園名', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', 'ログインID', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LoginID';
EXEC sp_addextendedproperty 'MS_Description', 'パスワード', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Password';
EXEC sp_addextendedproperty 'MS_Description', '住所', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Address';
EXEC sp_addextendedproperty 'MS_Description', '電話番号', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', 'メールアドレス', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'Email';
EXEC sp_addextendedproperty 'MS_Description', '園長名', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'PrincipalName';
EXEC sp_addextendedproperty 'MS_Description', '設立日', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'EstablishedDate';
EXEC sp_addextendedproperty 'MS_Description', 'ロゴURL', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'LogoUrl';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Nurseries', 'COLUMN', 'UpdatedAt';
```

#### 3.1.2 Classes (クラス)
```sql
-- チェック制約:
--   AgeGroupMin: 0以上6以下
--   AgeGroupMax: 0以上6以下
--   MaxCapacity: 0より大きい値
--   AgeGroupMin <= AgeGroupMax
-- 複合主キー: (NurseryId, ClassId) で一意性を保証
CREATE TABLE Classes (
    NurseryId INT NOT NULL, -- 保育園ID（複合主キーの第1カラム）
    ClassId NVARCHAR(50) NOT NULL, -- クラスID（複合主キーの第2カラム）
    Name NVARCHAR(50) NOT NULL, -- "さくら組", "ひまわり組"
    AgeGroupMin INT NOT NULL,
    AgeGroupMax INT NOT NULL,
    MaxCapacity INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT PK_Classes PRIMARY KEY (NurseryId, ClassId),
);

CREATE INDEX IX_Classes_NurseryId ON Classes (NurseryId);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'クラス情報を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'Classes';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID（複合主キー第1カラム）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', 'クラスID（複合主キー第2カラム）', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', 'クラス名', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', '最小年齢', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'AgeGroupMin';
EXEC sp_addextendedproperty 'MS_Description', '最大年齢', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'AgeGroupMax';
EXEC sp_addextendedproperty 'MS_Description', '定員数', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'MaxCapacity';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Classes', 'COLUMN', 'UpdatedAt';
```

#### 3.1.3 Staff (スタッフ・職員)
```sql
-- チェック制約:
--   Role: 'Teacher', 'Admin', 'Clerk' のみ
-- 複合主キー: (NurseryId, StaffId) で一意性を保証
CREATE TABLE Staff (
    NurseryId INT NOT NULL, -- 所属保育園ID（複合主キーの第1カラム）
    StaffId INT NOT NULL, -- スタッフID（複合主キーの第2カラム）
    Name NVARCHAR(50) NOT NULL, -- 氏名
    PhoneNumber NVARCHAR(15) NOT NULL,
    Email NVARCHAR(200),
    Role NVARCHAR(50) NOT NULL, -- 'Teacher'(教師), 'Admin'(管理者), 'Clerk'(事務員)
    Position NVARCHAR(100), -- 職位（任意）
    LastLoginAt DATETIME2,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,

    CONSTRAINT PK_Staff PRIMARY KEY (NurseryId, StaffId)
);

CREATE INDEX IX_Staff_Nursery_Active ON Staff (NurseryId, IsActive);
CREATE INDEX IX_Staff_PhoneNumber_Active ON Staff (PhoneNumber, IsActive);
CREATE UNIQUE INDEX IX_Staff_PhoneNumber_Unique ON Staff (PhoneNumber);
CREATE INDEX IX_Staff_Role_Active ON Staff (Role, IsActive);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '職員マスタ', 'SCHEMA', 'dbo', 'TABLE', 'Staff';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '職員ID', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'StaffId';
EXEC sp_addextendedproperty 'MS_Description', '氏名', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', '電話番号', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', 'メールアドレス', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'Email';
EXEC sp_addextendedproperty 'MS_Description', '役職', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'Role';
EXEC sp_addextendedproperty 'MS_Description', '職位', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'Position';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'LastLoginAt';
EXEC sp_addextendedproperty 'MS_Description', 'アクティブフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Staff', 'COLUMN', 'UpdatedAt';
```

#### 3.1.4 StaffClassAssignments (スタッフ・クラス割り当て)
```sql
-- スタッフとクラスの多対多関係を管理
-- 1つのクラスに複数のスタッフが担当可能
-- 1人のスタッフが複数のクラスを担当可能
-- 複合主キー: (NurseryId, StaffId, ClassId) で一意性を保証
CREATE TABLE StaffClassAssignments (
    NurseryId INT NOT NULL, -- 保育園ID（複合主キーの第1カラム）
    StaffId INT NOT NULL, -- スタッフID（複合主キーの第2カラム）
    ClassId NVARCHAR(50) NOT NULL, -- クラスID（複合主キーの第3カラム）
    AssignmentRole NVARCHAR(50) NOT NULL, -- 'MainTeacher'(主担任), 'AssistantTeacher'(副担任)
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,

    CONSTRAINT PK_StaffClassAssignments PRIMARY KEY (NurseryId, StaffId, ClassId)
);

CREATE INDEX IX_StaffClassAssignments_Staff ON StaffClassAssignments (NurseryId, StaffId);
CREATE INDEX IX_StaffClassAssignments_Class ON StaffClassAssignments (NurseryId, ClassId);
CREATE INDEX IX_StaffClassAssignments_Class_Role ON StaffClassAssignments (NurseryId, ClassId, AssignmentRole);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '職員クラス割当テーブル', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '職員ID', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'StaffId';
EXEC sp_addextendedproperty 'MS_Description', 'クラスID', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', '割当役割', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'AssignmentRole';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'StaffClassAssignments', 'COLUMN', 'UpdatedAt';
```


### 3.2 ユーザー関連テーブル

#### 3.2.1 Children (子ども)
```sql
--   NurseryId -> Nurseries(Id) (CASCADE削除)
--   (NurseryId, ClassId) -> Classes(NurseryId, ClassId) (CASCADE削除)
-- チェック制約:
--   DateOfBirth: '2018-01-01'以降（過去7年以内）
-- 複合主キー: (NurseryId, ChildId) で一意性を保証
CREATE TABLE Children (
    NurseryId INT NOT NULL, -- 保育園ID（複合主キーの第1カラム）
    ChildId INT NOT NULL, -- 園児ID（複合主キーの第2カラム）
    Name NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    Gender NVARCHAR(10) NULL,
    MedicalNotes NVARCHAR(500) NULL,
    SpecialInstructions NVARCHAR(500) NULL,
    EnrollmentDate DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    ClassId1 NVARCHAR(50) NULL,
    ClassNurseryId INT NULL,

    CONSTRAINT PK_Children PRIMARY KEY (NurseryId, ChildId),
    CONSTRAINT FK_Children_Classes FOREIGN KEY (NurseryId, ClassId) REFERENCES Classes(NurseryId, ClassId)
);

CREATE INDEX IX_Children_NurseryId_ClassId ON Children (NurseryId, ClassId);
CREATE INDEX IX_Children_IsActive ON Children (IsActive) WHERE IsActive = 1;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '子ども（園児）情報を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'Children';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園ID（複合主キー第1カラム）', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID（複合主キー第2カラム）', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '氏名', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', '生年月日', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'DateOfBirth';
EXEC sp_addextendedproperty 'MS_Description', '所属クラスID', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'ClassId';
EXEC sp_addextendedproperty 'MS_Description', '性別', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'Gender';
EXEC sp_addextendedproperty 'MS_Description', '医療情報・アレルギー等', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'MedicalNotes';
EXEC sp_addextendedproperty 'MS_Description', '特記事項', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'SpecialInstructions';
EXEC sp_addextendedproperty 'MS_Description', '入園日', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'EnrollmentDate';
EXEC sp_addextendedproperty 'MS_Description', '在園中フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '追加クラスID（調査中）', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'ClassId1';
EXEC sp_addextendedproperty 'MS_Description', '追加クラス保育園ID（調査中）', 'SCHEMA', 'dbo', 'TABLE', 'Children', 'COLUMN', 'ClassNurseryId';
```

#### 3.2.2 Parents (保護者)

> **2025/10/20更新**: NotificationSettingsテーブルの設定とカスタマイズ設定をParentsテーブルに統合しました。
> - 通知設定: プッシュ通知、欠席確認、日報、イベント、お知らせの5種類
> - カスタマイズ設定: フォントサイズ、言語設定

```sql
CREATE TABLE Parents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PhoneNumber NVARCHAR(15) NOT NULL,
    Name NVARCHAR(100) NULL,
    Email NVARCHAR(200) NULL,
    Address NVARCHAR(200) NULL,

    -- 通知設定（NotificationSettingsから統合）
    PushNotificationsEnabled BIT NOT NULL DEFAULT 1,
    AbsenceConfirmationEnabled BIT NOT NULL DEFAULT 1,
    DailyReportEnabled BIT NOT NULL DEFAULT 1,
    EventNotificationEnabled BIT NOT NULL DEFAULT 1,
    AnnouncementEnabled BIT NOT NULL DEFAULT 1,

    -- カスタマイズ設定
    FontSize NVARCHAR(10) NOT NULL DEFAULT 'medium',  -- 'small', 'medium', 'large', 'xlarge'
    Language NVARCHAR(10) NOT NULL DEFAULT 'ja',      -- 'ja', 'en', 'zh-CN', 'ko'

    -- システムカラム
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    LastLoginAt DATETIME2 NULL,

    CONSTRAINT UK_Parents_PhoneNumber UNIQUE (PhoneNumber)
);

-- インデックス作成
CREATE INDEX IX_Parents_Active_Created ON Parents (IsActive, CreatedAt);
CREATE INDEX IX_Parents_Email ON Parents (Email);
CREATE INDEX IX_Parents_PhoneNumber_Active_Children ON Parents (PhoneNumber, IsActive, Id, Name, Email, LastLoginAt);
CREATE UNIQUE INDEX IX_Parents_PhoneNumber_Unique ON Parents (PhoneNumber);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者・家族情報、通知設定、カスタマイズ設定を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'Parents';

-- 基本情報カラムコメント
EXEC sp_addextendedproperty 'MS_Description', '保護者ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '電話番号（SMS認証用、一意）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'PhoneNumber';
EXEC sp_addextendedproperty 'MS_Description', '氏名', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Name';
EXEC sp_addextendedproperty 'MS_Description', 'メールアドレス', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Email';
EXEC sp_addextendedproperty 'MS_Description', '住所', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Address';

-- 通知設定カラムコメント
EXEC sp_addextendedproperty 'MS_Description', 'プッシュ通知有効フラグ（全体ON/OFF）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'PushNotificationsEnabled';
EXEC sp_addextendedproperty 'MS_Description', '欠席確認通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'AbsenceConfirmationEnabled';
EXEC sp_addextendedproperty 'MS_Description', '日報通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'DailyReportEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'イベント通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'EventNotificationEnabled';
EXEC sp_addextendedproperty 'MS_Description', 'お知らせ通知有効フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'AnnouncementEnabled';

-- カスタマイズ設定カラムコメント
EXEC sp_addextendedproperty 'MS_Description', 'フォントサイズ（small/medium/large/xlarge）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'FontSize';
EXEC sp_addextendedproperty 'MS_Description', '表示言語（ja/en/zh-CN/ko）', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'Language';

-- システムカラムコメント
EXEC sp_addextendedproperty 'MS_Description', 'アクティブフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '最終ログイン日時', 'SCHEMA', 'dbo', 'TABLE', 'Parents', 'COLUMN', 'LastLoginAt';
```

**カラム説明**:
- **通知設定**: NotificationSettingsテーブルから統合。プッシュ通知がOFFの場合、全ての個別通知も無効化されます。
- **FontSize**: 画面表示のフォントサイズ（小/中/大/特大）
- **Language**: アプリ表示言語（日本語/英語/中国語簡体字/韓国語）

#### 3.2.3 ParentChildRelationships (親子関係)
```sql
--   ParentId -> Parents(Id) (CASCADE削除)
--   ChildId -> Children(Id) (CASCADE削除)
-- チェック制約:
--   RelationshipType: 'Father', 'Mother', 'Grandfather', 'Grandmother', 'Brother', 'Sister', 'Other' のみ
CREATE TABLE ParentChildRelationships (
    ParentId INT NOT NULL,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RelationshipType NVARCHAR(20) NOT NULL DEFAULT 'Parent',
    IsPrimaryContact BIT NOT NULL DEFAULT 0,
    IsAuthorizedPickup BIT NOT NULL DEFAULT 1,
    CanReceiveReports BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT PK_ParentChildRelationships PRIMARY KEY (ParentId, NurseryId, ChildId),
    CONSTRAINT FK_ParentChildRelationships_Parents FOREIGN KEY (ParentId) REFERENCES Parents(Id),
    CONSTRAINT FK_ParentChildRelationships_Children FOREIGN KEY (NurseryId, ChildId) REFERENCES Children(NurseryId, ChildId)
);

CREATE INDEX IX_ParentChildRelationships_ChildId ON ParentChildRelationships (ChildId);
CREATE INDEX IX_ParentChildRelationships_IsPrimaryContact ON ParentChildRelationships (IsPrimaryContact) WHERE IsPrimaryContact = 1;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者と子どもの関係を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保護者ID（複合主キー第1カラム）', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID（複合主キー第2カラム）', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '子どもID（複合主キー第3カラム）', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '関係性（父・母・祖父・祖母等）', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'RelationshipType';
EXEC sp_addextendedproperty 'MS_Description', '第一連絡先フラグ', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'IsPrimaryContact';
EXEC sp_addextendedproperty 'MS_Description', 'お迎え権限有フラグ', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'IsAuthorizedPickup';
EXEC sp_addextendedproperty 'MS_Description', 'レポート受信権限有フラグ', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'CanReceiveReports';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'ParentChildRelationships', 'COLUMN', 'CreatedAt';
```

#### 3.2.4 FamilyMembers (家族メンバー)

> **家族メンバー直接登録方式**:
> - 主要保護者が家族メンバーの名前・電話番号・続柄を登録
> - 登録と同時にParentsテーブルに新規保護者アカウントが作成されます
> - FamilyMembersテーブルで保護者と園児の関係性を管理
> - 登録された家族メンバーは即座にログイン可能
> - SMS招待やコード認証は不要

```sql
CREATE TABLE FamilyMembers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ParentId INT NOT NULL,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RelationshipType NVARCHAR(20) NOT NULL,
    DisplayName NVARCHAR(100) NULL,
    IsPrimaryContact BIT NOT NULL,
    CanReceiveNotifications BIT NOT NULL DEFAULT CAST(1 AS bit),
    CanViewReports BIT NOT NULL DEFAULT CAST(1 AS bit),
    CanViewPhotos BIT NOT NULL DEFAULT CAST(1 AS bit),
    HasPickupPermission BIT NOT NULL,
    JoinedAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT (GETUTCDATE()),
    IsActive BIT NOT NULL DEFAULT CAST(1 AS bit),
    UpdatedAt DATETIME2 NULL,
    InvitedByParentId INT NULL
);

-- インデックス作成
CREATE INDEX IX_FamilyMembers_ParentId ON FamilyMembers (ParentId);  -- 保護者別の家族メンバー一覧取得
CREATE INDEX IX_FamilyMembers_ChildId ON FamilyMembers (ChildId);  -- 園児別の家族メンバー一覧取得
CREATE INDEX IX_FamilyMembers_NurseryId ON FamilyMembers (NurseryId);  -- 保育園別の家族メンバー一覧取得
CREATE INDEX IX_FamilyMembers_IsActive ON FamilyMembers (IsActive);  -- アクティブ・非アクティブフィルタリング（論理削除対応）
CREATE INDEX IX_FamilyMembers_NurseryId_ChildId ON FamilyMembers (NurseryId, ChildId);  -- 保育園・園児別の家族メンバー検索
CREATE UNIQUE INDEX IX_FamilyMembers_NurseryId_ChildId_ParentId ON FamilyMembers (NurseryId, ChildId, ParentId);  -- 同一保護者の重複登録防止

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '家族メンバーテーブル', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'メンバーID', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', '保育園ID', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'NurseryId';
EXEC sp_addextendedproperty 'MS_Description', '園児ID', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '続柄', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'RelationshipType';
EXEC sp_addextendedproperty 'MS_Description', '表示名', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'DisplayName';
EXEC sp_addextendedproperty 'MS_Description', '主連絡先フラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'IsPrimaryContact';
EXEC sp_addextendedproperty 'MS_Description', '通知受信可能フラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'CanReceiveNotifications';
EXEC sp_addextendedproperty 'MS_Description', '連絡帳閲覧可能フラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'CanViewReports';
EXEC sp_addextendedproperty 'MS_Description', '写真閲覧可能フラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'CanViewPhotos';
EXEC sp_addextendedproperty 'MS_Description', 'お迎え許可フラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'HasPickupPermission';
EXEC sp_addextendedproperty 'MS_Description', '参加日時', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'JoinedAt';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', 'アクティブフラグ', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'IsActive';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'UpdatedAt';
EXEC sp_addextendedproperty 'MS_Description', '招待元保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'FamilyMembers', 'COLUMN', 'InvitedByParentId';
```

### 3.3 機能関連テーブル

#### 3.3.1 ContactNotifications (欠席・遅刻・お迎え連絡)
```sql
--   ChildId -> Children(Id) (CASCADE削除)
--   SubmittedBy -> Parents(Id) (NO ACTION削除)
--   AcknowledgedBy -> Staff(Id) (NO ACTION削除)
-- チェック制約:
--   Type: 'Absence', 'Lateness', 'Pickup' のみ
--   Status: 'Submitted', 'Acknowledged', 'Processed', 'Cancelled' のみ
--   PickupPerson: Type='Pickup'の場合必須
--   PickupTime: Type='Pickup'の場合必須
--   ExpectedArrivalTime: Type='Lateness'の場合必須
CREATE TABLE ContactNotifications (
    Id NVARCHAR(100) PRIMARY KEY, -- contact-123形式のID
    ChildId INT NOT NULL,
    Type NVARCHAR(20) NOT NULL DEFAULT 'Absence',
    TargetDate DATE NOT NULL,
    Reason NVARCHAR(500) NOT NULL,
    PickupPerson NVARCHAR(100) NULL, -- Type='Pickup'の場合必須
    PickupTime TIME NULL, -- Type='Pickup'の場合必須
    ExpectedArrivalTime TIME NULL, -- Type='Lateness'の場合必須
    AdditionalNotes NVARCHAR(500),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Submitted',
    StaffResponse NVARCHAR(500),
    SubmittedBy INT NOT NULL, -- ParentId
    SubmittedAt DATETIME2 DEFAULT GETUTCDATE(),
    AcknowledgedAt DATETIME2 NULL,
    AcknowledgedBy INT NULL -- StaffId
);

CREATE INDEX IX_ContactNotifications_ChildId_TargetDate ON ContactNotifications (ChildId, TargetDate DESC);
CREATE INDEX IX_ContactNotifications_Status ON ContactNotifications (Status) WHERE Status IN ('Submitted', 'Acknowledged');
CREATE INDEX IX_ContactNotifications_SubmittedAt ON ContactNotifications (SubmittedAt DESC);
CREATE INDEX IX_ContactNotifications_Type ON ContactNotifications (Type);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '欠席・遅刻・お迎え連絡を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '連絡ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '対象の子どもID', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', '連絡種類（欠席・遅刻・お迎え）', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'Type';
EXEC sp_addextendedproperty 'MS_Description', '対象日', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'TargetDate';
EXEC sp_addextendedproperty 'MS_Description', '連絡理由', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'Reason';
EXEC sp_addextendedproperty 'MS_Description', 'お迎え者（お迎え連絡時）', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'PickupPerson';
EXEC sp_addextendedproperty 'MS_Description', 'お迎え時間（お迎え連絡時）', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'PickupTime';
EXEC sp_addextendedproperty 'MS_Description', '到着予定時刻（遅刻連絡時）', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'ExpectedArrivalTime';
EXEC sp_addextendedproperty 'MS_Description', '追加の備考・連絡事項', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'AdditionalNotes';
EXEC sp_addextendedproperty 'MS_Description', '処理状況', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'Status';
EXEC sp_addextendedproperty 'MS_Description', '職員からの返信・コメント', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'StaffResponse';
EXEC sp_addextendedproperty 'MS_Description', '連絡送信者の保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'SubmittedBy';
EXEC sp_addextendedproperty 'MS_Description', '連絡送信日時', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'SubmittedAt';
EXEC sp_addextendedproperty 'MS_Description', '職員確認日時', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'AcknowledgedAt';
EXEC sp_addextendedproperty 'MS_Description', '確認した職員ID', 'SCHEMA', 'dbo', 'TABLE', 'ContactNotifications', 'COLUMN', 'AcknowledgedBy';
```

#### 3.3.1-A AbsenceNotificationResponses (欠席連絡への返信)
```sql
--   NotificationId -> ContactNotifications(Id) (CASCADE削除)
--   ParentId -> Parents(Id) (CASCADE削除)
CREATE TABLE AbsenceNotificationResponses (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NotificationId NVARCHAR(100) NOT NULL,
    ParentId INT NOT NULL,
    ResponseText NVARCHAR(1000) NULL,
    ResponseType NVARCHAR(50) NOT NULL DEFAULT 'Comment',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AbsenceNotificationResponses_Notifications FOREIGN KEY (NotificationId) REFERENCES ContactNotifications(Id) ON DELETE CASCADE,
    CONSTRAINT FK_AbsenceNotificationResponses_Parents FOREIGN KEY (ParentId) REFERENCES Parents(Id) ON DELETE CASCADE
);

CREATE INDEX IX_AbsenceNotificationResponses_NotificationId ON AbsenceNotificationResponses (NotificationId);
CREATE INDEX IX_AbsenceNotificationResponses_ParentId ON AbsenceNotificationResponses (ParentId);
CREATE INDEX IX_AbsenceNotificationResponses_CreatedAt ON AbsenceNotificationResponses (CreatedAt DESC);

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '欠席連絡への保護者返信を管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '返信ID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '欠席連絡ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'NotificationId';
EXEC sp_addextendedproperty 'MS_Description', '返信した保護者ID（外部キー）', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'ParentId';
EXEC sp_addextendedproperty 'MS_Description', '返信内容', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'ResponseText';
EXEC sp_addextendedproperty 'MS_Description', '返信種別', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'ResponseType';
EXEC sp_addextendedproperty 'MS_Description', '返信作成日時', 'SCHEMA', 'dbo', 'TABLE', 'AbsenceNotificationResponses', 'COLUMN', 'CreatedAt';
```

#### 3.3.2 Events (イベント)
```sql
--   CreatedBy -> Staff(Id) (NO ACTION削除)
--   TargetClassId -> Classes(Id) (CASCADE削除)
-- チェック制約:
--   EndDateTime: StartDateTime以降
--   Category: 'GeneralAnnouncement', 'GeneralEvent', 'GradeActivity', 'ClassActivity', 'NurseryHoliday' のみ
--   TargetAudience: 'All', 'SpecificClass', 'SpecificChild' のみ
--   RecurrencePattern: IsRecurring=1の場合は'Daily', 'Weekly', 'Monthly'のみ
CREATE TABLE Events (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(1000),
    Category NVARCHAR(50) NOT NULL DEFAULT 'GeneralAnnouncement',
    StartDateTime DATETIME2 NOT NULL,
    EndDateTime DATETIME2 NOT NULL,
    IsAllDay BIT NOT NULL DEFAULT 0,
    IsRecurring BIT NOT NULL DEFAULT 0,
    RecurrencePattern NVARCHAR(50) NULL, -- 'Daily', 'Weekly', 'Monthly'
    TargetAudience NVARCHAR(50) NOT NULL DEFAULT 'All', -- 'All', 'SpecificClass', 'SpecificChild'
    TargetClassId NVARCHAR(50) NULL,
    RequiresPreparation BIT NOT NULL DEFAULT 0,
    PreparationInstructions NVARCHAR(1000),
    CreatedBy INT NOT NULL, -- StaffId
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Events_StartDateTime_EndDateTime ON Events (StartDateTime, EndDateTime);
CREATE INDEX IX_Events_Category ON Events (Category);
CREATE INDEX IX_Events_TargetClassId ON Events (TargetClassId) WHERE TargetClassId IS NOT NULL;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '保育園行事・イベントを管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'Events';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', 'イベントID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', 'イベントタイトル', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'Title';
EXEC sp_addextendedproperty 'MS_Description', 'イベント詳細説明', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'Description';
EXEC sp_addextendedproperty 'MS_Description', 'イベントカテゴリ', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'Category';
EXEC sp_addextendedproperty 'MS_Description', '開始日時', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'StartDateTime';
EXEC sp_addextendedproperty 'MS_Description', '終了日時', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'EndDateTime';
EXEC sp_addextendedproperty 'MS_Description', '終日イベントフラグ（週表示時は「全日」行に表示）', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'IsAllDay';
EXEC sp_addextendedproperty 'MS_Description', '繰り返しイベントフラグ', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'IsRecurring';
EXEC sp_addextendedproperty 'MS_Description', '繰り返しパターン（毎日・毎週・毎月）', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'RecurrencePattern';
EXEC sp_addextendedproperty 'MS_Description', '対象者（全体・クラス限定・個人）', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'TargetAudience';
EXEC sp_addextendedproperty 'MS_Description', '対象クラスID', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'TargetClassId';
EXEC sp_addextendedproperty 'MS_Description', '事前準備必要フラグ', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'RequiresPreparation';
EXEC sp_addextendedproperty 'MS_Description', '準備物・指示事項', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'PreparationInstructions';
EXEC sp_addextendedproperty 'MS_Description', '作成者（スタッフID）', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'CreatedBy';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'Events', 'COLUMN', 'UpdatedAt';
```

#### 3.3.3 DailyReports (日次レポート)
```sql
--   ChildId -> Children(Id) (CASCADE削除)
--   StaffMemberId -> Staff(Id) (NO ACTION削除)
--   AcknowledgedBy -> Parents(Id) (NO ACTION削除)
-- チェック制約:
--   Type: 'Daily', 'Meal', 'Health', 'Incident', 'Sleep' のみ
--   ReportDate: '2024-01-01'以降
CREATE TABLE DailyReports (
    Id NVARCHAR(100) PRIMARY KEY, -- report-123形式のID
    ChildId INT NOT NULL,
    ChildName NVARCHAR(100) NOT NULL,
    ReportDate DATE NOT NULL,
    Tags NVARCHAR(500) NOT NULL, -- JSON配列: ["活動", "食事", "睡眠", "ケガ", "事故", "喧嘩"]
    StaffMember NVARCHAR(100) NOT NULL,
    StaffPhoto NVARCHAR(500) NULL,
    Content NVARCHAR(MAX) NOT NULL, -- JSON形式でレポート詳細を保存
    Attachments NVARCHAR(MAX) NULL, -- JSON配列形式で添付ファイル情報を保存
    ParentAcknowledged BIT NOT NULL DEFAULT 0,
    AcknowledgedAt DATETIME2 NULL,
    ParentNote NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX IX_DailyReports_ChildId_ReportDate ON DailyReports (ChildId, ReportDate DESC);
CREATE INDEX IX_DailyReports_Tags ON DailyReports (Tags);
CREATE INDEX IX_DailyReports_ParentAcknowledged ON DailyReports (ParentAcknowledged) WHERE ParentAcknowledged = 0;

-- テーブルコメント追加
EXEC sp_addextendedproperty 'MS_Description', '子どもの日常レポートを管理するテーブル', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports';

-- カラムコメント追加
EXEC sp_addextendedproperty 'MS_Description', '日常レポートID（主キー）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Id';
EXEC sp_addextendedproperty 'MS_Description', '対象の子どもID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ChildId';
EXEC sp_addextendedproperty 'MS_Description', 'レポート対象日', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ReportDate';
EXEC sp_addextendedproperty 'MS_Description', 'レポート種別（日常・食事・健康等）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Type';
EXEC sp_addextendedproperty 'MS_Description', 'レポート内容（JSON形式）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'Content';
EXEC sp_addextendedproperty 'MS_Description', '作成者（スタッフID）', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'StaffMemberId';
EXEC sp_addextendedproperty 'MS_Description', '保護者応答必要フラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'RequiresParentResponse';
EXEC sp_addextendedproperty 'MS_Description', '保護者確認済みフラグ', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'ParentAcknowledged';
EXEC sp_addextendedproperty 'MS_Description', '保護者確認日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'AcknowledgedAt';
EXEC sp_addextendedproperty 'MS_Description', '確認した保護者ID', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'AcknowledgedBy';
EXEC sp_addextendedproperty 'MS_Description', '作成日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'CreatedAt';
EXEC sp_addextendedproperty 'MS_Description', '更新日時', 'SCHEMA', 'dbo', 'TABLE', 'DailyReports', 'COLUMN', 'UpdatedAt';
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
    RequiresConsent BIT DEFAULT 1 NOT NULL,
    ViewCount INT DEFAULT 0 NOT NULL,
    DownloadCount INT DEFAULT 0 NOT NULL,
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
EXEC sp_addextendedproperty 'MS_Description', '保護者同意が必要か', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'RequiresConsent';
EXEC sp_addextendedproperty 'MS_Description', '閲覧回数', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'ViewCount';
EXEC sp_addextendedproperty 'MS_Description', 'ダウンロード回数', 'SCHEMA', 'dbo', 'TABLE', 'Photos', 'COLUMN', 'DownloadCount';
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