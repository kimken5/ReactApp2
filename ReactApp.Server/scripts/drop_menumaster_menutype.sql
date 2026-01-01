-- ============================================
-- MenuMaster.MenuType カラム削除スクリプト
-- ============================================

-- 事前確認: MenuTypeカラムが存在するか確認
IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MenuMaster'
    AND COLUMN_NAME = 'MenuType'
)
BEGIN
    PRINT 'MenuMaster.MenuType カラムが見つかりました。削除を開始します。';

    -- インデックスが存在する場合は削除
    IF EXISTS (
        SELECT *
        FROM sys.indexes
        WHERE name = 'IX_MenuMaster_MenuType'
        AND object_id = OBJECT_ID('MenuMaster')
    )
    BEGIN
        DROP INDEX IX_MenuMaster_MenuType ON MenuMaster;
        PRINT 'インデックス IX_MenuMaster_MenuType を削除しました。';
    END

    -- MenuType列を削除
    ALTER TABLE MenuMaster DROP COLUMN MenuType;
    PRINT 'MenuMaster.MenuType カラムを削除しました。';

    PRINT '完了: MenuMasterテーブルが新スキーマに移行されました。';
END
ELSE
BEGIN
    PRINT 'MenuMaster.MenuType カラムは既に削除されています。';
END
