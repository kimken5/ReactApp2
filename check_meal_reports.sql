-- Check all reports with 'meal' in ReportKind
SELECT Id, ChildId, ReportKind, Title, ReportDate, Status
FROM DailyReports
WHERE ReportKind LIKE '%meal%'
ORDER BY Id;
