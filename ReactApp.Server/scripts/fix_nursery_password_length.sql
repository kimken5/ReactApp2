SET QUOTED_IDENTIFIER ON;
GO

-- Extend Nurseries.Password column to VARCHAR(255) for BCrypt hashes
IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Nurseries' AND COLUMN_NAME = 'Password'
)
BEGIN
    ALTER TABLE Nurseries ALTER COLUMN Password NVARCHAR(255) NULL;
    PRINT 'Password column extended to 255 characters';
END
GO

-- Set demo login credentials
UPDATE Nurseries
SET
    LoginId = 'demo',
    Password = '$2a$10$N9qo8uLOickgx2ZMRZoMye/EhJr.uSKvb3UOPKRjl1i9B0jC9dKTm',
    UpdatedAt = GETUTCDATE()
WHERE Id = 1;
GO

PRINT 'Desktop login configured: LoginId=demo, Password=password';
GO
