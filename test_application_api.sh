#!/bin/bash
# 入園申込API動作確認スクリプト

BASE_URL="http://localhost:5131/api"
DESKTOP_BASE_URL="http://localhost:5131/api/desktop"

echo "=== 入園申込API動作確認 ==="
echo ""

# 1. ApplicationKey検証テスト (実在しないキー)
echo "1. ApplicationKey検証テスト (無効なキー)"
curl -X POST "${BASE_URL}/application/validate-key" \
  -H "Content-Type: application/json" \
  -d '{"applicationKey":"invalid-key-12345"}' \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

echo "---"
echo ""

# 2. 入園申込送信テスト (ApplicationKeyなし - エラー期待)
echo "2. 入園申込送信テスト (ApplicationKeyなし)"
curl -X POST "${BASE_URL}/application/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantName": "テスト 太郎",
    "applicantNameKana": "テスト タロウ",
    "dateOfBirth": "1985-05-15",
    "mobilePhone": "090-1234-5678",
    "relationshipToChild": "父",
    "childName": "テスト 花子",
    "childNameKana": "テスト ハナコ",
    "childDateOfBirth": "2020-04-01",
    "childGender": "女"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

echo "---"
echo ""

# 3. デスクトップAPI - 申込一覧取得テスト (認証なし - エラー期待)
echo "3. デスクトップAPI - 申込一覧取得 (認証なし)"
curl -X GET "${DESKTOP_BASE_URL}/application" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n" \
  2>/dev/null

echo "---"
echo ""

echo "=== テスト完了 ==="
echo "期待される結果:"
echo "1. 400 Bad Request (無効なApplicationKey)"
echo "2. 400 Bad Request (ApplicationKeyなし)"
echo "3. 401 Unauthorized (JWT認証なし)"
