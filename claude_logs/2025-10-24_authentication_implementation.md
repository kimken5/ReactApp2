# デスクトップアプリ認証サービス実装完了

**実施日**: 2025-10-24
**作業内容**: デスクトップアプリ専用認証サービスの完全実装

## 実装したファイル

### 1. DTO (Data Transfer Objects)

#### ReactApp.Server\DTOs\Desktop\DesktopLoginRequestDto.cs
- ログインID (必須、最大50文字)
- パスワード (必須、8文字以上、255文字以内)

#### ReactApp.Server\DTOs\Desktop\DesktopLoginResponseDto.cs
- アクセストークン (JWT)
- リフレッシュトークン
- 有効期限 (秒単位)
- 保育園情報 (NurseryInfoDto)

#### ReactApp.Server\DTOs\Desktop\RefreshTokenRequestDto.cs
- リフレッシュトークン (必須)

#### ReactApp.Server\DTOs\Desktop\ChangePasswordRequestDto.cs
- 現在のパスワード (必須)
- 新しいパスワード (必須、8文字以上、大文字・小文字・数字を含む)
- 正規表現バリデーション: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`

### 2. サービスインターフェース

#### ReactApp.Server\Services\IDesktopAuthenticationService.cs
メソッド一覧:
1. **LoginAsync** - ログインID・パスワード認証
2. **RefreshTokenAsync** - トークンリフレッシュ
3. **LogoutAsync** - ログアウト (トークン無効化)
4. **ChangePasswordAsync** - パスワード変更
5. **CheckAccountLockStatusAsync** - ロック状態確認
6. **ResetLoginAttemptsAsync** - ログイン試行回数リセット
7. **UnlockAccountAsync** - アカウントロック解除

### 3. サービス実装

#### ReactApp.Server\Services\DesktopAuthenticationService.cs

**セキュリティ定数**:
- 最大ログイン試行回数: 5回
- ロック時間: 30分
- アクセストークン有効期限: 1時間
- リフレッシュトークン有効期限: 7日

**主要機能**:

1. **ログイン処理** (`LoginAsync`)
   - BCryptによるパスワード検証
   - ログイン試行回数追跡
   - 自動アカウントロック (5回失敗で30分ロック)
   - 自動ロック解除 (期限切れの場合)
   - JWT アクセストークン生成
   - セキュアなリフレッシュトークン生成
   - 監査ログ記録

2. **トークンリフレッシュ** (`RefreshTokenAsync`)
   - リフレッシュトークン検証 (有効期限、無効化状態)
   - 新しいアクセストークン生成
   - 新しいリフレッシュトークン生成
   - 古いトークンの無効化
   - ローテーション方式によるセキュリティ強化

3. **パスワード変更** (`ChangePasswordAsync`)
   - 現在のパスワード検証
   - BCryptによる新パスワードハッシュ化
   - 監査ログ記録

4. **アカウント管理**
   - ロック状態確認
   - ログイン試行回数リセット
   - 管理者によるロック解除

**JWTトークン構造**:
```json
{
  "Claims": [
    "NameIdentifier": "nurseryId",
    "Name": "nurseryName",
    "NurseryId": "nurseryId",
    "LoginId": "loginId",
    "UserType": "Desktop",
    "Jti": "uniqueTokenId"
  ],
  "Issuer": "Jwt:Issuer from configuration",
  "Audience": "Jwt:Audience from configuration",
  "ExpiresIn": "1 hour",
  "SigningAlgorithm": "HmacSha256"
}
```

**セキュリティトークン生成**:
- 64バイトのランダムバイト配列
- RandomNumberGenerator (暗号学的に安全)
- Base64エンコード

### 4. コントローラー

#### ReactApp.Server\Controllers\DesktopAuthController.cs

**エンドポイント一覧**:

| メソッド | パス | 認証 | レート制限 | 説明 |
|---------|------|------|-----------|------|
| POST | /api/desktop/auth/login | 不要 | auth (10/min) | ログイン |
| POST | /api/desktop/auth/refresh | 不要 | auth (10/min) | トークンリフレッシュ |
| POST | /api/desktop/auth/logout | 必要 | auth (10/min) | ログアウト |
| PUT | /api/desktop/auth/change-password | 必要 | auth (10/min) | パスワード変更 |
| GET | /api/desktop/auth/lock-status/{nurseryId} | 必要 | auth (10/min) | ロック状態確認 |
| POST | /api/desktop/auth/unlock/{nurseryId} | 必要 | auth (10/min) | ロック解除 |

**レスポンス形式**:
```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public ApiError? Error { get; set; }
}

