# 入園申込機能 Phase 2 完了報告

**完了日**: 2025-12-08
**Phase**: Phase 2 - バックエンドAPI実装

---

## 完了した作業

### 1. モデル層

#### ApplicationWorkモデル ([ReactApp.Server/Models/ApplicationWork.cs](../ReactApp.Server/Models/ApplicationWork.cs))
- 29カラムの完全なモデルクラス作成
- Data Annotations設定（Required, StringLength, EmailAddress等）
- 日本語XMLコメント付き
- ビジネスロジックに必要な全フィールド実装

#### DbContext更新 ([ReactApp.Server/Data/KindergartenDbContext.cs](../ReactApp.Server/Data/KindergartenDbContext.cs))
- `DbSet<ApplicationWork> ApplicationWorks` 追加
- `ConfigureApplicationWork` メソッド追加
  - 主キー設定 (Id)
  - 5個のインデックス定義
    - IX_ApplicationWork_NurseryId
    - IX_ApplicationWork_MobilePhone
    - IX_ApplicationWork_ApplicationStatus
    - IX_ApplicationWork_IsImported
    - IX_ApplicationWork_CreatedAt (降順)
  - カラム制約とデフォルト値設定

---

### 2. DTO層

#### ApplicationWorkDto.cs ([ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs](../ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs))

**作成したDTOクラス（8クラス）**:

1. **ApplicationWorkDto** - 申込詳細表示用
   - 全29フィールド
   - DuplicateParentInfo含む

2. **DuplicateParentInfo** - 重複保護者情報
   - HasDuplicate
   - ExistingParentId, ExistingParentName, ChildCount

3. **ApplicationListItemDto** - 一覧表示用
   - 6フィールド（Id, 名前、電話番号、ステータス、日時）

4. **CreateApplicationRequest** - 保護者Web申込用
   - 全フィールドにバリデーション属性付き
   - Required, StringLength, Phone, EmailAddress

5. **ImportApplicationRequest** - デスクトップ取込用
   - OverwriteParent (bool)

6. **ImportApplicationResult** - 取込結果
   - ParentId, ChildId, IsNewParent, IsNewChild, Message

7. **RejectApplicationRequest** - 却下用
   - RejectionReason (Required, 500文字以内)

8. **ValidateApplicationKeyRequest/Result** - ApplicationKey検証用

---

### 3. サービス層

#### IApplicationService ([ReactApp.Server/Services/IApplicationService.cs](../ReactApp.Server/Services/IApplicationService.cs))

**定義したメソッド（6個）**:

```csharp
Task<ValidateApplicationKeyResult> ValidateApplicationKeyAsync(string applicationKey);
Task<int> CreateApplicationAsync(CreateApplicationRequest request, string applicationKey);
Task<PagedResult<ApplicationListItemDto>> GetApplicationListAsync(int nurseryId, ...);
Task<ApplicationWorkDto?> GetApplicationDetailAsync(int id, int nurseryId);
Task<ImportApplicationResult> ImportApplicationAsync(int id, int nurseryId, ...);
Task RejectApplicationAsync(int id, int nurseryId, RejectApplicationRequest request);
```

#### ApplicationService ([ReactApp.Server/Services/ApplicationService.cs](../ReactApp.Server/Services/ApplicationService.cs))

**実装したビジネスロジック**:

1. **ApplicationKey検証**
   - Nurseriesテーブルとの照合
   - 保育園名・ID返却

2. **入園申込作成**
   - ApplicationKeyで保育園特定
   - 携帯電話番号正規化（ハイフン除去）
   - ApplicationWork挿入
   - ApplicationStatus: "Pending"

3. **申込一覧取得**
   - ステータスフィルター (Pending/Imported/Rejected)
   - 日付範囲フィルター (startDate, endDate)
   - ページネーション (page, pageSize)
   - CreatedAt降順ソート

4. **申込詳細取得**
   - ApplicationWork取得
   - 重複保護者チェック（携帯電話番号照合）
   - DuplicateParentInfo付きDTO返却

5. **入園申込取込（最重要ロジック）**
   - **トランザクション管理**
   - 申込状態検証 (Pending確認)
   - 携帯電話番号で保護者マスタ検索
   - **保護者処理**:
     - 一致あり → 更新 or そのまま (OverwriteParent)
     - 一致なし → 新規作成 (MAX+1採番)
   - **園児処理**:
     - 常に新規作成 (MAX+1採番)
     - ClassId = null (後で手動割り当て)
   - **ParentChildRelationship作成**
   - **ApplicationWork更新** (Imported, ImportedAt, ImportedByUserId)
   - ロールバック対応

6. **入園申込却下**
   - 状態検証 (取込済みは却下不可)
   - ApplicationStatus: "Rejected"
   - RejectionReason記録

**プライベートメソッド**:
- `NormalizePhoneNumber` - 電話番号正規化
- `BuildFullAddress` - 完全住所生成
- `CheckDuplicateParentAsync` - 重複保護者検出
- `GetNextParentIdAsync` - 保護者ID採番 (MAX+1)
- `GetNextChildIdAsync` - 園児ID採番 (MAX+1)

---

### 4. コントローラー層

#### ApplicationController ([ReactApp.Server/Controllers/ApplicationController.cs](../ReactApp.Server/Controllers/ApplicationController.cs))

**保護者向けAPI（認証不要）**:

| エンドポイント | メソッド | 機能 | レスポンス |
|---------------|---------|------|-----------|
| `/api/application/validate-key` | POST | ApplicationKey検証 | 200 OK / 400 Bad Request |
| `/api/application/submit?key={key}` | POST | 入園申込送信 | 201 Created / 400 / 404 / 429 |

