#!/bin/bash
# ApplicationKey検証テストスクリプト

echo "=== ApplicationKey検証テスト ==="
echo ""
echo "1. ApplicationKey検証API呼び出し"
curl -X POST https://localhost:7118/api/application/validate-key \
  -H "Content-Type: application/json" \
  -d '{"applicationKey":"12345678901234567890"}' \
  -k \
  -v 2>&1 | grep -E "HTTP|applicationKey|isValid|nurseryName|error"

echo ""
echo ""
echo "2. デスクトップアプリのNursery取得API呼び出し（ログイン必要）"
echo "   ※このAPIは認証が必要なため、ブラウザまたはPostmanから実行してください"
echo "   GET https://localhost:7118/api/desktop/nursery"
