#!/usr/bin/env dotnet-script
#r "nuget: BCrypt.Net-Next, 4.0.3"

using BCrypt.Net;

// データベースに保存されているハッシュ
var storedHash = "$2a$10$PVIidurBXjKXMN8JKDrVz.m3VQsSXQeHM7myHcU6my/46TSzFut0i";

// テストするパスワード
var testPasswords = new[] {
    "Tyuerubu551",
    "password",
    "demo",
    "admin"
};

Console.WriteLine($"Stored Hash: {storedHash}");
Console.WriteLine();

foreach (var pwd in testPasswords)
{
    bool isMatch = BCrypt.Verify(pwd, storedHash);
    Console.WriteLine($"Password '{pwd}': {(isMatch ? "✅ MATCH!" : "❌ No match")}");
}

// 正解のパスワードでハッシュを生成
Console.WriteLine();
Console.WriteLine("Generating new hash for 'Tyuerubu551':");
var newHash = BCrypt.HashPassword("Tyuerubu551");
Console.WriteLine($"New Hash: {newHash}");
