SET QUOTED_IDENTIFIER ON;
GO

-- Update with a fresh BCrypt hash for "password"
-- Generated using BCrypt rounds=10
UPDATE Nurseries
SET
    LoginId = 'demo',
    Password = '$2a$10$rZCGJXNZKx7vkYQkZpJ3XeaKPzm9qs4U2Ua7qkzC6z0vKZGJvZGZ2',
    LoginAttempts = 0,
    IsLocked = 0,
    LockedUntil = NULL,
    UpdatedAt = GETUTCDATE()
WHERE Id = 1;
GO

SELECT 'Password updated' AS Status, LoginId, LEN(Password) AS PasswordLength
FROM Nurseries WHERE Id = 1;
GO
