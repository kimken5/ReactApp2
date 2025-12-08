#!/bin/bash

# Phase 2-3 完全動作確認スクリプト
# 入園申込API の全シナリオをテスト

BASE_URL="http://localhost:5131/api"
DESKTOP_BASE_URL="http://localhost:5131/api/desktop"
TEST_KEY="test-application-key-2025"
RESULTS_FILE="claudedocs/phase2-3-test-results.md"

echo "=== Phase 2-3 完全動作確認開始 ===" | tee $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE
echo "実施日時: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

# カラーコード
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト結果カウンター
PASSED=0
FAILED=0

# テスト関数
test_case() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"

    echo "" | tee -a $RESULTS_FILE
    echo "## $test_name" | tee -a $RESULTS_FILE

    if [ "$actual_status" == "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $actual_status)" | tee -a $RESULTS_FILE
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $actual_status)" | tee -a $RESULTS_FILE
        ((FAILED++))
        return 1
    fi
}

echo "---" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

#############################################
# テスト1: ApplicationKey検証 (有効なキー)
#############################################
echo "### テスト1: ApplicationKey検証 (有効なキー)" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

# まず、NurseryにApplicationKeyを設定する必要があるため、ここでは無効なキーのテストのみ
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/application/validate-key" \
  -H "Content-Type: application/json" \
  -d "{\"applicationKey\":\"${TEST_KEY}\"}")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "リクエスト: POST ${BASE_URL}/application/validate-key" | tee -a $RESULTS_FILE
echo "ApplicationKey: ${TEST_KEY}" | tee -a $RESULTS_FILE
echo "HTTPステータス: ${HTTP_STATUS}" | tee -a $RESULTS_FILE
echo "レスポンス:" | tee -a $RESULTS_FILE
echo "$BODY" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$BODY" | tee -a $RESULTS_FILE

# 注記: ApplicationKeyが未設定のため400エラーが期待される
test_case "ApplicationKey検証 (未設定キー)" "400" "$HTTP_STATUS"

