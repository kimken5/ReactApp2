-- DailyReportsテーブルに保護者確認フィールドを追加

BEGIN TRY
    PRINT '=== DailyReports確認フィールド追加開始 ===';

    -- ParentAcknowledged カラム追加
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_NAME = 'DailyReports' AND COLUMN_NAME = 'ParentAcknowledged')
    BEGIN
        ALTER TABLE [DailyReports] ADD [ParentAcknowledged] BIT NOT NULL DEFAULT 0;
        PRINT 'DailyReports.ParentAcknowledged カラム追加完了';
    END
    ELSE
    BEGIN
        PRINT 'DailyReports.ParentAcknowledged カラムは既に存在';
    END

    -- AcknowledgedAt カラム追加
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_NAME = 'DailyReports' AND COLUMN_NAME = 'AcknowledgedAt')
    BEGIN
        ALTER TABLE [DailyReports] ADD [AcknowledgedAt] DATETIME2 NULL;
        PRINT 'DailyReports.AcknowledgedAt カラム追加完了';
    END
    ELSE
    BEGIN
        PRINT 'DailyReports.AcknowledgedAt カラムは既に存在';
    END

    PRINT '=== DailyReports確認フィールド追加完了 ===';

END TRY
BEGIN CATCH
    PRINT '=== エラー発生：カラム追加失敗 ===';
    PRINT 'エラーメッセージ: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
