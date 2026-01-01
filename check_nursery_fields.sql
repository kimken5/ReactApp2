-- 保育園テーブルの園長名と設立日を確認
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
