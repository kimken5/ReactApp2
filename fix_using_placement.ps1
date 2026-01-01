# 誤って途中に挿入されたusing ReactApp.Server.Helpers;を削除してファイル先頭に移動

$targetDir = "ReactApp.Server"

Write-Host "誤って挿入されたusingステートメントを修正します..."

$files = Get-ChildItem -Path $targetDir -Filter "*.cs" -Recurse

$totalFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # using ReactApp.Server.Helpers;がコード途中に含まれている場合
    if ($content -match "(?<!\r?\n)using ReactApp\.Server\.Helpers;") {
        # すべてのusing ReactApp.Server.Helpers;を削除
        $newContent = $content -replace "using ReactApp\.Server\.Helpers;\r?\n?", ""

        # ファイルの先頭（BOMの後）に正しく挿入
        if ($newContent -match "^([\ufeff]?)(.*)") {
            $bom = $matches[1]
            $rest = $matches[2]

            # 既存のusingステートメントの後に追加
            if ($rest -match "^((using [^;]+;\r?\n)+)") {
                # 既存のusingの後に追加
                $existingUsings = $matches[1]
                $afterUsings = $rest.Substring($existingUsings.Length)
                $newContent = $bom + $existingUsings + "using ReactApp.Server.Helpers;`r`n" + $afterUsings
            } else {
                # namespaceの前に追加
                $newContent = $bom + "using ReactApp.Server.Helpers;`r`n`r`n" + $rest
            }

            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
            $totalFiles++
            Write-Host "OK: $($file.Name)"
        }
    }
}

Write-Host "Complete: $totalFiles files fixed"
