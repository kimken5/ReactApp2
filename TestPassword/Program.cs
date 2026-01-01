using System;

class Program
{
    static void Main()
    {
        // データベースに保存されているハッシュ
        var storedHash = "$2a$10$PVIidurBXjKXMN8JKDrVz.m3VQsSXQeHM7myHcU6my/46TSzFut0i";

        // テストするパスワード
        var testPasswords = new[] {
            "Tyuerubu551",
            "password",
            "demo",
            "admin",
            "Password123"
        };

        Console.WriteLine($"Stored Hash: {storedHash}");
        Console.WriteLine();

        foreach (var pwd in testPasswords)
        {
            bool isMatch = BCrypt.Net.BCrypt.Verify(pwd, storedHash);
            Console.WriteLine($"Password '{pwd}': {(isMatch ? "✅ MATCH!" : "❌ No match")}");
        }

        // 正解のパスワードでハッシュを生成
        Console.WriteLine();
        Console.WriteLine("=== Generating new hash for 'Tyuerubu551' ===");
        var newHash = BCrypt.Net.BCrypt.HashPassword("Tyuerubu551");
        Console.WriteLine($"New Hash: {newHash}");

        Console.WriteLine();
        Console.WriteLine("=== SQL Update Statement ===");
        Console.WriteLine($"UPDATE Nurseries SET Password = '{newHash}', LoginAttempts = 0, IsLocked = 0, LockedUntil = NULL WHERE Id = 1;");
    }
}
