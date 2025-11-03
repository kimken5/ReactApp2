#!/usr/bin/env dotnet-script
#r "nuget: BCrypt.Net-Next, 4.0.3"

using BCrypt.Net;

// パスワード "password" のBCryptハッシュを生成
var password = "password";
var hash = BCrypt.HashPassword(password);

Console.WriteLine($"Password: {password}");
Console.WriteLine($"BCrypt Hash: {hash}");
Console.WriteLine();
Console.WriteLine("SQL:");
Console.WriteLine($"UPDATE Nurseries SET LoginId = 'demo', Password = '{hash}', UpdatedAt = GETUTCDATE() WHERE Id = 1;");
