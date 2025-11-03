SET QUOTED_IDENTIFIER ON;
GO

-- Reset login attempts for NurseryId = 1
UPDATE Nurseries
SET
    LoginAttempts = 0,
    IsLocked = 0,
    LockedUntil = NULL
WHERE Id = 1;
GO

PRINT 'Login attempts reset for Nursery ID 1';
GO
