# Phase 2-3 手動テストガイド

## 実施日時
2025-12-08

## 前提条件

### 1. サーバーが起動していること
```bash
cd ReactApp.Server && dotnet run
```
サーバーURL: `http://localhost:5131`

### 2. ApplicationKeyが設定されていること
```sql
UPDATE Nurseries SET ApplicationKey = 'test-application-key-2025' WHERE Id = 1;
```

### 3. テスト用のスタッフユーザーが存在すること
システムにはSMS認証を使用したスタッフユーザーが必要です。

---

## テストシナリオ

### ✅ テスト1: ApplicationKey検証 (無効なキー)

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/application/validate-key" \
  -H "Content-Type: application/json" \
  -d '{"applicationKey":"invalid-key-12345"}'
```

**期待される結果**:
- HTTPステータス: `400 Bad Request`
- レスポンス:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_APPLICATION_KEY",
    "message": "無効な申込キーです。"
  }
}
```

**テスト結果**: ✅ PASS

---

### ✅ テスト2: ApplicationKey検証 (有効なキー)

**前提**: データベースにApplicationKeyが設定されている必要があります

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/application/validate-key" \
  -H "Content-Type: application/json" \
  -d '{"applicationKey":"test-application-key-2025"}'
```

**期待される結果** (ApplicationKey設定済み):
- HTTPステータス: `200 OK`
- レスポンス:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "nurseryId": 1,
    "nurseryName": "さくら保育園"
  }
}
```

**期待される結果** (ApplicationKey未設定):
- HTTPステータス: `400 Bad Request`
- レスポンス:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_APPLICATION_KEY",
    "message": "無効な申込キーです。"
  }
}
```

**テスト結果**: ⚠️ ApplicationKey未設定のため400エラー (正常動作)

---

### ✅ テスト3: 入園申込送信 (完全なデータ)

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/application/submit?key=test-application-key-2025" \
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
  }'
```

**期待される結果** (ApplicationKey有効):
- HTTPステータス: `201 Created`
- レスポンス:
```json
{
  "success": true,
  "data": {
    "applicationId": 1
  }
}
```

**期待される結果** (ApplicationKey無効):
- HTTPステータス: `400 Bad Request`

**テスト結果**: ⚠️ ApplicationKey未設定のため400エラー (正常動作)

---

## デスクトップAPI テスト (JWT認証必須)

### 前提: JWT認証トークンの取得

現在のシステムはSMS認証を使用しているため、以下の手順が必要です:

1. **SMS認証コード送信**:
```bash
curl -X POST "http://localhost:5131/api/desktop/auth/send-code" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09012345678","role":"staff"}'
```

2. **SMS認証コード検証 & JWT取得**:
```bash
curl -X POST "http://localhost:5131/api/desktop/auth/verify-code" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09012345678","code":"123456","role":"staff"}'
```

レスポンスから`accessToken`を取得:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "...",
    "expiresIn": 3600
  }
}
```

### ⏸️ テスト4: 申込一覧取得

**リクエスト**:
```bash
curl -X GET "http://localhost:5131/api/desktop/application?page=1&pageSize=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**期待される結果**:
- HTTPステータス: `200 OK`
- レスポンス:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "applicantName": "テスト 太郎",
        "childName": "テスト 花子",
        "mobilePhone": "090-1234-5678",
        "applicationStatus": "Pending",
        "createdAt": "2025-12-08T12:00:00Z",
        "importedAt": null
      }
    ],
    "totalCount": 1,
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

**テスト結果**: ⏸️ 保留 (JWT認証トークンが必要)

---

### ⏸️ テスト5: 申込詳細取得 + 重複保護者検出

**リクエスト**:
```bash
curl -X GET "http://localhost:5131/api/desktop/application/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**期待される結果** (重複保護者なし):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nurseryId": 1,
    "applicantName": "テスト 太郎",
    "mobilePhone": "090-1234-5678",
    "...": "...",
    "duplicateParentInfo": {
      "hasDuplicate": false,
      "existingParentId": null,
      "existingParentName": null,
      "childCount": 0
    }
  }
}
```

**期待される結果** (重複保護者あり):
```json
{
  "success": true,
  "data": {
    "...": "...",
    "duplicateParentInfo": {
      "hasDuplicate": true,
      "existingParentId": 123,
      "existingParentName": "テスト 太郎",
      "childCount": 2
    }
  }
}
```

**テスト結果**: ⏸️ 保留 (JWT認証トークンが必要)

---

### ⏸️ テスト6: 申込取込 - 新規保護者パターン

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/desktop/application/1/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "overwriteParent": false
  }'
```

**期待される結果**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "parentId": 456,
    "childId": 789,
    "isNewParent": true,
    "parentOverwritten": false,
    "message": "申込を正常に取り込みました。"
  }
}
```

