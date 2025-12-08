#!/bin/bash

# ApplicationKey設定スクリプト
# デスクトップアプリのJWT認証を使用してNurseryにApplicationKeyを設定

DESKTOP_BASE_URL="http://localhost:5131/api/desktop"
APPLICATION_KEY="test-application-key-2025"

echo "=== ApplicationKey設定 ==="
echo ""

# 1. JWT認証トークン取得
echo "1. JWT認証トークン取得中..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DESKTOP_BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin",
    "password": "password123"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ JWT認証失敗 (HTTP $HTTP_STATUS)"
    echo "レスポンス: $BODY"
    echo ""
    echo "デフォルトの認証情報で試行します..."
    echo "LoginId: admin, Password: password123"
    exit 1
fi

ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.accessToken' 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" == "null" ]; then
    echo "❌ アクセストークン取得失敗"
    echo "レスポンス: $BODY"
    exit 1
fi

echo "✅ JWT認証成功"
echo ""

# 注記: ApplicationKeyの設定APIは未実装のため、データベースに直接設定する必要があります
echo "⚠️ ApplicationKey設定APIは未実装です。"
echo "以下のSQLを手動で実行してください:"
echo ""
echo "UPDATE Nurseries SET ApplicationKey = '${APPLICATION_KEY}' WHERE Id = 1;"
echo ""
echo "または、setup_test_data.sql を実行してください。"
