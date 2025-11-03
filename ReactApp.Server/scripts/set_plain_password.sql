SET QUOTED_IDENTIFIER ON;
GO

-- Set plain text password for demo account
UPDATE Nurseries
SET
    Password = 'password',
    LoginAttempts = 0,
    IsLocked = 0,
    LockedUntil = NULL,
    UpdatedAt = GETUTCDATE()
WHERE Id = 1 AND LoginId = 'demo';
GO

-- Verify the update
SELECT Id, LoginId, Password, LoginAttempts, IsLocked, LockedUntil
FROM Nurseries
WHERE Id = 1;
GO

PRINT 'Password updated to plain text: password';
GO
