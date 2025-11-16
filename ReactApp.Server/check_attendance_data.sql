-- DailyAttendancesテーブルのデータを確認
SELECT TOP 10 
    NurseryId,
    ChildId,
    AttendanceDate,
    Status,
    Notes,
    IsActive
FROM DailyAttendances
WHERE NurseryId = 1
ORDER BY AttendanceDate DESC;

-- 園児数を確認  
SELECT COUNT(*) as ChildCount
FROM Children
WHERE NurseryId = 1 AND IsActive = 1;

-- クラスIDを確認
SELECT ClassId, Name
FROM Classes
WHERE NurseryId = 1 AND IsActive = 1;
