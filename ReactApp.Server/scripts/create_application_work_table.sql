-- 入園申込ワークテーブル作成スクリプト
-- 保護者向けWeb申込フォームから送信されたデータを一時保管

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApplicationWorks')
BEGIN
    CREATE TABLE [dbo].[ApplicationWorks] (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [NurseryId] INT NOT NULL,

        -- 申請保護者情報
        [ApplicantName] NVARCHAR(100) NOT NULL,
        [ApplicantNameKana] NVARCHAR(100) NOT NULL,
        [DateOfBirth] DATETIME2 NOT NULL,
        [PostalCode] NVARCHAR(8) NULL,
        [Prefecture] NVARCHAR(10) NULL,
        [City] NVARCHAR(50) NULL,
        [AddressLine] NVARCHAR(200) NULL,
        [MobilePhone] NVARCHAR(20) NOT NULL,
        [HomePhone] NVARCHAR(20) NULL,
        [EmergencyContact] NVARCHAR(20) NULL,
        [Email] NVARCHAR(255) NULL,
        [RelationshipToChild] NVARCHAR(20) NOT NULL,

        -- 園児情報
        [ChildName] NVARCHAR(100) NOT NULL,
        [ChildNameKana] NVARCHAR(100) NOT NULL,
        [ChildDateOfBirth] DATETIME2 NOT NULL,
        [ChildGender] NVARCHAR(2) NOT NULL,
        [ChildBloodType] NVARCHAR(10) NULL,
        [ChildMedicalNotes] NVARCHAR(1000) NULL,
        [ChildSpecialInstructions] NVARCHAR(1000) NULL,

        -- 申込管理情報
        [ApplicationStatus] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        [IsImported] BIT NOT NULL DEFAULT 0,
        [ImportedAt] DATETIME2 NULL,
        [ImportedByUserId] INT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [RejectionReason] NVARCHAR(500) NULL,

        CONSTRAINT [PK_ApplicationWorks] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    -- インデックス作成
    CREATE NONCLUSTERED INDEX [IX_ApplicationWork_NurseryId]
        ON [dbo].[ApplicationWorks]([NurseryId] ASC);

    CREATE NONCLUSTERED INDEX [IX_ApplicationWork_MobilePhone]
        ON [dbo].[ApplicationWorks]([MobilePhone] ASC);

    CREATE NONCLUSTERED INDEX [IX_ApplicationWork_ApplicationStatus]
        ON [dbo].[ApplicationWorks]([ApplicationStatus] ASC);

    CREATE NONCLUSTERED INDEX [IX_ApplicationWork_IsImported]
        ON [dbo].[ApplicationWorks]([IsImported] ASC);

    CREATE NONCLUSTERED INDEX [IX_ApplicationWork_CreatedAt]
        ON [dbo].[ApplicationWorks]([CreatedAt] DESC);

    PRINT 'ApplicationWorksテーブルを作成しました。';
END
ELSE
BEGIN
    PRINT 'ApplicationWorksテーブルは既に存在します。';
END
GO
