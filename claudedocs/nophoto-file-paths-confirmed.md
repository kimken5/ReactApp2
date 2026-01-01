# NoPhoto機能実装 - 確認済みファイルパス一覧

**確認日**: 2025-12-17

## ✅ 確認済みファイルパス

### バックエンド

#### モデル
- ✅ `ReactApp.Server/Models/ApplicationWork.cs` - ApplicationWorkモデル
- ✅ `ReactApp.Server/Models/Child.cs` - Childモデル

#### DTO
- ✅ `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs` - ApplicationWork DTO
- ✅ `ReactApp.Server/DTOs/Desktop/ChildDto.cs` - Desktop用Child DTO
- ✅ `ReactApp.Server/DTOs/ChildDto.cs` - モバイル用Child DTO

#### サービス
- ✅ `ReactApp.Server/Services/ApplicationService.cs` - 申込サービス
- ✅ `ReactApp.Server/Services/IApplicationService.cs` - サービスインターフェース

#### コントローラー
- ✅ `ReactApp.Server/Controllers/DesktopPhotoController.cs` - 写真コントローラー

---

### フロントエンド

#### 型定義
- ✅ `reactapp.client/src/types/application.ts` - 旧申込フォーム型定義（1園児）
- ✅ `reactapp.client/src/types/publicApplication.ts` - **新申込フォーム型定義（複数園児対応）**
- ✅ `reactapp.client/src/types/desktopApplication.ts` - Desktop申込管理型定義
- 🔍 `reactapp.client/src/types/child.ts` - **存在しない**（childClassAssignment.tsのみ）

**重要**: Child型定義は**存在しない**可能性が高い。Desktop用は `desktopApplication.ts` 内で定義されている可能性。

#### 申込フォーム関連
- ✅ `reactapp.client/src/pages/ApplicationFormPage.tsx` - **入園申込フォーム（メインコンポーネント）**
- ✅ `reactapp.client/src/pages/ApplicationCompletePage.tsx` - 申込完了画面

#### サービス
- ✅ `reactapp.client/src/services/applicationService.ts` - 申込サービス
- ✅ `reactapp.client/src/services/publicApplicationService.ts` - **公開申込サービス（複数園児対応）**
- ✅ `reactapp.client/src/services/desktopApplicationService.ts` - Desktop申込管理サービス

#### 園児管理画面
- ✅ `reactapp.client/src/desktop/pages/ChildrenPage.tsx` - **園児一覧画面**
- ✅ `reactapp.client/src/desktop/pages/ChildFormPage.tsx` - 園児フォーム画面
- ✅ `reactapp.client/src/desktop/components/children/ChildEditModal.tsx` - **園児編集モーダル**

#### 写真アップロード関連
- ✅ `reactapp.client/src/desktop/pages/PhotoUploadPage.tsx` - **写真アップロード画面**
- ✅ `reactapp.client/src/desktop/pages/PhotosPage.tsx` - 写真一覧画面
- ✅ `reactapp.client/src/desktop/pages/PhotoDetailPage.tsx` - 写真詳細画面
- ✅ `reactapp.client/src/desktop/components/DailyReportPhotoUpload.tsx` - 日報写真アップロード
- ✅ `reactapp.client/src/desktop/components/common/PhotoDetailModal.tsx` - 写真詳細モーダル

---

## 📋 実装対象ファイル詳細

### Phase 1: バックエンドモデル・DTO更新

| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| `ReactApp.Server/Models/ApplicationWork.cs` | `ChildNoPhoto` プロパティ追加 | 🔴 高 |
| `ReactApp.Server/Models/Child.cs` | `NoPhoto` プロパティ追加 | 🔴 高 |
| `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs` | `ChildNoPhoto` プロパティ追加 | 🔴 高 |
| `ReactApp.Server/DTOs/Desktop/ChildDto.cs` | `NoPhoto` プロパティ追加（3箇所: ChildDto, CreateChildRequestDto, UpdateChildRequestDto） | 🔴 高 |

