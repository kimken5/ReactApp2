-- Add new columns to Parents table
-- Script to add NameKana, DateOfBirth, PostalCode, Prefecture, City, AddressLine, HomePhone

-- Check if columns already exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'NameKana')
BEGIN
    ALTER TABLE [Parents] ADD [NameKana] NVARCHAR(100) NULL;
    PRINT 'Added NameKana column';
END
ELSE
BEGIN
    PRINT 'NameKana column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE [Parents] ADD [DateOfBirth] DATETIME2 NULL;
    PRINT 'Added DateOfBirth column';
END
ELSE
BEGIN
    PRINT 'DateOfBirth column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'PostalCode')
BEGIN
    ALTER TABLE [Parents] ADD [PostalCode] NVARCHAR(10) NULL;
    PRINT 'Added PostalCode column';
END
ELSE
BEGIN
    PRINT 'PostalCode column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'Prefecture')
BEGIN
    ALTER TABLE [Parents] ADD [Prefecture] NVARCHAR(50) NULL;
    PRINT 'Added Prefecture column';
END
ELSE
BEGIN
    PRINT 'Prefecture column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'City')
BEGIN
    ALTER TABLE [Parents] ADD [City] NVARCHAR(100) NULL;
    PRINT 'Added City column';
END
ELSE
BEGIN
    PRINT 'City column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'AddressLine')
BEGIN
    ALTER TABLE [Parents] ADD [AddressLine] NVARCHAR(200) NULL;
    PRINT 'Added AddressLine column';
END
ELSE
BEGIN
    PRINT 'AddressLine column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Parents]') AND name = 'HomePhone')
BEGIN
    ALTER TABLE [Parents] ADD [HomePhone] NVARCHAR(15) NULL;
    PRINT 'Added HomePhone column';
END
ELSE
BEGIN
    PRINT 'HomePhone column already exists';
END

PRINT 'Parent detail fields migration completed successfully';
