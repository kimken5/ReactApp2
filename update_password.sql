-- Update password to the correct bcrypt hash for "password"
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMye/EhJr.uSKvb3UOPKRjl1i9B0jC9dKTm
-- Plaintext: password

UPDATE Nurseries
SET
    Password = '$2a$10$N9qo8uLOickgx2ZMRZoMye/EhJr.uSKvb3UOPKRjl1i9B0jC9dKTm',
    LoginAttempts = 0,
    IsLocked = 0,
    LockedUntil = NULL,
    UpdatedAt = GETUTCDATE()
WHERE Id = 1;

SELECT Id, LoginId, LEFT(Password, 30) as PasswordHash, LoginAttempts, IsLocked
FROM Nurseries
WHERE Id = 1;
