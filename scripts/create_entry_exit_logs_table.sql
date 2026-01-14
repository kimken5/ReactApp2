-- =============================================
-- EntryExitLogs テーブル作成スクリプト
-- 保護者の入退園記録を管理するテーブル
-- 作成日: 2026-01-14
-- =============================================

-- テーブル作成
CREATE TABLE [dbo].[EntryExitLogs] (
    [Id] INT NOT NULL IDENTITY(1,1)
    , [ParentId] INT NOT NULL
    , [NurseryId] INT NOT NULL
    , [EntryType] NVARCHAR(10) NOT NULL
    , [Timestamp] DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime]()
    , [CreatedAt] DATETIME2 NOT NULL DEFAULT [dbo].[GetJstDateTime]()
)
/

-- インデックスの作成
CREATE INDEX IX_EntryExitLogs_ParentId ON [dbo].[EntryExitLogs]([ParentId])
/

CREATE INDEX IX_EntryExitLogs_NurseryId_Timestamp ON [dbo].[EntryExitLogs]([NurseryId], [Timestamp] DESC)
/

CREATE INDEX IX_EntryExitLogs_Timestamp ON [dbo].[EntryExitLogs]([Timestamp] DESC)
/

CREATE INDEX IX_EntryExitLogs_NurseryId_EntryType_Timestamp ON [dbo].[EntryExitLogs]([NurseryId], [EntryType], [Timestamp] DESC)
/

-- 主キーの作成
ALTER TABLE [dbo].[EntryExitLogs] ADD CONSTRAINT [PK_EntryExitLogs] PRIMARY KEY ([Id])
/

-- 外部キー制約の作成
ALTER TABLE [dbo].[EntryExitLogs] ADD CONSTRAINT [FK_EntryExitLogs_Parents]
    FOREIGN KEY ([ParentId]) REFERENCES [dbo].[Parents]([Id]) ON DELETE CASCADE
/

ALTER TABLE [dbo].[EntryExitLogs] ADD CONSTRAINT [FK_EntryExitLogs_Nurseries]
    FOREIGN KEY ([NurseryId]) REFERENCES [dbo].[Nurseries]([Id]) ON DELETE CASCADE
/

-- CHECK制約の作成（EntryType は 'Entry' または 'Exit' のみ）
ALTER TABLE [dbo].[EntryExitLogs] ADD CONSTRAINT [CK_EntryExitLogs_EntryType]
    CHECK ([EntryType] IN ('Entry', 'Exit'))
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'入退管理ログ', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', NULL, NULL
/

EXECUTE sp_addextendedproperty N'MS_Description', N'入退ログID', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'Id'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'保護者ID', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'ParentId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'NurseryId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'入退種別（Entry=入、Exit=出）', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'EntryType'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'入退時刻（JST）', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'Timestamp'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'レコード作成日時（JST）', N'SCHEMA', N'dbo', N'TABLE', N'EntryExitLogs', N'COLUMN', N'CreatedAt'
/

-- 完了メッセージ
PRINT 'EntryExitLogs テーブルの作成が完了しました。'
/
