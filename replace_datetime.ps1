# DateTime.UtcNowをDateTimeHelper.GetJstNow()に一括置換するスクリプト

$targetDir = "ReactApp.Server"
$searchPattern = "DateTime\.UtcNow"
$replacement = "DateTimeHelper.GetJstNow()"

Write-Host "DateTime.UtcNow を DateTimeHelper.GetJstNow() に置換します..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    if ($content -match $searchPattern) {
        $newContent = $content -replace $searchPattern, $replacement
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline

        $count = ([regex]::Matches($content, $searchPattern)).Count
        $totalReplacements += $count
        $totalFiles++

        Write-Host "OK: $($file.Name) - $count replace"
    }
}

Write-Host "Complete: $totalFiles files, $totalReplacements replacements"
