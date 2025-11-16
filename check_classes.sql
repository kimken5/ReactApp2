-- Classesテーブルの内容確認
SELECT TOP 10
    NurseryId,
    ClassId,
    Name,
    AgeGroupMin,
    AgeGroupMax,
    MaxCapacity,
    AcademicYear,
    IsActive,
    CreatedAt
FROM Classes
ORDER BY CreatedAt DESC;

-- Childrenテーブルの内容確認（ClassId別のカウント）
SELECT
    ClassId,
    COUNT(*) AS ChildCount
FROM Children
WHERE IsActive = 1
GROUP BY ClassId
ORDER BY ClassId;

-- StaffClassAssignmentsテーブルの内容確認
SELECT TOP 10
    NurseryId,
    StaffId,
    ClassId,
    AssignmentRole,
    IsActive,
    CreatedAt
FROM StaffClassAssignments
WHERE IsActive = 1
ORDER BY CreatedAt DESC;
