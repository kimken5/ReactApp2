-- ParentsテーブルにNurseryIdカラムを追加するスクリプト
-- マイグレーション: 20251120121714_AddNurseryIdToParents

-- NurseryIdカラムが既に存在するかチェック
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Parents'
    AND COLUMN_NAME = 'NurseryId'
)
BEGIN
    -- NurseryIdカラムを追加（既存レコードにはデフォルト値1を設定）
    ALTER TABLE [Parents]
    ADD [NurseryId] int NOT NULL DEFAULT 1;

    PRINT 'NurseryIdカラムを追加しました。';
END
ELSE
BEGIN
    PRINT 'NurseryIdカラムは既に存在します。';
END
GO

-- ユニークインデックスが既に存在するかチェック
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Parents_PhoneNumber_Unique'
    AND object_id = OBJECT_ID('Parents')
)
BEGIN
    -- 既存のPhoneNumberのみのユニークインデックスがあれば削除
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID('Parents')
        AND is_unique = 1
        AND EXISTS (
            SELECT 1
            FROM sys.index_columns ic
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE ic.object_id = object_id
            AND c.name = 'PhoneNumber'
        )
    )
    BEGIN
        DECLARE @OldIndexName NVARCHAR(200);
        SELECT TOP 1 @OldIndexName = i.name
        FROM sys.indexes i
        WHERE i.object_id = OBJECT_ID('Parents')
        AND i.is_unique = 1
        AND EXISTS (
            SELECT 1
            FROM sys.index_columns ic
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE ic.object_id = i.object_id
            AND ic.index_id = i.index_id
            AND c.name = 'PhoneNumber'
        );

        IF @OldIndexName IS NOT NULL
        BEGIN
            DECLARE @DropIndexSQL NVARCHAR(500) = 'DROP INDEX [' + @OldIndexName + '] ON [Parents]';
            EXEC sp_executesql @DropIndexSQL;
            PRINT '既存のPhoneNumberユニークインデックスを削除しました: ' + @OldIndexName;
        END
    END

    -- 新しい複合ユニークインデックスを作成（PhoneNumber + NurseryId）
    CREATE UNIQUE INDEX [IX_Parents_PhoneNumber_Unique]
    ON [Parents] ([PhoneNumber], [NurseryId]);

    PRINT '複合ユニークインデックス IX_Parents_PhoneNumber_Unique を作成しました。';
END
ELSE
BEGIN
    PRINT 'ユニークインデックス IX_Parents_PhoneNumber_Unique は既に存在します。';
END
GO

-- 確認クエリ
SELECT
    'NurseryIdカラム存在確認' AS [確認項目],
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Parents'
            AND COLUMN_NAME = 'NurseryId'
        ) THEN '存在する'
        ELSE '存在しない'
    END AS [状態]
UNION ALL
SELECT
    'ユニークインデックス存在確認' AS [確認項目],
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'IX_Parents_PhoneNumber_Unique'
            AND object_id = OBJECT_ID('Parents')
        ) THEN '存在する'
        ELSE '存在しない'
    END AS [状態];
GO
