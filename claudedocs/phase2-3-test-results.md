=== Phase 2-3 完全動作確認開始 ===

実施日時: 2025-12-08 21:25:36

---

### テスト1: ApplicationKey検証 (有効なキー)

リクエスト: POST http://localhost:5131/api/application/validate-key
ApplicationKey: test-application-key-2025
HTTPステータス: 400
レスポンス:

## ApplicationKey検証 (未設定キー)
[0;32m✅ PASS[0m (HTTP 400)

### テスト2: 入園申込送信

リクエスト: POST http://localhost:5131/api/application/submit?key=test-application-key-2025
HTTPステータス: 400
レスポンス:

## 入園申込送信 (ApplicationKey未設定)
[0;32m✅ PASS[0m (HTTP 400)

### テスト3: JWT認証トークン取得

リクエスト: POST http://localhost:5131/api/desktop/auth/login
HTTPステータス: 401
レスポンス:

## JWT認証トークン取得
[0;31m❌ FAIL[0m (Expected: 200, Got: 401)

### テスト4-5: スキップ
JWT認証トークンが取得できなかったため、以降のテストをスキップしました。

---

## テスト結果サマリー

実施テスト数: 3
[0;32m成功: 2[0m
[0;31m失敗: 1[0m

[0;31m❌ 一部テスト失敗[0m

詳細なテスト結果は claudedocs/phase2-3-test-results.md を参照してください。
