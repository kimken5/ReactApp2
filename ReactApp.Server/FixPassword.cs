using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;

namespace ReactApp.Server;

public class FixPassword
{
    public static async Task<int> Main(string[] args)
    {
        Console.WriteLine("=== Plain Password Setup ===");

        var optionsBuilder = new DbContextOptionsBuilder<KindergartenDbContext>();
        optionsBuilder.UseSqlServer("Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;");

        await using var context = new KindergartenDbContext(optionsBuilder.Options);

        // Plain text password
        var password = "password";

        Console.WriteLine($"Plain Password: {password}");
        Console.WriteLine();

        // Update database
        var nursery = await context.Nurseries.FirstOrDefaultAsync(n => n.Id == 1);
        if (nursery != null)
        {
            nursery.LoginId = "demo";
            nursery.Password = password;
            nursery.LoginAttempts = 0;
            nursery.IsLocked = false;
            nursery.LockedUntil = null;
            nursery.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            Console.WriteLine("✓ Database updated successfully!");
            Console.WriteLine($"  LoginId: demo");
            Console.WriteLine($"  Password: password (plain text)");
        }
        else
        {
            Console.WriteLine("✗ Nursery ID 1 not found");
            return 1;
        }

        return 0;
    }
}
