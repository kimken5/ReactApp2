-- テストデータ準備スクリプト
-- 入園申込API動作確認用のApplicationKeyを設定

-- Nursery#1にApplicationKeyを設定
UPDATE Nurseries
SET ApplicationKey = 'test-application-key-2025'
WHERE Id = 1;

-- 確認
SELECT
    Id,
    Name,
    ApplicationKey
FROM Nurseries
WHERE Id = 1;
