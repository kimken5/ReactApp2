# 安全にusing ReactApp.Server.Helpers;を追加するスクリプト

$targetDir = "ReactApp.Server"
$usingStatement = "using ReactApp.Server.Helpers;"

Write-Host "using ReactApp.Server.Helpers; を追加します (安全モード)..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse | Where-Object { $_.Name -ne "DateTimeHelper.cs" }

$totalFiles = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8

        # DateTimeHelper.GetJstNow()を使用していて、かつ using が含まれていないファイルのみ処理
        if (($content -match "DateTimeHelper\.GetJstNow\(\)") -and ($content -notmatch "using ReactApp\.Server\.Helpers;")) {

            $lines = Get-Content $file.FullName -Encoding UTF8
            $newLines = @()
            $usingAdded = $false

            for ($i = 0; $i -lt $lines.Count; $i++) {
                $line = $lines[$i]

                # 最初のnamespace行を見つけたら、その前にusingを追加
                if (-not $usingAdded -and $line -match "^namespace\s+") {
                    # namespace行の前に空行があればスキップ
                    if ($newLines.Count -gt 0 -and $newLines[-1] -eq "") {
                        $newLines = $newLines[0..($newLines.Count - 2)]
                    }

                    $newLines += $usingStatement
                    $newLines += ""
                    $newLines += $line
                    $usingAdded = $true
                }
                # 既存のusing文の最後の行の後に追加
                elseif (-not $usingAdded -and $line -match "^using\s+" -and ($i + 1 -lt $lines.Count) -and ($lines[$i + 1] -notmatch "^using\s+")) {
                    $newLines += $line
                    $newLines += $usingStatement
                    $usingAdded = $true
                }
                else {
                    $newLines += $line
                }
            }

            if ($usingAdded) {
                # UTF8 BOM付きで書き込み
                $encoding = New-Object System.Text.UTF8Encoding $true
                [System.IO.File]::WriteAllLines($file.FullName, $newLines, $encoding)

                $totalFiles++
                Write-Host "OK: $($file.Name)"
            }
        }
    } catch {
        Write-Host "ERROR: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nComplete: $totalFiles files updated"