public class ApiError
{
    public string Code { get; set; }      // 例: "AUTH_INVALID_CREDENTIALS"
    public string Message { get; set; }   // 日本語エラーメッセージ
    public List<string>? Details { get; set; }
}
```

**エラーコード**:
- `AUTH_INVALID_CREDENTIALS` - ログインID/パスワード不正 (401)
- `AUTH_ACCOUNT_LOCKED` - アカウントロック中 (423)
- `AUTH_TOKEN_EXPIRED` - トークン期限切れ (401)
- `AUTH_TOKEN_INVALID` - トークン不正 (401)
- `AUTH_INVALID_PASSWORD` - 現在のパスワード不正 (401)
- `SERVER_ERROR` - サーバーエラー (500)

## Program.cs への登録

### 1. 依存性注入 (DI) 登録

```csharp
// Program.cs line 210
builder.Services.AddScoped<IDesktopAuthenticationService, DesktopAuthenticationService>();
```

### 2. レート制限ポリシー追加

```csharp
// Program.cs lines 199-206
options.AddFixedWindowLimiter("auth", config =>
{
    config.PermitLimit = 10;
    config.Window = TimeSpan.FromMinutes(1);
    config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    config.QueueLimit = 5;
});
```

**レート制限詳細**:
- 1分間に10リクエストまで許可
- キュー: 最大5リクエスト (古い順に処理)
- 超過時: HTTP 429 (Too Many Requests)

## ビルド結果

✅ **ビルド成功** (0エラー、45警告)
- 警告は既存コードベースからの継続警告のみ
- 新規実装に関するエラー・警告なし

## セキュリティ機能まとめ

### 認証セキュリティ
1. **BCrypt パスワードハッシュ** - ソルト付き不可逆ハッシュ
2. **JWT トークン** - 署名付きトークンによる改ざん防止
3. **トークンローテーション** - リフレッシュ時に古いトークン無効化
4. **短期アクセストークン** - 1時間で自動失効

### アカウント保護
1. **ログイン試行制限** - 5回まで (残り試行回数を表示)
2. **自動アカウントロック** - 5回失敗で30分ロック
3. **ロック期限自動解除** - 30分経過で自動的にロック解除
4. **管理者手動ロック解除** - API経由で即座に解除可能

### 監査・ログ
1. **監査ログ自動記録** - Login, Logout, ChangePassword, UnlockAccount
2. **IPアドレス記録** - 全認証イベントでIP・UserAgent記録
3. **構造化ログ** - Serilog による詳細ログ出力

### API保護
1. **レート制限** - 1分間10リクエスト制限
2. **HTTPS強制** - 本番環境でHTTPSリダイレクト
3. **CORS制限** - 許可されたオリジンのみアクセス可能

## 次のステップ候補

認証サービス実装完了により、以下の作業が可能になります:

1. **フロントエンド基盤構築** (Phase 1)
   - Reactプロジェクトセットアップ
   - ログインページ実装
   - トークン管理機構
   - 認証状態管理 (Context API)

2. **マスタ管理API実装** (Phase 2)
   - 保育園情報管理
   - クラス管理
   - 子ども管理
   - 保護者管理
   - 職員管理

3. **認証機能のテスト**
   - 単体テスト作成
   - 統合テスト作成
   - セキュリティテスト

## 技術的メモ

### 既存システムとの差異
- **モバイルアプリ**: SMS OTP認証 (電話番号ベース)
- **デスクトップアプリ**: ログインID・パスワード認証 (保育園単位)

### データベース要件
既存の `Nurseries` テーブルに以下のカラムが必要 (既に追加済み):
- LoginId (NVARCHAR(50))
- Password (NVARCHAR(255)) - BCryptハッシュ格納
- LastLoginAt (DATETIME)
- LoginAttempts (INT)
- IsLocked (BIT)
- LockedUntil (DATETIME)

### 依存NuGetパッケージ
- **BCrypt.Net-Next** - パスワードハッシュ化
- **System.IdentityModel.Tokens.Jwt** - JWTトークン生成・検証
- **Microsoft.IdentityModel.Tokens** - トークンセキュリティ

---

**実装完了**: 2025-10-24
**ビルド状態**: ✅ 成功
**テスト状態**: 未実施 (次フェーズ)
