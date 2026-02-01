-- ============================================
-- 休園日・休日保育管理テーブル作成スクリプト
-- ============================================

-- NurseryDayTypes（休園日・休日保育）テーブル
CREATE TABLE [dbo].[NurseryDayTypes] (
  [Id] INT IDENTITY(1,1) NOT NULL
  , [NurseryId] NVARCHAR(50) NOT NULL
  , [Date] DATE NOT NULL
  , [DayType] NVARCHAR(20) NOT NULL
  , [CreatedBy] INT NOT NULL
  , [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
  , [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
)
/

-- 主キーの作成
ALTER TABLE [dbo].[NurseryDayTypes] ADD CONSTRAINT [PK__NurseryDayTypes] PRIMARY KEY ([Id])
/

-- ユニーク制約: 同じ保育園・同じ日付で重複不可
ALTER TABLE [dbo].[NurseryDayTypes] ADD CONSTRAINT [UQ_NurseryDayTypes_NurseryId_Date] UNIQUE ([NurseryId], [Date])
/

-- インデックスの作成
CREATE INDEX [IX_NurseryDayTypes_NurseryId_Date] ON [dbo].[NurseryDayTypes]([NurseryId], [Date])
/

CREATE INDEX [IX_NurseryDayTypes_Date] ON [dbo].[NurseryDayTypes]([Date])
/

CREATE INDEX [IX_NurseryDayTypes_DayType] ON [dbo].[NurseryDayTypes]([DayType])
/

-- コメントの作成
EXECUTE sp_addextendedproperty N'MS_Description', N'休園日・休日保育管理', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', NULL, NULL
/

EXECUTE sp_addextendedproperty N'MS_Description', N'ID', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'Id'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'保育園ID', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'NurseryId'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'日付', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'Date'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'日付種別（ClosedDay:休園日 / HolidayCare:休日保育）', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'DayType'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'作成者ID', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'CreatedBy'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'作成日時', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'CreatedAt'
/

EXECUTE sp_addextendedproperty N'MS_Description', N'更新日時', N'SCHEMA', N'dbo', N'TABLE', N'NurseryDayTypes', N'COLUMN', N'UpdatedAt'
/

-- ============================================
-- スクリプト実行完了
-- ============================================
