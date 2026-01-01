using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

class Program
{
    static async Task Main()
    {
        var connStr = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;";

        var options = new DbContextOptionsBuilder<DbContext>()
            .UseSqlServer(connStr)
            .Options;

        using var context = new DbContext(options);

        Console.WriteLine("Unlocking account for Nursery ID 1...");

        var sql = @"
            UPDATE Nurseries
            SET LoginAttempts = 0,
                IsLocked = 0,
                LockedUntil = NULL,
                UpdatedAt = GETUTCDATE()
            WHERE Id = 1;

            SELECT Id, LoginId, LoginAttempts, IsLocked, LockedUntil
            FROM Nurseries
            WHERE Id = 1;
        ";

        try
        {
            await context.Database.ExecuteSqlRawAsync(
                "UPDATE Nurseries SET LoginAttempts = 0, IsLocked = 0, LockedUntil = NULL, UpdatedAt = GETUTCDATE() WHERE Id = 1"
            );

            Console.WriteLine("✅ Account unlocked successfully!");
            Console.WriteLine();
            Console.WriteLine("You can now login with:");
            Console.WriteLine("  LoginId: demo");
            Console.WriteLine("  Password: Tyuerubu551");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }
}
