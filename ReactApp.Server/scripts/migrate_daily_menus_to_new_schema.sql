-- ============================================
-- DailyMenusテーブル マイグレーションスクリプト
-- 既存テーブルを新スキーマに移行
-- ============================================

-- 実行前バックアップ
SELECT * INTO DailyMenus_Backup_20250101 FROM DailyMenus;
SELECT * INTO MenuMaster_Backup_20250101 FROM MenuMaster;

-- ステップ1: MenuMasterからMenuType列を削除
-- （MenuMasterに既存データがある場合は、MenuTypeの種類に関わらず全て保持）
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MenuMaster' AND COLUMN_NAME = 'MenuType')
BEGIN
    -- MenuTypeのインデックス削除
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MenuMaster_MenuType')
        DROP INDEX IX_MenuMaster_MenuType ON MenuMaster;

    -- MenuType列削除
    ALTER TABLE MenuMaster DROP COLUMN MenuType;

    PRINT 'MenuMaster.MenuType列を削除しました';
END

-- ステップ2: DailyMenusテーブルの構造変更

-- 2-1: 新しいカラムを追加
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'SortOrder')
BEGIN
    ALTER TABLE DailyMenus ADD SortOrder INT NOT NULL DEFAULT 0;
    PRINT 'DailyMenus.SortOrder列を追加しました';

    -- SortOrderインデックス追加
    CREATE INDEX IX_DailyMenus_SortOrder ON DailyMenus(SortOrder);
END

-- 2-2: CustomMenuNameを使用している既存データを献立マスターに移行
-- CustomMenuNameが設定されていて MenuMasterId が NULL のデータを処理
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'CustomMenuName')
BEGIN
    DECLARE @processedCount INT = 0;

    -- CustomMenuNameを持つレコードを献立マスターに登録
    INSERT INTO MenuMaster (NurseryId, MenuName, IngredientName, Allergens, Description, CreatedAt, UpdatedAt)
    SELECT DISTINCT
        d.NurseryId,
        d.CustomMenuName,
        d.IngredientName,
        d.Allergens,
        d.Description,
        GETUTCDATE(),
        GETUTCDATE()
    FROM DailyMenus d
    WHERE d.CustomMenuName IS NOT NULL
      AND d.MenuMasterId IS NULL
      AND d.CustomMenuName NOT IN (SELECT MenuName FROM MenuMaster WHERE NurseryId = d.NurseryId);

    SET @processedCount = @@ROWCOUNT;
    PRINT CONCAT('CustomMenuNameから献立マスターに', @processedCount, '件登録しました');

    -- DailyMenusのMenuMasterIdを更新
    UPDATE d
    SET d.MenuMasterId = m.Id
    FROM DailyMenus d
    INNER JOIN MenuMaster m ON m.MenuName = d.CustomMenuName AND m.NurseryId = d.NurseryId
    WHERE d.MenuMasterId IS NULL AND d.CustomMenuName IS NOT NULL;

    SET @processedCount = @@ROWCOUNT;
    PRINT CONCAT('DailyMenusのMenuMasterIdを', @processedCount, '件更新しました');
END

-- 2-3: MenuMasterIdがまだNULLのレコードを確認（あってはいけない）
IF EXISTS (SELECT 1 FROM DailyMenus WHERE MenuMasterId IS NULL)
BEGIN
    PRINT 'エラー: MenuMasterIdがNULLのレコードが存在します。手動で対応が必要です。';
    SELECT * FROM DailyMenus WHERE MenuMasterId IS NULL;
    -- 以降の処理を中断
    RETURN;
END

-- 2-4: MenuMasterIdをNOT NULLに変更
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'MenuMasterId' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE DailyMenus ALTER COLUMN MenuMasterId INT NOT NULL;
    PRINT 'DailyMenus.MenuMasterIdをNOT NULLに変更しました';
END

-- 2-5: 外部キー制約追加
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_DailyMenus_MenuMaster')
BEGIN
    ALTER TABLE DailyMenus ADD CONSTRAINT FK_DailyMenus_MenuMaster
        FOREIGN KEY (MenuMasterId) REFERENCES MenuMaster(Id);
    PRINT '外部キー制約 FK_DailyMenus_MenuMaster を追加しました';
