# コード途中に挿入されたusing ReactApp.Server.Helpers;を全て削除

$targetDir = "ReactApp.Server"

Write-Host "コード途中のusing ReactApp.Server.Helpers;を削除します..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse

$totalFiles = 0
$totalRemoved = 0

foreach ($file in $files) {
    $lines = Get-Content $file.FullName -Encoding UTF8
    $newLines = @()
    $removedCount = 0
    $lineNumber = 0

    foreach ($line in $lines) {
        $lineNumber++
        # 10行目以降にあるusing ReactApp.Server.Helpers;は削除（ファイル先頭のusing文ではない）
        if ($lineNumber -gt 10 -and $line -match "^using ReactApp\.Server\.Helpers;$") {
            $removedCount++
            continue  # この行をスキップ
        }
        $newLines += $line
    }

    if ($removedCount -gt 0) {
        $newContent = $newLines -join "`r`n"
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        $totalFiles++
        $totalRemoved += $removedCount
        Write-Host "OK: $($file.Name) - $removedCount lines removed"
    }
}

Write-Host "Complete: $totalFiles files, $totalRemoved lines removed"
