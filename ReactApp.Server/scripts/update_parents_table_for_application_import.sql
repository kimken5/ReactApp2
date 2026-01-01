-- =====================================================
-- 保護者マスタテーブル拡張スクリプト
-- 入園申込ワークテーブルからの完全データ取込対応
-- =====================================================
-- 作成日: 2025-12-10
-- 目的: ApplicationWorkテーブルの保護者情報を全て取り込めるよう
--       Parentsテーブルに不足しているフィールドを追加
-- =====================================================

-- 実行前の確認
PRINT '=== 保護者マスタテーブル拡張スクリプト開始 ==='
PRINT '実行日時: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT ''

-- トランザクション開始
BEGIN TRANSACTION;

BEGIN TRY

    -- =====================================================
    -- 1. ふりがなフィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'NameKana'
    )
    BEGIN
        PRINT '1. NameKana フィールドを追加中...'
        ALTER TABLE Parents
        ADD NameKana NVARCHAR(100) NULL;
        PRINT '   ✓ NameKana フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '1. NameKana フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 2. 生年月日フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'DateOfBirth'
    )
    BEGIN
        PRINT '2. DateOfBirth フィールドを追加中...'
        ALTER TABLE Parents
        ADD DateOfBirth DATE NULL;
        PRINT '   ✓ DateOfBirth フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '2. DateOfBirth フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 3. 郵便番号フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'PostalCode'
    )
    BEGIN
        PRINT '3. PostalCode フィールドを追加中...'
        ALTER TABLE Parents
        ADD PostalCode NVARCHAR(8) NULL;
        PRINT '   ✓ PostalCode フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '3. PostalCode フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 4. 都道府県フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'Prefecture'
    )
    BEGIN
        PRINT '4. Prefecture フィールドを追加中...'
        ALTER TABLE Parents
        ADD Prefecture NVARCHAR(10) NULL;
        PRINT '   ✓ Prefecture フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '4. Prefecture フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 5. 市区町村フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'City'
    )
    BEGIN
        PRINT '5. City フィールドを追加中...'
        ALTER TABLE Parents
        ADD City NVARCHAR(50) NULL;
        PRINT '   ✓ City フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '5. City フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 6. 番地・建物名フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'AddressLine'
    )
    BEGIN
        PRINT '6. AddressLine フィールドを追加中...'
        ALTER TABLE Parents
        ADD AddressLine NVARCHAR(200) NULL;
        PRINT '   ✓ AddressLine フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '6. AddressLine フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 7. 携帯電話フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'MobilePhone'
    )
    BEGIN
        PRINT '7. MobilePhone フィールドを追加中...'
        ALTER TABLE Parents
        ADD MobilePhone NVARCHAR(20) NULL;

        -- 既存のPhoneNumberデータをMobilePhoneにコピー
        PRINT '   既存のPhoneNumberデータをMobilePhoneにコピー中...'
        UPDATE Parents
        SET MobilePhone = PhoneNumber;

        PRINT '   ✓ MobilePhone フィールド追加完了'
        PRINT '   ✓ 既存データのコピー完了'
    END
    ELSE
    BEGIN
        PRINT '7. MobilePhone フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 8. 固定電話フィールド追加
    -- =====================================================
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('Parents')
        AND name = 'HomePhone'
    )
    BEGIN
        PRINT '8. HomePhone フィールドを追加中...'
        ALTER TABLE Parents
        ADD HomePhone NVARCHAR(20) NULL;
        PRINT '   ✓ HomePhone フィールド追加完了'
    END
    ELSE
    BEGIN
        PRINT '8. HomePhone フィールドは既に存在します (スキップ)'
    END

    -- =====================================================
    -- 9. インデックス作成
    -- =====================================================

    -- MobilePhoneのインデックス作成
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Parents_MobilePhone'
        AND object_id = OBJECT_ID('Parents')
    )
    BEGIN
        PRINT '9. MobilePhoneのインデックスを作成中...'
        CREATE INDEX IX_Parents_MobilePhone
        ON Parents(MobilePhone);
        PRINT '   ✓ IX_Parents_MobilePhone インデックス作成完了'
    END
    ELSE
    BEGIN
        PRINT '9. IX_Parents_MobilePhone インデックスは既に存在します (スキップ)'
    END

    -- PostalCodeのインデックス作成
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Parents_PostalCode'
        AND object_id = OBJECT_ID('Parents')
    )
    BEGIN
        PRINT '10. PostalCodeのインデックスを作成中...'
        CREATE INDEX IX_Parents_PostalCode
        ON Parents(PostalCode);
        PRINT '   ✓ IX_Parents_PostalCode インデックス作成完了'
    END
    ELSE
    BEGIN
        PRINT '10. IX_Parents_PostalCode インデックスは既に存在します (スキップ)'
    END

    -- =====================================================
    -- コミット
    -- =====================================================
    COMMIT TRANSACTION;

    PRINT ''
    PRINT '=== 保護者マスタテーブル拡張スクリプト完了 ==='
    PRINT '全ての変更が正常に適用されました。'
    PRINT ''

    -- 最終的なテーブル構造確認
    PRINT '=== 更新後のParentsテーブル構造 ==='
    SELECT
        COLUMN_NAME AS [フィールド名],
        DATA_TYPE AS [データ型],
        CHARACTER_MAXIMUM_LENGTH AS [最大長],
        IS_NULLABLE AS [NULL許可]
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Parents'
    ORDER BY ORDINAL_POSITION;

END TRY
BEGIN CATCH
    -- エラー発生時はロールバック
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT ''
    PRINT '=== エラーが発生しました ==='
    PRINT 'エラー番号: ' + CAST(ERROR_NUMBER() AS VARCHAR)
    PRINT 'エラーメッセージ: ' + ERROR_MESSAGE()
    PRINT 'エラー行: ' + CAST(ERROR_LINE() AS VARCHAR)
    PRINT ''
    PRINT '全ての変更がロールバックされました。'

    -- エラーを再スロー
    THROW;
END CATCH

GO

-- =====================================================
-- 検証クエリ
-- =====================================================
PRINT ''
PRINT '=== 追加フィールドの検証 ==='
PRINT ''

-- 各フィールドの存在確認
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'NameKana')
        THEN '✓' ELSE '✗'
    END AS [NameKana],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'DateOfBirth')
        THEN '✓' ELSE '✗'
    END AS [DateOfBirth],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'PostalCode')
        THEN '✓' ELSE '✗'
    END AS [PostalCode],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'Prefecture')
        THEN '✓' ELSE '✗'
    END AS [Prefecture],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'City')
        THEN '✓' ELSE '✗'
    END AS [City],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'AddressLine')
        THEN '✓' ELSE '✗'
    END AS [AddressLine],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'MobilePhone')
        THEN '✓' ELSE '✗'
    END AS [MobilePhone],
    CASE
        WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Parents') AND name = 'HomePhone')
        THEN '✓' ELSE '✗'
    END AS [HomePhone];

PRINT ''
PRINT '=== スクリプト実行完了 ==='
