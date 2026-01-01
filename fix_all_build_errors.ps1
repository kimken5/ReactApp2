# 全ビルドエラーを修正するスクリプト

Write-Host "=== ビルドエラー修正開始 ==="

# 1. DesktopMasterController.cs - PrincipalNameとEstablishedDateのログ出力を削除
Write-Host "`n[1/4] DesktopMasterController.cs のログ出力を修正中..."
$file = "ReactApp.Server\Controllers\DesktopMasterController.cs"
$content = Get-Content $file -Raw -Encoding UTF8

# 削除されたフィールドを参照するログ行を削除
$content = $content -replace '(?m)^\s*_logger\.LogInformation\("保育園情報取得:.*?PrincipalName.*?EstablishedDate.*?\r?\n', ''

Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "OK: DesktopMasterController.cs"

# 2. ApplicationService.cs - DateTime.ToDateTimeを削除（既にDateTimeなので不要）
Write-Host "`n[2/4] ApplicationService.cs のDateTime変換を修正中..."
$file = "ReactApp.Server\Services\ApplicationService.cs"
$content = Get-Content $file -Raw -Encoding UTF8

# DateOfBirth と ChildDateOfBirth は既にDateTimeなので .ToDateTime() は不要
$content = $content -replace 'request\.DateOfBirth\.ToDateTime\(TimeOnly\.MinValue\)', 'request.DateOfBirth'
$content = $content -replace 'request\.ChildDateOfBirth\.ToDateTime\(TimeOnly\.MinValue\)', 'request.ChildDateOfBirth'

# DTOへの変換は DateOnly.FromDateTime() を削除（既にDateTimeのまま渡す）
$content = $content -replace 'ChildDateOfBirth\s*=\s*DateOnly\.FromDateTime\(a\.ChildDateOfBirth\)', 'ChildDateOfBirth = a.ChildDateOfBirth'
$content = $content -replace 'DateOfBirth\s*=\s*DateOnly\.FromDateTime\(application\.DateOfBirth\)', 'DateOfBirth = application.DateOfBirth'
$content = $content -replace 'ChildDateOfBirth\s*=\s*DateOnly\.FromDateTime\(application\.ChildDateOfBirth\)', 'ChildDateOfBirth = application.ChildDateOfBirth'

Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "OK: ApplicationService.cs"

# 3. DesktopMasterService.cs - パスワード変更ロジック全体を削除
Write-Host "`n[3/4] DesktopMasterService.cs のパスワード変更ロジックを削除中..."
$file = "ReactApp.Server\Services\DesktopMasterService.cs"
$content = Get-Content $file -Raw -Encoding UTF8

# パスワード変更の検証ブロック全体を削除（行番号 133-205 あたり）
$content = $content -replace '(?s)//\s*パスワード変更が要求された場合の検証.*?}\s*\r?\n\s*}\s*\r?\n', ''

# 念のため残ったパスワード関連のコードも削除
$content = $content -replace '(?m)^\s*if\s*\(!string\.IsNullOrEmpty\(request\.CurrentPassword\).*?\r?\n', ''
$content = $content -replace '(?m)^\s*if\s*\(!string\.IsNullOrEmpty\(request\.NewPassword\).*?\r?\n', ''
$content = $content -replace '(?m)^\s*if\s*\(string\.IsNullOrEmpty\(request\.CurrentPassword\).*?\r?\n', ''
$content = $content -replace '(?m)^\s*if\s*\(string\.IsNullOrEmpty\(request\.NewPassword\).*?\r?\n', ''
$content = $content -replace '(?m)^\s*if\s*\(string\.IsNullOrWhiteSpace\(request\.(CurrentPassword|NewPassword)\).*?\r?\n', ''
$content = $content -replace '(?m)^\s*nursery\.Password\s*=\s*BCrypt\.Net\.BCrypt\.HashPassword\(.*?\r?\n', ''
$content = $content -replace '(?m)^\s*_logger\.LogInformation\("パスワード.*?\r?\n', ''

Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "OK: DesktopMasterService.cs"

# 4. 検証: ビルド実行
Write-Host "`n[4/4] ビルド検証中..."
cd ReactApp.Server
$buildResult = dotnet build 2>&1
$errorCount = ($buildResult | Select-String -Pattern "エラー" | Measure-Object).Count

if ($errorCount -eq 0) {
    Write-Host "`n=== 成功: ビルドエラーなし ===" -ForegroundColor Green
} else {
    Write-Host "`n=== 警告: まだ $errorCount 件のエラーがあります ===" -ForegroundColor Yellow
    $buildResult | Select-String -Pattern "error CS" | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

cd ..
Write-Host "`n=== ビルドエラー修正完了 ==="