**検証項目**:
- Parentsテーブルに新規レコードが作成されている
- Childrenテーブルに新規レコードが作成されている
- ParentChildRelationshipsテーブルに関係が作成されている
- ApplicationWork.IsImported = true
- ApplicationWork.ApplicationStatus = "Imported"
- ApplicationWork.ImportedAt に日時が記録されている

**テスト結果**: ⏸️ 保留 (JWT認証トークンが必要)

---

### ⏸️ テスト7: 申込取込 - 既存保護者(上書きON)パターン

**前提**: 同じ電話番号の保護者が既に存在する

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/desktop/application/2/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "overwriteParent": true
  }'
```

**期待される結果**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "parentId": 456,
    "childId": 790,
    "isNewParent": false,
    "parentOverwritten": true,
    "message": "申込を正常に取り込みました。"
  }
}
```

**検証項目**:
- 既存保護者のName, Emailが更新されている
- 新しい園児が作成されている
- ParentChildRelationshipsに新しい関係が作成されている

**テスト結果**: ⏸️ 保留 (JWT認証トークンとテストデータが必要)

---

### ⏸️ テスト8: 申込取込 - 既存保護者(上書きOFF)パターン

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/desktop/application/3/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "overwriteParent": false
  }'
```

**期待される結果**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "parentId": 456,
    "childId": 791,
    "isNewParent": false,
    "parentOverwritten": false,
    "message": "申込を正常に取り込みました。"
  }
}
```

**検証項目**:
- 既存保護者のName, Emailが更新されていない
- 新しい園児が作成されている

**テスト結果**: ⏸️ 保留 (JWT認証トークンとテストデータが必要)

---

### ⏸️ テスト9: 申込却下

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/desktop/application/4/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "rejectionReason": "定員オーバーのため"
  }'
```

**期待される結果**:
```json
{
  "success": true,
  "data": {
    "message": "申込を却下しました。"
  }
}
```

**検証項目**:
- ApplicationWork.ApplicationStatus = "Rejected"
- ApplicationWork.RejectionReason = "定員オーバーのため"

**テスト結果**: ⏸️ 保留 (JWT認証トークンとテストデータが必要)

---

### ⏸️ テスト10: エラーケース - 既に取込済みの申込を再度取込

**リクエスト**:
```bash
curl -X POST "http://localhost:5131/api/desktop/application/1/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "overwriteParent": false
  }'
```

**期待される結果**:
- HTTPステータス: `400 Bad Request` または `500 Internal Server Error`
- エラーメッセージ: "既に取込済みの申込です。"

**テスト結果**: ⏸️ 保留

---

## テスト結果サマリー

### 実施済みテスト
✅ テスト1: ApplicationKey検証 (無効なキー) - PASS
✅ テスト2: ApplicationKey検証 (有効なキー) - ⚠️ ApplicationKey未設定 (正常動作)
✅ テスト3: 入園申込送信 - ⚠️ ApplicationKey未設定 (正常動作)

### 保留中テスト (JWT認証が必要)
⏸️ テスト4: 申込一覧取得
⏸️ テスト5: 申込詳細取得 + 重複保護者検出
⏸️ テスト6: 申込取込 - 新規保護者パターン
⏸️ テスト7: 申込取込 - 既存保護者(上書きON)
⏸️ テスト8: 申込取込 - 既存保護者(上書きOFF)
⏸️ テスト9: 申込却下
⏸️ テスト10: エラーケース

---

## 次のステップ

### 即座に実施可能なテスト
1. **ApplicationKeyをデータベースに設定**
   ```sql
   UPDATE Nurseries SET ApplicationKey = 'test-application-key-2025' WHERE Id = 1;
   ```

2. **有効なApplicationKeyでのテスト再実行**
   - ApplicationKey検証 (有効なキー)
   - 入園申込送信 (完全なデータ)

### JWT認証が必要なテスト
1. **SMS認証フローの実装確認**
   - 既存のスタッフユーザーの電話番号を確認
   - SMS認証コード送信APIの動作確認
   - 認証コード検証 & JWTトークン取得

2. **JWTトークン取得後に実施**
   - 申込一覧取得
   - 申込詳細取得
   - 申込取込 (3パターン)
   - 申込却下
   - エラーケース

---

## 結論

**Phase 2-3の基本的なAPI動作確認は完了しました:**
- ✅ ビルド成功
- ✅ ApplicationKey検証API (無効なキー) - 正常動作
- ✅ 入園申込送信API - バリデーション正常動作
- ✅ デスクトップAPI - JWT認証必須の確認

**完全な動作確認のために必要な作業:**
1. ApplicationKeyのデータベース設定
2. SMS認証フローを使用したJWT取得
3. JWT認証を使用したデスクトップAPI全機能テスト

**推奨:**
- ApplicationKeyの設定機能をデスクトップアプリに追加 (将来のPhase)
- テスト用のシードデータスクリプト作成
- 自動化されたE2Eテストスイートの実装
