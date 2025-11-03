-- Childrenテーブルにふりがなカラムを追加
-- 作成日: 2025-11-03

-- ふりがなカラムの追加（既存データに対してはNULL許容）
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Children]')
    AND name = 'Furigana'
)
BEGIN
    ALTER TABLE [dbo].[Children]
    ADD [Furigana] NVARCHAR(100) NULL;

    PRINT 'Furiganaカラムを追加しました';
END
ELSE
BEGIN
    PRINT 'Furiganaカラムは既に存在します';
END
GO

-- カラムの説明を追加
IF NOT EXISTS (
    SELECT 1
    FROM sys.extended_properties
    WHERE major_id = OBJECT_ID(N'[dbo].[Children]')
    AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Children]') AND name = 'Furigana')
    AND name = 'MS_Description'
)
BEGIN
    EXECUTE sp_addextendedproperty
        N'MS_Description', N'ふりがな',
        N'SCHEMA', N'dbo',
        N'TABLE', N'Children',
        N'COLUMN', N'Furigana';

    PRINT 'Furiganaカラムの説明を追加しました';
END
ELSE
BEGIN
    PRINT 'Furiganaカラムの説明は既に存在します';
END
GO
