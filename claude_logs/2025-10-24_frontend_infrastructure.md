# デスクトップアプリ フロントエンド基盤構築完了

**実施日**: 2025-10-24
**作業内容**: デスクトップWebアプリ用React基盤の完全実装

## 実装ファイル一覧

### 1. 型定義 (Types)

#### reactapp.client/src/desktop/types/auth.ts
デスクトップ認証用の全型定義:
- `DesktopLoginRequest` - ログインリクエスト
- `DesktopLoginResponse` - ログインレスポンス (トークン + 保育園情報)
- `NurseryInfo` - 保育園情報
- `RefreshTokenRequest` - トークンリフレッシュリクエスト
- `ChangePasswordRequest` - パスワード変更リクエスト
- `AccountLockStatus` - アカウントロック状態
- `DesktopAuthState` - 認証状態 (Context用)
- `ApiResponse<T>` - 汎用APIレスポンス型
- `ApiError` - APIエラー詳細型

### 2. 認証Context (State Management)

#### reactapp.client/src/desktop/contexts/DesktopAuthContext.tsx

**機能**:
- React Context + useReducer によるグローバル認証状態管理
- LocalStorage への認証情報の永続化
- トークンリフレッシュ機能
- 自動ログイン復元 (ページリロード時)

**State管理**:
```typescript
interface DesktopAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  nursery: NurseryInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}
```

**Action種別**:
- `LOGIN` - ログイン成功
- `LOGOUT` - ログアウト
- `SET_ERROR` - エラー設定
- `SET_LOADING` - ローディング状態変更
- `UPDATE_TOKENS` - トークン更新 (リフレッシュ時)

**LocalStorage Keys**:
- `desktop_access_token` - JWTアクセストークン
- `desktop_refresh_token` - リフレッシュトークン
- `desktop_nursery` - 保育園情報 (JSON)
- `desktop_token_expires_at` - トークン有効期限 (Unix timestamp)

**Hooks**:
- `useDesktopAuth()` - 認証状態・関数へのアクセス

### 3. API通信層 (Services)

#### reactapp.client/src/desktop/services/apiClient.ts

**機能**:
- Axios インスタンス (ベースURL: `https://localhost:7154`)
- 自動JWT付与 (Authorizationヘッダー)
- 自動トークンリフレッシュ (401エラー時)
- リフレッシュ処理のキュー管理 (同時複数リクエスト対応)

**インターセプター**:

1. **リクエストインターセプター**:
   - LocalStorageからアクセストークンを取得
   - `Authorization: Bearer {token}` ヘッダーを自動付与

2. **レスポンスインターセプター**:
   - 401エラー検知 → トークンリフレッシュ試行
   - リフレッシュ中の他リクエストはキューイング
   - リフレッシュ成功 → キューの全リクエストを再実行
   - リフレッシュ失敗 → `/desktop/login` へリダイレクト

**エラーハンドリング**:
- トークン期限切れ → 自動リフレッシュ
- リフレッシュトークン期限切れ → 強制ログアウト

#### reactapp.client/src/desktop/services/authService.ts

**提供API**:

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| `login()` | POST /api/desktop/auth/login | ログイン |
| `refreshToken()` | POST /api/desktop/auth/refresh | トークンリフレッシュ |
| `logout()` | POST /api/desktop/auth/logout | ログアウト |
| `changePassword()` | PUT /api/desktop/auth/change-password | パスワード変更 |
| `checkLockStatus()` | GET /api/desktop/auth/lock-status/:id | ロック状態確認 |
| `unlockAccount()` | POST /api/desktop/auth/unlock/:id | ロック解除 |

**エラー処理**:
- Axios エラーをキャッチ
- `ApiResponse<T>` 型からエラーメッセージを抽出
- カスタムエラーメッセージをスロー

### 4. ページコンポーネント (Pages)

#### reactapp.client/src/desktop/pages/LoginPage.tsx

**UI機能**:
- ログインID・パスワード入力フォーム
- パスワード表示/非表示トグル
- ローディング状態表示
- エラーメッセージ表示
- 残りログイン試行回数表示
- アカウントロック警告

**バリデーション**:
- 必須入力チェック (HTML5 required属性)
- フロントエンドで最低限のバリデーション

**エラーハンドリング**:
```typescript
// エラーコードごとの処理
AUTH_ACCOUNT_LOCKED     → 「30分後に再試行」表示
AUTH_INVALID_CREDENTIALS → ログイン失敗メッセージ + 残り試行回数
ネットワークエラー      → 「接続確認」メッセージ
```

