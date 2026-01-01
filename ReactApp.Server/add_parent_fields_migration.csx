#!/usr/bin/env dotnet-script
#r "nuget: Microsoft.Data.SqlClient, 5.1.1"

using Microsoft.Data.SqlClient;
using System;
using System.IO;

var connectionString = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;";
var sqlScript = File.ReadAllText("scripts/add_parent_detail_fields.sql");

using (var connection = new SqlConnection(connectionString))
{
    await connection.OpenAsync();
    Console.WriteLine("Connected to database successfully");

    using (var command = new SqlCommand(sqlScript, connection))
    {
        command.ExecuteNonQuery();
        Console.WriteLine("SQL script executed successfully");
    }
}

Console.WriteLine("Migration completed");
