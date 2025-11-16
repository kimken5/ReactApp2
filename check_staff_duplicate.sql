-- スタッフテーブルの重複StaffIdチェック
SELECT StaffId, COUNT(*) as Count
FROM Staff
GROUP BY StaffId
HAVING COUNT(*) > 1;

-- お知らせで使用されているStaffIdの確認
SELECT DISTINCT StaffId
FROM Announcements
WHERE StaffId IS NOT NULL
ORDER BY StaffId;
