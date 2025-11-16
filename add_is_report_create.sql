-- Add IsReportCreate column to Photos table
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Photos')
    AND name = 'IsReportCreate'
)
BEGIN
    ALTER TABLE Photos
    ADD IsReportCreate bit NOT NULL DEFAULT CONVERT(bit, 0);

    PRINT 'IsReportCreate column added to Photos table';
END
ELSE
BEGIN
    PRINT 'IsReportCreate column already exists in Photos table';
END
GO