END

-- 2-6: ユニーク制約追加（同じ日・同じタイプで同じ献立マスターは重複不可）
-- 既存の重複データがあればエラーになるので事前チェック
IF EXISTS (
    SELECT MenuDate, MenuType, MenuMasterId, COUNT(*)
    FROM DailyMenus
    GROUP BY NurseryId, MenuDate, MenuType, MenuMasterId
    HAVING COUNT(*) > 1
)
BEGIN
    PRINT '警告: 重複データが存在します。ユニーク制約を追加できません。';
    SELECT NurseryId, MenuDate, MenuType, MenuMasterId, COUNT(*) AS DuplicateCount
    FROM DailyMenus
    GROUP BY NurseryId, MenuDate, MenuType, MenuMasterId
    HAVING COUNT(*) > 1;
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_DailyMenus_Date_Type_Master')
    BEGIN
        ALTER TABLE DailyMenus ADD CONSTRAINT UQ_DailyMenus_Date_Type_Master
            UNIQUE (NurseryId, MenuDate, MenuType, MenuMasterId);
        PRINT 'ユニーク制約 UQ_DailyMenus_Date_Type_Master を追加しました';
    END
END

-- 2-7: 不要なカラムを削除
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'CustomMenuName')
BEGIN
    ALTER TABLE DailyMenus DROP COLUMN CustomMenuName;
    PRINT 'DailyMenus.CustomMenuName列を削除しました';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'IngredientName')
BEGIN
    ALTER TABLE DailyMenus DROP COLUMN IngredientName;
    PRINT 'DailyMenus.IngredientName列を削除しました';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'Allergens')
BEGIN
    ALTER TABLE DailyMenus DROP COLUMN Allergens;
    PRINT 'DailyMenus.Allergens列を削除しました';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DailyMenus' AND COLUMN_NAME = 'Description')
BEGIN
    ALTER TABLE DailyMenus DROP COLUMN Description;
    PRINT 'DailyMenus.Description列を削除しました';
END

-- ステップ3: 拡張プロパティ（説明）の更新
-- MenuMaster
IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('MenuMaster') AND name = 'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('MenuMaster') AND name = 'MenuName'))
BEGIN
    EXEC sp_dropextendedproperty
        @name = N'MS_Description',
        @level0type = N'SCHEMA', @level0name = 'dbo',
        @level1type = N'TABLE', @level1name = 'MenuMaster',
        @level2type = N'COLUMN', @level2name = 'MenuName';
END

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'献立名（例：カレーライス、白身魚のフライ、みかん）',
    @level0type = N'SCHEMA', @level0name = 'dbo',
    @level1type = N'TABLE', @level1name = 'MenuMaster',
    @level2type = N'COLUMN', @level2name = 'MenuName';

-- DailyMenus.SortOrder
IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('DailyMenus') AND name = 'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('DailyMenus') AND name = 'SortOrder'))
BEGIN
    EXEC sp_addextendedproperty
        @name = N'MS_Description',
        @value = N'表示順（同じ日・種類内での並び順）',
        @level0type = N'SCHEMA', @level0name = 'dbo',
        @level1type = N'TABLE', @level1name = 'DailyMenus',
        @level2type = N'COLUMN', @level2name = 'SortOrder';
END

PRINT '============================================';
PRINT 'マイグレーション完了';
PRINT '============================================';
PRINT '';
PRINT '変更内容:';
PRINT '1. MenuMaster.MenuType列を削除（献立はタイプに関係なく全て共通）';
PRINT '2. DailyMenus.SortOrder列を追加（同じ日・タイプで複数献立の並び順管理）';
PRINT '3. DailyMenus.CustomMenuName, IngredientName, Allergens, Description列を削除';
PRINT '4. DailyMenus.MenuMasterIdをNOT NULLに変更';
PRINT '5. 外部キー制約とユニーク制約を追加';
PRINT '';
PRINT 'バックアップテーブル: DailyMenus_Backup_20250101, MenuMaster_Backup_20250101';