---

### Phase 2: 入園申込フォームUI実装

| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| `reactapp.client/src/types/publicApplication.ts` | `ChildInfo` インターフェースに `childNoPhoto?: boolean` 追加 | 🔴 高 |
| `reactapp.client/src/pages/ApplicationFormPage.tsx` | 各園児カードに NoPhoto チェックボックス追加 | 🔴 高 |
| `reactapp.client/src/services/publicApplicationService.ts` | API送信時に `childNoPhoto` を含める | 🔴 高 |

**注**: 申込フォームは**複数園児対応**（最大4人）のため、各園児ごとにチェックボックスが必要。

---

### Phase 3: 申込インポート時のデータ移行処理

| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| `ReactApp.Server/Services/ApplicationService.cs` | `ImportApplicationAsync` 内で `ChildNoPhoto → NoPhoto` マッピング追加 | 🔴 高 |
| `ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs` | `ImportApplicationResult` に `NoPhotoSet` プロパティ追加 | 🟡 中 |
| `reactapp.client/src/desktop/components/application/` | インポート結果表示に NoPhoto 設定の通知追加 | 🟡 中 |

---

### Phase 4: 園児マスタ管理画面UI実装

| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| `reactapp.client/src/desktop/pages/ChildrenPage.tsx` | 一覧に「撮影禁止」列を追加 | 🟡 中 |
| `reactapp.client/src/desktop/components/children/ChildEditModal.tsx` | NoPhoto チェックボックス追加 | 🔴 高 |
| `reactapp.client/src/types/desktopApplication.ts` または新規 | Child型に `noPhoto` プロパティ追加 | 🔴 高 |

---

### Phase 5: 写真アップロード警告システム

| ファイル | 変更内容 | 優先度 |
|---------|---------|--------|
| `ReactApp.Server/Controllers/DesktopPhotoController.cs` | `POST /api/desktop/photos/validate-children` エンドポイント追加 | 🟢 低 |
| `ReactApp.Server/DTOs/PhotoDto.cs` (新規) | `ValidateChildrenRequest/Response` DTO作成 | 🟢 低 |
| `reactapp.client/src/desktop/pages/PhotoUploadPage.tsx` | 園児選択後の検証処理と警告表示追加 | 🟢 低 |

---

## 🔍 特記事項

### 申込フォームの複数園児対応
- `publicApplication.ts` の `ChildInfo[]` 配列で最大4人の園児を管理
- 各園児ごとに `childNoPhoto` フラグを持つ必要がある
- バックエンドは1園児1レコードなので、ループ処理で複数の `ApplicationWork` レコードを作成

### 型定義の構造
- **公開申込フォーム**: `publicApplication.ts` (複数園児対応)
- **旧申込フォーム**: `application.ts` (1園児のみ、おそらく非推奨)
- **Desktop管理画面**: `desktopApplication.ts` (ApplicationWork管理用)
- **Child独立型定義**: 存在しない（各ファイル内で定義されている）

### DTO の重複
- `ReactApp.Server/DTOs/ChildDto.cs` - モバイル用
- `ReactApp.Server/DTOs/Desktop/ChildDto.cs` - Desktop用
- **両方に `NoPhoto` を追加する必要がある**

---

## 次のステップ

Phase 1のバックエンド実装から開始:
1. ✅ `ApplicationWork.cs` に `ChildNoPhoto` 追加
2. ✅ `Child.cs` に `NoPhoto` 追加
3. ✅ Desktop版 `ChildDto.cs` に `NoPhoto` 追加（3箇所）
4. ✅ モバイル版 `ChildDto.cs` に `NoPhoto` 追加
5. ✅ `ApplicationWorkDto.cs` に `ChildNoPhoto` 追加

すべてのファイルパスが確認できたので、実装を開始できます。
