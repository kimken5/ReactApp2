-- ApplicationWorksテーブルの全データを確認
SELECT
    Id,
    ApplicantName,
    ChildName,
    ApplicationStatus,
    IsImported,
    CreatedAt,
    NurseryId
FROM ApplicationWorks
ORDER BY CreatedAt DESC;

-- カウントを確認
SELECT COUNT(*) AS TotalCount
FROM ApplicationWorks;

-- NurseryId=1の申込を確認
SELECT *
FROM ApplicationWorks
WHERE NurseryId = 1;
