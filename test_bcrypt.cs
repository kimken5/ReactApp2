using System;

class Program
{
    static void Main()
    {
        var hash = "$2a$10$PVIidurBXjKXMN8JKDrVz.m3VQsSXQeHM7myHcU6my/46TSzFut0i";

        // Test common passwords
        string[] testPasswords = {
            "password",
            "demo",
            "demo123",
            "Password123",
            "admin",
            "admin123",
            "12345678",
            "さくらんぼ",
            "sakuranbo"
        };

        Console.WriteLine("Testing bcrypt hash: " + hash);
        Console.WriteLine();

        foreach (var pwd in testPasswords)
        {
            bool match = BCrypt.Net.BCrypt.Verify(pwd, hash);
            Console.WriteLine($"Password '{pwd}': {(match ? "MATCH!" : "no match")}");
        }
    }
}
