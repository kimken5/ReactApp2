-- ========================================
-- 入園申込ワークテーブル作成スクリプト
-- ========================================

-- テーブル作成
CREATE TABLE [dbo].[ApplicationWork] (
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
    [EmergencyContact] NVARCHAR(20),
    [Email] NVARCHAR(255),
    [RelationshipToChild] NVARCHAR(20) NOT NULL,

    -- 園児情報
    [ChildName] NVARCHAR(100) NOT NULL,
    [ChildNameKana] NVARCHAR(100) NOT NULL,
    [ChildDateOfBirth] DATE NOT NULL,
    [ChildGender] NVARCHAR(2) NOT NULL,
    [ChildBloodType] NVARCHAR(10),
    [ChildMedicalNotes] NVARCHAR(1000),
    [ChildSpecialInstructions] NVARCHAR(1000),

    -- 申込管理情報
    [ApplicationStatus] NVARCHAR(20) DEFAULT 'Pending' NOT NULL,
    [IsImported] BIT DEFAULT 0 NOT NULL,
    [ImportedAt] DATETIME2,
    [ImportedByUserId] INT,
    [CreatedAt] DATETIME2 DEFAULT GETUTCDATE() NOT NULL,
    [UpdatedAt] DATETIME2,
    [RejectionReason] NVARCHAR(500),

    CONSTRAINT [PK_ApplicationWork] PRIMARY KEY ([Id])
)
GO

-- インデックス作成
CREATE INDEX [IX_ApplicationWork_NurseryId] ON [dbo].[ApplicationWork]([NurseryId])
GO

CREATE INDEX [IX_ApplicationWork_MobilePhone] ON [dbo].[ApplicationWork]([MobilePhone])
GO

CREATE INDEX [IX_ApplicationWork_ApplicationStatus] ON [dbo].[ApplicationWork]([ApplicationStatus])
GO

CREATE INDEX [IX_ApplicationWork_IsImported] ON [dbo].[ApplicationWork]([IsImported])
GO

CREATE INDEX [IX_ApplicationWork_CreatedAt] ON [dbo].[ApplicationWork]([CreatedAt])
GO

-- テーブルコメント
EXECUTE sp_addextendedproperty
    N'MS_Description', N'入園申込ワークテーブル',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', NULL, NULL
GO

-- カラムコメント
EXECUTE sp_addextendedproperty N'MS_Description', N'申込ID',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'Id'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'NurseryId'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'申請保護者氏名',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ApplicantName'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'申請保護者フリガナ',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ApplicantNameKana'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'保護者生年月日',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'DateOfBirth'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'郵便番号',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'PostalCode'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'都道府県',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'Prefecture'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'市区郡町村',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'City'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'番地・ビル名等',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'AddressLine'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'電話番号（携帯）',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'MobilePhone'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'電話番号（固定）',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'HomePhone'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'緊急連絡先',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'EmergencyContact'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'メールアドレス',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'Email'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'お子様との続柄',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'RelationshipToChild'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児氏名',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildName'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児フリガナ',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildNameKana'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児生年月日',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildDateOfBirth'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児性別',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildGender'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児血液型',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildBloodType'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児医療メモ',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildMedicalNotes'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'園児特別指示',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ChildSpecialInstructions'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'申込状態（Pending/Approved/Rejected/Imported）',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ApplicationStatus'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'取込済みフラグ',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'IsImported'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'取込日時',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ImportedAt'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'取込実行者ID',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'ImportedByUserId'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'申込受付日時',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'CreatedAt'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'UpdatedAt'
GO

EXECUTE sp_addextendedproperty N'MS_Description', N'却下理由',
    N'SCHEMA', N'dbo', N'TABLE', N'ApplicationWork', N'COLUMN', N'RejectionReason'
GO
