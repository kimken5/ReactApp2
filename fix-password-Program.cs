using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;

Console.WriteLine("=== BCrypt Password Hash Generator & Database Updater ===\n");

var optionsBuilder = new DbContextOptionsBuilder<KindergartenDbContext>();
optionsBuilder.UseSqlServer("Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;");

await using var context = new KindergartenDbContext(optionsBuilder.Options);

// Generate BCrypt hash for "password"
var password = "password";
var hash = BCrypt.Net.BCrypt.HashPassword(password);

Console.WriteLine($"Plain Password: {password}");
Console.WriteLine($"BCrypt Hash: {hash}");
Console.WriteLine($"Hash Length: {hash.Length}");

// Verify it works
var isValid = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine($"Verification Test: {(isValid ? "✓ PASS" : "✗ FAIL")}");
Console.WriteLine();

// Update database
var nursery = await context.Nurseries.FirstOrDefaultAsync(n => n.Id == 1);
if (nursery != null)
{
    nursery.LoginId = "demo";
    nursery.Password = hash;
    nursery.LoginAttempts = 0;
    nursery.IsLocked = false;
    nursery.LockedUntil = null;
    nursery.UpdatedAt = DateTime.UtcNow;

    await context.SaveChangesAsync();

    Console.WriteLine("✓ Database updated successfully!");
    Console.WriteLine($"  LoginId: demo");
    Console.WriteLine($"  Password: password");
    Console.WriteLine($"  Stored Hash: {hash}");
}
else
{
    Console.WriteLine("✗ Nursery ID 1 not found");
    Environment.Exit(1);
}
