# KindergartenDbContext.cs内のGETUTCDATE()を[dbo].[GetJstDateTime]()に置換

$filePath = "ReactApp.Server\Data\KindergartenDbContext.cs"
$searchPattern = 'GETUTCDATE\(\)'
$replacement = '[dbo].[GetJstDateTime]()'

Write-Host "GETUTCDATE() を [dbo].[GetJstDateTime]() に置換します..."

$content = Get-Content $filePath -Raw -Encoding UTF8
$count = ([regex]::Matches($content, $searchPattern)).Count

Write-Host "  対象: $filePath"
Write-Host "  置換前: $count 箇所"

$newContent = $content -replace $searchPattern, $replacement
Set-Content -Path $filePath -Value $newContent -Encoding UTF8 -NoNewline

$newCount = ([regex]::Matches($newContent, $replacement)).Count
Write-Host "  置換後: $newCount 箇所"
Write-Host "Complete!"
