$connectionString = "Server=tcp:claude-div-test.database.windows.net,1433;Initial Catalog=claude-div-test;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;User ID=claude-dev;Password=!kimura4125;"
$sqlScript = Get-Content -Path "scripts/add_parent_detail_fields.sql" -Raw

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    Write-Host "Connected to database successfully" -ForegroundColor Green

    $command = $connection.CreateCommand()
    $command.CommandText = $sqlScript
    $command.ExecuteNonQuery() | Out-Null

    Write-Host "SQL script executed successfully" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    $connection.Close()
}

Write-Host "Migration completed" -ForegroundColor Green
