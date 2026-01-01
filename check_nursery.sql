-- Nurseriesテーブルの全データを確認
SELECT Id, Name, ApplicationKey, LoginId
FROM Nurseries;

-- ApplicationKeyが設定されているレコードのみ
SELECT Id, Name, ApplicationKey
FROM Nurseries
WHERE ApplicationKey IS NOT NULL;

-- NurseryId=1のApplicationKeyを確認
SELECT Id, Name, ApplicationKey
FROM Nurseries
WHERE Id = 1;