**デザイン**:
- グラデーション背景 (Blue → Indigo)
- カード型ログインフォーム
- Tailwind CSS レスポンシブデザイン
- アイコン・ローディングスピナー

#### reactapp.client/src/desktop/pages/DashboardPage.tsx

**ダッシュボード構成**:

1. **統計カード (4つ)**:
   - 在園児数
   - 職員数
   - クラス数
   - 今日の欠席数

2. **最近の活動**:
   - 最近の連絡帳一覧 (公開済み/下書き)
   - 今日の予定一覧

3. **クイックアクション**:
   - 連絡帳作成
   - 園児登録
   - 写真アップロード
   - お知らせ作成

**データ表示**:
- 現在はモックデータ (仮データ)
- Phase 2でAPI統合予定

### 5. レイアウトコンポーネント (Layout)

#### reactapp.client/src/desktop/components/layout/DashboardLayout.tsx

**レイアウト構造**:

```
┌─────────────────────────────────────────┐
│         Header (固定)                   │  ← ロゴ、保育園名、ユーザーメニュー
├─────────┬───────────────────────────────┤
│ Sidebar │   Main Content               │
│ (固定)  │   (スクロール可能)            │
│         │                              │
│ メニュー │   {children}                 │
│ 14項目  │                              │
│         │                              │
│         │                              │
└─────────┴───────────────────────────────┘
```

**ヘッダー機能**:
- サイドバートグルボタン
- 保育園名・年度表示
- ユーザーメニュー (プロフィール、パスワード変更、ログアウト)

**サイドバーメニュー (14項目)**:
1. 📊 ダッシュボード
2. 🏫 保育園情報
3. 👥 クラス管理
4. 👶 園児管理
5. 👨‍👩‍👧 保護者管理
6. 👩‍🏫 職員管理
7. 📋 連絡帳管理
8. 📸 写真管理
9. 📢 お知らせ管理
10. 📅 予定管理
11. 📞 欠席・遅刻管理
12. 🗓️ 年度管理
13. 📜 操作ログ
14. ⚙️ システム設定

**レスポンシブ機能**:
- サイドバー開閉アニメーション
- メインコンテンツ幅の自動調整

### 6. ルーティング (Router)

#### reactapp.client/src/desktop/DesktopApp.tsx

**ルート構成**:

| パス | コンポーネント | 認証 | 説明 |
|-----|--------------|------|------|
| `/desktop/login` | LoginPage | 不要 | ログイン画面 |
| `/desktop/dashboard` | DashboardPage | 必要 | ダッシュボード |
| `/desktop/` | リダイレクト | - | `/desktop/dashboard`へ |

**ProtectedRoute コンポーネント**:
- 認証状態チェック
- 未認証時 → `/desktop/login` へリダイレクト
- ローディング中 → スピナー表示

**Provider階層**:
```
<DesktopAuthProvider>
  <Routes>
    <Route path="/login" />
    <Route path="/dashboard" element={<ProtectedRoute />} />
  </Routes>
</DesktopAuthProvider>
```

#### reactapp.client/src/App.tsx への統合

**変更内容**:
1. デスクトップアプリのインポート追加
2. `/desktop/*` ルート追加
3. ホーム画面にデスクトップログインリンク追加

```tsx
<Route path="/desktop/*" element={<DesktopApp />} />
```

### 7. 環境設定

#### reactapp.client/.env.development
```
VITE_API_BASE_URL=https://localhost:7154
```

API Base URLを環境変数として設定。本番環境では異なるURLに変更可能。

## ディレクトリ構造

```
reactapp.client/src/desktop/
├── components/
│   ├── auth/           (認証コンポーネント - Phase 2で拡張)
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   └── common/         (共通コンポーネント - Phase 2で実装)
├── contexts/
│   └── DesktopAuthContext.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── services/
│   ├── apiClient.ts
│   └── authService.ts
├── types/
│   └── auth.ts
├── utils/              (ユーティリティ - Phase 2で実装)
└── DesktopApp.tsx
```

## 技術スタック

### フロントエンド
- **React 19.1** - UIライブラリ
- **TypeScript** - 型安全性
- **React Router v7** - ルーティング
- **Axios** - HTTP通信
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール

### State Management
- **React Context API** - グローバル状態管理
- **useReducer** - 複雑な状態ロジック

### ストレージ
- **LocalStorage** - 認証情報の永続化

## セキュリティ機能

### 1. トークン管理
- **アクセストークン**: 1時間有効期限、自動リフレッシュ
- **リフレッシュトークン**: 7日間有効期限
- **LocalStorage保存**: XSS対策として HttpOnly Cookie への移行を推奨 (Phase 3)

