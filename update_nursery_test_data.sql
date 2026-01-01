-- 保育園テーブルに園長名と設立日のテストデータを追加
UPDATE Nurseries
SET
    PrincipalName = N'田中 花子',
    EstablishedDate = '2015-04-01'
WHERE Id = 1;

-- 更新結果を確認
SELECT
    Id,
    Name,
    PrincipalName,
    EstablishedDate,
    Address,
    PhoneNumber,
    Email
FROM Nurseries
WHERE Id = 1;
