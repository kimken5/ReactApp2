-- NurseryId=1にApplicationKeyを設定するSQLスクリプト

-- 現在の状態を確認
SELECT Id, Name, ApplicationKey, LoginId
FROM Nurseries
WHERE Id = 1;

-- ApplicationKeyを設定（NurseryId=1）
UPDATE Nurseries
SET ApplicationKey = '12345678901234567890',
    UpdatedAt = GETUTCDATE()
WHERE Id = 1;

-- 設定後の状態を確認
SELECT Id, Name, ApplicationKey, LoginId
FROM Nurseries
WHERE Id = 1;

-- 検証：ApplicationKeyで検索できるか確認
SELECT Id, Name, ApplicationKey
FROM Nurseries
WHERE ApplicationKey = '12345678901234567890';
