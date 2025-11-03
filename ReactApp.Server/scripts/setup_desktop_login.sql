SET QUOTED_IDENTIFIER ON;
GO

-- Desktop login setup: LoginId=demo, Password=password
UPDATE Nurseries
SET
    LoginId = 'demo',
    Password = '$2a$10$N9qo8uLOickgx2ZMRZoMye/EhJr.uSKvb3UOPKRjl1i9B0jC9dKTm',
    UpdatedAt = GETUTCDATE()
WHERE Id = 1;
GO

PRINT 'Desktop login configured: LoginId=demo, Password=password';
GO