### 2. 自動リフレッシュ機構
- 401エラー時に自動トークンリフレッシュ
- リフレッシュ中の複数リクエストをキュー管理
- リフレッシュ失敗時は強制ログアウト

### 3. アカウント保護
- ログイン試行回数制限 (バックエンド側: 5回)
- アカウントロック表示
- 残り試行回数表示

## UI/UX 機能

### レスポンシブデザイン
- デスクトップPCに最適化 (1280px以上推奨)
- タブレット対応 (768px以上)
- サイドバー折りたたみ機能

### ローディング状態
- ページ初期読み込み時
- ログイン処理中
- API通信中

### エラーハンドリング
- ユーザーフレンドリーなエラーメッセージ
- 具体的なアクション提示
- ビジュアルフィードバック (赤色の警告ボックス)

## Phase 1 完了項目 ✅

1. ✅ **認証システム**
   - ログインページ実装
   - JWT トークン管理
   - 自動リフレッシュ機構
   - LocalStorage 永続化

2. ✅ **基本レイアウト**
   - ヘッダー (ロゴ、ユーザーメニュー)
   - サイドバー (14項目メニュー)
   - メインコンテンツエリア
   - レスポンシブ対応

3. ✅ **ダッシュボード**
   - 統計カード (4種類)
   - 最近の活動表示
   - クイックアクション

4. ✅ **API通信基盤**
   - Axios インスタンス設定
   - JWT自動付与
   - エラーハンドリング

5. ✅ **ルーティング**
   - ログイン画面
   - ダッシュボード
   - 認証ガード

## 次のステップ (Phase 2)

### マスタ管理画面実装

1. **保育園情報管理**
   - 基本情報編集
   - 表示設定

2. **クラス管理**
   - クラス一覧・作成・編集・削除
   - 年度ごとのクラス管理

3. **園児管理**
   - 園児一覧・登録・編集
   - 保護者関連付け
   - クラス割り当て

4. **保護者管理**
   - 保護者一覧・登録・編集
   - 園児との紐付け
   - 連絡先管理

5. **職員管理**
   - 職員一覧・登録・編集
   - クラス担当割り当て
   - 権限管理

### API統合
- ダッシュボードの実データ表示
- CRUD操作の実装
- バリデーション強化

## 動作確認方法

### 1. 開発サーバー起動

**バックエンド**:
```bash
cd ReactApp.Server
dotnet run
```
→ https://localhost:7154

**フロントエンド**:
```bash
cd reactapp.client
npm run dev
```
→ https://localhost:5173

### 2. アクセス

1. ブラウザで https://localhost:5173 を開く
2. トップページから「💻 デスクトップ管理ログイン」をクリック
3. ログインID・パスワードを入力 (要: DB初期データ)

### 3. テストデータ準備

デスクトップ認証用のテストアカウントを作成:

```sql
-- Nurseriesテーブルにテストアカウントを追加
UPDATE Nurseries
SET LoginId = 'admin',
    Password = '$2a$11$...' -- BCryptハッシュ化されたパスワード
WHERE Id = 1;
```

または、別途DBシードスクリプトを実行。

## 制限事項・既知の問題

### ビルドエラー
- モバイルアプリのファイルが不足しているため、`npm run build` は現在エラー
- デスクトップアプリのファイルは正常に実装済み
- 修正方法: モバイルアプリファイルの追加 または App.tsxの分離

### 未実装機能
- パスワード変更ページ
- プロフィール設定ページ
- マスタ管理画面 (Phase 2)
- 操作ログ画面 (Phase 4)

## 技術的メモ

### TypeScript 型インポート
`verbatimModuleSyntax` モード有効化により、型インポートは `type` キーワード必須:

```typescript
// ✅ 正しい
import type { ReactNode } from 'react';
import type { ApiResponse } from '../types/auth';

// ❌ エラー
import { ReactNode } from 'react';
import { ApiResponse } from '../types/auth';
```

### LocalStorage vs Cookie
現在は LocalStorage を使用しているが、セキュリティ強化のため HttpOnly Cookie への移行を推奨。

**理由**:
- LocalStorage → JavaScriptから読み取り可能 (XSS脆弱性)
- HttpOnly Cookie → JavaScriptから読み取り不可 (XSS保護)

**移行タイミング**: Phase 3 (セキュリティ強化フェーズ)

---

**実装完了**: 2025-10-24
**次フェーズ**: Phase 2 - マスタ管理画面実装
**テスト状態**: ローカル動作確認待ち (DB初期データ必要)
