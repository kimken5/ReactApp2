using System;
using System.IO;
using Microsoft.Data.SqlClient;

class Program
{
    static void Main()
    {
        var connectionString = "Server=(localdb)\\MSSQLLocalDB;Database=claude-div-test;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
        var scriptPath = "fix_parent_id_identity.sql";

        if (!File.Exists(scriptPath))
        {
            Console.WriteLine($"ERROR: Script file not found: {scriptPath}");
            return;
        }

        var script = File.ReadAllText(scriptPath);
        Console.WriteLine("=== Executing Parent ID IDENTITY Migration ===");

        try
        {
            using (var connection = new SqlConnection(connectionString))
            {
                connection.Open();
                Console.WriteLine("Connected to database.");

                // Split script by GO statements and execute each batch
                var batches = script.Split(new[] { "\r\nGO\r\n", "\nGO\n", "\r\nGO", "\nGO" }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var batch in batches)
                {
                    if (string.IsNullOrWhiteSpace(batch)) continue;

                    using (var command = new SqlCommand(batch, connection))
                    {
                        command.CommandTimeout = 120;

                        // Use ExecuteReader to capture PRINT statements
                        using (var reader = command.ExecuteReader())
                        {
                            do
                            {
                                while (reader.Read())
                                {
                                    // Process result sets if any
                                }
                            } while (reader.NextResult());
                        }
                    }
                }

                // Capture messages from SQL Server
                connection.InfoMessage += (sender, e) =>
                {
                    Console.WriteLine(e.Message);
                };

                Console.WriteLine("=== Migration Completed Successfully ===");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        }
    }
}