**Rate Limiting**: `application-submit` (10件/時間/IP)

**エラーハンドリング**:
- ApplicationKey無効 → 404 Not Found
- バリデーションエラー → 400 Bad Request (詳細エラーメッセージ)
- レート制限超過 → 429 Too Many Requests

#### DesktopApplicationController ([ReactApp.Server/Controllers/DesktopApplicationController.cs](../ReactApp.Server/Controllers/DesktopApplicationController.cs))

**デスクトップAPI（JWT認証必須）**:

| エンドポイント | メソッド | 機能 | レスポンス |
|---------------|---------|------|-----------|
| `/api/desktop/application` | GET | 申込一覧取得 | 200 OK |
| `/api/desktop/application/{id}` | GET | 申込詳細取得 | 200 OK / 404 |
| `/api/desktop/application/{id}/import` | POST | 申込取込 | 200 OK / 400 / 404 / 409 |
| `/api/desktop/application/{id}/reject` | POST | 申込却下 | 200 OK / 400 / 404 |

**認証・認可**:
- JWTトークンから NurseryId, UserId 取得
- 自園の申込のみアクセス可能

**エラーハンドリング**:
- 申込なし → 404 Not Found
- 取込済み再取込 → 400 Bad Request
- トランザクション失敗 → 409 Conflict

---

### 5. DI登録・設定

#### Program.cs更新

**DI登録** ([ReactApp.Server/Program.cs:273](../ReactApp.Server/Program.cs#L273)):
```csharp
builder.Services.AddScoped<IApplicationService, ApplicationService>();
```

**Rate Limiting追加** ([ReactApp.Server/Program.cs:208-215](../ReactApp.Server/Program.cs#L208-L215)):
```csharp
options.AddFixedWindowLimiter("application-submit", config =>
{
    config.PermitLimit = 10;
    config.Window = TimeSpan.FromHours(1);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 2;
});
```

---

## 技術的特徴

### セキュリティ

1. **ApplicationKey検証**
   - UUID形式（予測困難）
   - Nurseriesテーブルとの照合必須

2. **Rate Limiting**
   - 入園申込送信: 10件/時間/IP
   - 悪意ある大量申込を防止

3. **認証・認可**
   - 保護者API: 認証不要（公開）
   - デスクトップAPI: JWT認証必須
   - 自園データのみアクセス可能

4. **データ検証**
   - FluentValidation統合可能
   - Data Annotations完備
   - モデルバインディングエラー詳細返却

### パフォーマンス

1. **インデックス最適化**
   - NurseryId, MobilePhone, ApplicationStatus, IsImported, CreatedAt
   - 一覧取得・重複チェック高速化

2. **ページネーション**
   - 一覧API標準対応 (page, pageSize)
   - デフォルト20件/ページ

3. **トランザクション管理**
   - 取込処理は1トランザクション
   - ロールバック対応

### データ整合性

1. **電話番号正規化**
   - ハイフン・スペース除去
   - 重複チェック精度向上

2. **ID採番ロジック**
   - MAX+1方式
   - 保護者ID・園児ID独立採番

3. **状態管理**
   - ApplicationStatus: Pending → Imported/Rejected（一方向）
   - IsImported=trueは再取込不可

4. **リレーション自動生成**
   - ParentChildRelationship自動作成
   - Relationship項目設定

---

## API仕様準拠

すべてのエンドポイントは [API設計書](../docs/desktop/api-design.md) のセクション11「入園申込管理API」に準拠しています。

---

## 次のステップ（Phase 3以降）

Phase 2完了により、バックエンドAPIは完全に実装されました。次のフェーズに進むことができます：

### Phase 3: 保護者向けWeb申込フォーム実装
- React コンポーネント作成
- react-hook-form統合
- バリデーション
- レスポンシブデザイン

### Phase 4: デスクトップアプリ取込画面実装
- 申込一覧画面
- 申込詳細画面
- 取込・却下機能
- 重複警告表示

### Phase 5: QRコード生成機能（オプション）
- 保育園マスタ画面拡張
- QRコード生成・ダウンロード

---

## テスト推奨事項

Phase 2完了後、以下のテストを実施することを推奨します：

### 1. Postmanテスト
- ApplicationKey検証 API
- 入園申込送信 API
- 申込一覧取得 API
- 申込詳細取得 API
- 申込取込 API
- 申込却下 API

### 2. シナリオテスト
- 重複保護者なし → 新規保護者・新規園児作成
- 重複保護者あり（上書きON） → 保護者更新・新規園児作成
- 重複保護者あり（上書きOFF） → 保護者そのまま・新規園児作成
- 取込済み申込の再取込試行 → エラー
- 却下済み申込の取込試行 → エラー

### 3. Rate Limitingテスト
- 1時間に11回申込送信 → 11回目で429エラー

---

## 作成ファイル一覧

### モデル層
- `ReactApp.Server/Models/ApplicationWork.cs`

### DTO層
- `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs`

### サービス層
- `ReactApp.Server/Services/IApplicationService.cs`
- `ReactApp.Server/Services/ApplicationService.cs`

### コントローラー層
- `ReactApp.Server/Controllers/ApplicationController.cs`
- `ReactApp.Server/Controllers/DesktopApplicationController.cs`

### 設定変更
- `ReactApp.Server/Data/KindergartenDbContext.cs` (更新)
- `ReactApp.Server/Program.cs` (更新)

---

**Phase 2実装完了！** 🎉

次は Phase 3（保護者向けWeb申込フォーム）または Phase 4（デスクトップアプリ取込画面）の実装に進むことができます。
