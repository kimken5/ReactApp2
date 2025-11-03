Add-Type -AssemblyName 'System.Data.SqlClient'

$connectionString = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;"

$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = $connectionString

try {
    $conn.Open()
    Write-Host "Connected to database successfully"

    # Update password
    $updateCmd = $conn.CreateCommand()
    $updateCmd.CommandText = "UPDATE Nurseries SET Password = 'password', LoginAttempts = 0, IsLocked = 0, LockedUntil = NULL, UpdatedAt = GETUTCDATE() WHERE Id = 1"
    $rowsAffected = $updateCmd.ExecuteNonQuery()
    Write-Host "Rows updated: $rowsAffected"

    # Verify update
    $selectCmd = $conn.CreateCommand()
    $selectCmd.CommandText = "SELECT Id, LoginId, Password, LoginAttempts, IsLocked FROM Nurseries WHERE Id = 1"
    $reader = $selectCmd.ExecuteReader()

    while ($reader.Read()) {
        Write-Host "Id: $($reader[0])"
        Write-Host "LoginId: $($reader[1])"
        Write-Host "Password: $($reader[2])"
        Write-Host "LoginAttempts: $($reader[3])"
        Write-Host "IsLocked: $($reader[4])"
    }

    $reader.Close()
    Write-Host "`nPassword updated to plain text: 'password'"
}
catch {
    Write-Host "Error: $_"
}
finally {
    $conn.Close()
}
