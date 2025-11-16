USE [kindergarten_db];
GO

SELECT Id, ChildId, ReportKind, Title, Status, ReportDate
FROM DailyReports
WHERE NurseryId = 1
  AND (ReportKind LIKE '%meal%' OR ReportKind = 'meal' OR ReportKind LIKE 'meal,%' OR ReportKind LIKE '%,meal,%' OR ReportKind LIKE '%,meal')
ORDER BY Id;
