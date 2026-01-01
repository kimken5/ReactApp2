# 削除されたフィールドへの参照を一括削除するスクリプト

$targetFile = "ReactApp.Server\Services\DesktopMasterService.cs"

Write-Host "削除されたフィールドへの参照を削除します..."

$content = Get-Content $targetFile -Raw -Encoding UTF8

# 削除されたフィールドのパターン
$patterns = @(
    'request\.NewPassword',
    'request\.CurrentPassword',
    'request\.PrincipalName',
    'request\.EstablishedDate',
    'nursery\.PrincipalName\s*=',
    'nursery\.EstablishedDate\s*='
)

# パスワード変更ブロック全体を削除
$content = $content -replace '(?s)//\s*パスワード変更が要求された場合.*?nursery\.Password\s*=\s*BCrypt.*?;\s*\n\s*\}', ''

# EstablishedDateのifブロックを削除
$content = $content -replace '(?s)if\s*\(request\.EstablishedDate\.HasValue\).*?\n\s*\}', ''

# PrincipalName代入を削除
$content = $content -replace 'nursery\.PrincipalName\s*=\s*request\.PrincipalName\s*\?\?\s*string\.Empty;\s*\n', ''

Set-Content -Path $targetFile -Value $content -Encoding UTF8 -NoNewline

Write-Host "Complete!"
