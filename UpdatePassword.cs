using System;
using Microsoft.EntityFrameworkCore;
using ReactApp.Server.Data;

// Quick script to update password hash
var connStr = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;";

var options = new DbContextOptionsBuilder<KindergartenDbContext>()
    .UseSqlServer(connStr)
    .Options;

using var context = new KindergartenDbContext(options);

var nursery = await context.Nurseries.FindAsync(1);
if (nursery == null)
{
    Console.WriteLine("Nursery ID 1 not found!");
    return;
}

Console.WriteLine($"Current Password Hash: {nursery.Password?.Substring(0, Math.Min(30, nursery.Password.Length ?? 0))}");
Console.WriteLine($"LoginAttempts: {nursery.LoginAttempts}, IsLocked: {nursery.IsLocked}");

// Update to correct hash for "password"
nursery.Password = "$2a$10$N9qo8uLOickgx2ZMRZoMye/EhJr.uSKvb3UOPKRjl1i9B0jC9dKTm";
nursery.LoginAttempts = 0;
nursery.IsLocked = false;
nursery.LockedUntil = null;
nursery.UpdatedAt = DateTime.UtcNow;

await context.SaveChangesAsync();

Console.WriteLine("\nPassword updated successfully!");
Console.WriteLine($"New Password Hash: {nursery.Password.Substring(0, 30)}");
Console.WriteLine($"LoginAttempts: {nursery.LoginAttempts}, IsLocked: {nursery.IsLocked}");
Console.WriteLine("\nYou can now login with:");
Console.WriteLine("LoginId: demo");
Console.WriteLine("Password: password");
