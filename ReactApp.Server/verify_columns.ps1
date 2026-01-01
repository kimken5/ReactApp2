$connectionString = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;"

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()

    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Parents' ORDER BY ORDINAL_POSITION"

    $reader = $command.ExecuteReader()

    Write-Host "Columns in Parents table:" -ForegroundColor Cyan
    while ($reader.Read()) {
        Write-Host "  - $($reader["COLUMN_NAME"])"
    }

    $reader.Close()
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    $connection.Close()
}
