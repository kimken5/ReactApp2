# DateTimeHelper.GetJstNow()を使用しているファイルにusing ReactApp.Server.Helpers;を追加

$targetDir = "ReactApp.Server"
$usingStatement = "using ReactApp.Server.Helpers;"
$searchPattern = "DateTimeHelper\.GetJstNow\(\)"

Write-Host "using ReactApp.Server.Helpers; を追加します..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse

$totalFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # DateTimeHelper.GetJstNow()を使用していて、かつ using が含まれていないファイルのみ処理
    if (($content -match $searchPattern) -and ($content -notmatch "using ReactApp\.Server\.Helpers;")) {
        # 既存のusingステートメントの後に追加
        if ($content -match "(using [^;]+;\r?\n)+") {
            $lastUsingMatch = [regex]::Matches($content, "using [^;]+;\r?\n") | Select-Object -Last 1
            $insertPosition = $lastUsingMatch.Index + $lastUsingMatch.Length

            $newContent = $content.Insert($insertPosition, $usingStatement + "`r`n")
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline

            $totalFiles++
            Write-Host "OK: $($file.Name)"
        }
    }
}

Write-Host "Complete: $totalFiles files updated"
