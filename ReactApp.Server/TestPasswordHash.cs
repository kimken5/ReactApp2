using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;
using ReactApp.Server.Helpers;

namespace ReactApp.Server;

public class TestPasswordHash
{
    public static async Task Run(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<KindergartenDbContext>();
        optionsBuilder.UseSqlServer("Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;");

        using var context = new KindergartenDbContext(optionsBuilder.Options);

        var nursery = await context.Nurseries.FirstOrDefaultAsync(n => n.Id == 1);
        if (nursery == null)
        {
            Console.WriteLine("Nursery ID 1 not found");
            return;
        }

        Console.WriteLine($"Current LoginId: {nursery.LoginId}");
        Console.WriteLine($"Current Password Hash: {nursery.Password}");
        Console.WriteLine($"Password Hash Length: {nursery.Password?.Length ?? 0}");

        // Generate new BCrypt hash for "password"
        var newPassword = "password";
        var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

        Console.WriteLine($"\nNew Password: {newPassword}");
        Console.WriteLine($"New Hash: {newHash}");
        Console.WriteLine($"New Hash Length: {newHash.Length}");

        // Verify the new hash works
        var verified = BCrypt.Net.BCrypt.Verify(newPassword, newHash);
        Console.WriteLine($"Verification Test: {verified}");

        // Update database
        nursery.LoginId = "demo";
        nursery.Password = newHash;
        nursery.UpdatedAt = DateTimeHelper.GetJstNow();

        await context.SaveChangesAsync();

        Console.WriteLine("\nDatabase updated successfully!");
        Console.WriteLine($"LoginId: demo");
        Console.WriteLine($"Password: password");
    }
}