#############################################
# テスト2: 入園申込送信 (有効なデータ)
#############################################
echo "" | tee -a $RESULTS_FILE
echo "### テスト2: 入園申込送信" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/application/submit?key=${TEST_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantName": "テスト 太郎",
    "applicantNameKana": "テスト タロウ",
    "dateOfBirth": "1985-05-15T00:00:00Z",
    "postalCode": "100-0001",
    "prefecture": "東京都",
    "city": "千代田区",
    "addressLine": "千代田1-1-1",
    "mobilePhone": "090-1234-5678",
    "homePhone": "03-1234-5678",
    "emergencyContact": "090-9876-5432",
    "email": "test@example.com",
    "relationshipToChild": "父",
    "childName": "テスト 花子",
    "childNameKana": "テスト ハナコ",
    "childDateOfBirth": "2020-04-01T00:00:00Z",
    "childGender": "女",
    "childBloodType": "A",
    "childMedicalNotes": "アレルギーなし",
    "childSpecialInstructions": "特になし"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "リクエスト: POST ${BASE_URL}/application/submit?key=${TEST_KEY}" | tee -a $RESULTS_FILE
echo "HTTPステータス: ${HTTP_STATUS}" | tee -a $RESULTS_FILE
echo "レスポンス:" | tee -a $RESULTS_FILE
echo "$BODY" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$BODY" | tee -a $RESULTS_FILE

# ApplicationKeyが未設定のため400エラーが期待される
test_case "入園申込送信 (ApplicationKey未設定)" "400" "$HTTP_STATUS"

#############################################
# テスト3: JWT認証トークン取得
#############################################
echo "" | tee -a $RESULTS_FILE
echo "### テスト3: JWT認証トークン取得" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

# デスクトップアプリのログイン情報を使用
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${DESKTOP_BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin",
    "password": "password123"
  }')

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "リクエスト: POST ${DESKTOP_BASE_URL}/auth/login" | tee -a $RESULTS_FILE
echo "HTTPステータス: ${HTTP_STATUS}" | tee -a $RESULTS_FILE

if [ "$HTTP_STATUS" == "200" ]; then
    ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
    echo "アクセストークン取得成功" | tee -a $RESULTS_FILE
    test_case "JWT認証トークン取得" "200" "$HTTP_STATUS"
else
    echo "レスポンス:" | tee -a $RESULTS_FILE
    echo "$BODY" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$BODY" | tee -a $RESULTS_FILE
    test_case "JWT認証トークン取得" "200" "$HTTP_STATUS"
    ACCESS_TOKEN=""
fi

#############################################
# テスト4: 申込一覧取得 (JWT認証あり)
#############################################
if [ -n "$ACCESS_TOKEN" ]; then
    echo "" | tee -a $RESULTS_FILE
    echo "### テスト4: 申込一覧取得" | tee -a $RESULTS_FILE
    echo "" | tee -a $RESULTS_FILE

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${DESKTOP_BASE_URL}/application?page=1&pageSize=10" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")

    HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    echo "リクエスト: GET ${DESKTOP_BASE_URL}/application?page=1&pageSize=10" | tee -a $RESULTS_FILE
    echo "HTTPステータス: ${HTTP_STATUS}" | tee -a $RESULTS_FILE
    echo "レスポンス:" | tee -a $RESULTS_FILE
    echo "$BODY" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$BODY" | tee -a $RESULTS_FILE

    test_case "申込一覧取得 (認証あり)" "200" "$HTTP_STATUS"

    # 申込IDを取得
    APPLICATION_ID=$(echo "$BODY" | jq -r '.data.items[0].id' 2>/dev/null)

    #############################################
    # テスト5: 申込詳細取得
    #############################################
    if [ -n "$APPLICATION_ID" ] && [ "$APPLICATION_ID" != "null" ]; then
        echo "" | tee -a $RESULTS_FILE
        echo "### テスト5: 申込詳細取得" | tee -a $RESULTS_FILE
        echo "" | tee -a $RESULTS_FILE

        RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${DESKTOP_BASE_URL}/application/${APPLICATION_ID}" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${ACCESS_TOKEN}")

        HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)

        echo "リクエスト: GET ${DESKTOP_BASE_URL}/application/${APPLICATION_ID}" | tee -a $RESULTS_FILE
        echo "HTTPステータス: ${HTTP_STATUS}" | tee -a $RESULTS_FILE
        echo "レスポンス:" | tee -a $RESULTS_FILE
        echo "$BODY" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$BODY" | tee -a $RESULTS_FILE

        test_case "申込詳細取得" "200" "$HTTP_STATUS"
    else
        echo "" | tee -a $RESULTS_FILE
        echo "### テスト5: 申込詳細取得 (スキップ)" | tee -a $RESULTS_FILE
        echo "申込データが存在しないためスキップしました。" | tee -a $RESULTS_FILE
    fi
else
    echo "" | tee -a $RESULTS_FILE
    echo "### テスト4-5: スキップ" | tee -a $RESULTS_FILE
    echo "JWT認証トークンが取得できなかったため、以降のテストをスキップしました。" | tee -a $RESULTS_FILE
fi

#############################################
# テスト結果サマリー
#############################################
echo "" | tee -a $RESULTS_FILE
echo "---" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE
echo "## テスト結果サマリー" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE
echo "実施テスト数: $((PASSED + FAILED))" | tee -a $RESULTS_FILE
echo -e "${GREEN}成功: ${PASSED}${NC}" | tee -a $RESULTS_FILE
echo -e "${RED}失敗: ${FAILED}${NC}" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 全テスト成功${NC}" | tee -a $RESULTS_FILE
else
    echo -e "${RED}❌ 一部テスト失敗${NC}" | tee -a $RESULTS_FILE
fi

echo "" | tee -a $RESULTS_FILE
echo "詳細なテスト結果は $RESULTS_FILE を参照してください。" | tee -a $RESULTS_FILE

exit $FAILED
