# ModelsフォルダのファイルにもusingReactApp.Server.Helpers;を追加

$targetDir = "ReactApp.Server\Models"
$usingStatement = "using ReactApp.Server.Helpers;"
$searchPattern = "DateTimeHelper\.GetJstNow\(\)"

Write-Host "Modelsフォルダにusing ReactApp.Server.Helpers; を追加します..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs"

$totalFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # DateTimeHelper.GetJstNow()を使用していて、かつ using が含まれていないファイルのみ処理
    if (($content -match $searchPattern) -and ($content -notmatch "using ReactApp\.Server\.Helpers;")) {
        # namespaceの前に追加
        if ($content -match "^([\s\S]*?)(namespace\s+)") {
            $beforeNamespace = $matches[1]
            $namespaceKeyword = $matches[2]
            $afterNamespace = $content.Substring($matches[0].Length)

            # 既存のusingステートメントがある場合はその後に追加、なければnamespaceの前に追加
            if ($beforeNamespace -match "using\s+") {
                # 最後のusingステートメントの後に追加
                $lastUsingMatch = [regex]::Matches($beforeNamespace, "using [^;]+;\r?\n") | Select-Object -Last 1
                if ($lastUsingMatch) {
                    $insertPosition = $lastUsingMatch.Index + $lastUsingMatch.Length
                    $newBeforeNamespace = $beforeNamespace.Insert($insertPosition, $usingStatement + "`r`n")
                    $newContent = $newBeforeNamespace + $namespaceKeyword + $afterNamespace
                } else {
                    $newContent = $usingStatement + "`r`n" + $content
                }
            } else {
                # usingステートメントがない場合はnamespaceの前に追加
                $newContent = $usingStatement + "`r`n`r`n" + $content
            }

            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
            $totalFiles++
            Write-Host "OK: $($file.Name)"
        }
    }
}

Write-Host "Complete: $totalFiles files updated"
