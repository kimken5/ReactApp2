# 安全にDateTime.UtcNowをDateTimeHelper.GetJstNow()に置換するスクリプト
# ファイル構造を保持しながら行単位で処理

$targetDir = "ReactApp.Server"
$searchPattern = "DateTime\.UtcNow"
$replacement = "DateTimeHelper.GetJstNow()"

Write-Host "DateTime.UtcNow を DateTimeHelper.GetJstNow() に置換します (安全モード)..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse | Where-Object { $_.Name -ne "DateTimeHelper.cs" }

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    try {
        # UTF8エンコーディングでファイルを読み込み
        $lines = Get-Content $file.FullName -Encoding UTF8
        $modified = $false
        $newLines = @()
        $fileReplacements = 0

        foreach ($line in $lines) {
            if ($line -match $searchPattern) {
                $newLine = $line -replace $searchPattern, $replacement
                $newLines += $newLine
                $modified = $true
                $count = ([regex]::Matches($line, $searchPattern)).Count
                $fileReplacements += $count
            } else {
                $newLines += $line
            }
        }

        if ($modified) {
            # 元のエンコーディングとBOMを保持して書き込み
            $encoding = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllLines($file.FullName, $newLines, $encoding)

            $totalFiles++
            $totalReplacements += $fileReplacements
            Write-Host "OK: $($file.Name) - $fileReplacements replacements"
        }
    } catch {
        Write-Host "ERROR: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nComplete: $totalFiles files, $totalReplacements total replacements"
