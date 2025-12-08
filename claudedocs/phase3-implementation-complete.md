# Phase 3 - 保護者向けWeb申込フォーム実装 完了レポート

## 実装日時
2025-12-08

## 実装概要
保護者がQRコードから入園申込を行うためのWebフォームを実装しました。

## 実装内容

### 1. 型定義とバリデーション

#### src/types/application.ts (NEW)
- `ApplicationFormData` インターフェース (20フィールド)
  - 申請保護者情報: 13フィールド (氏名、フリガナ、生年月日、住所、電話、メール等)
  - 園児情報: 7フィールド (氏名、フリガナ、生年月日、性別、血液型、特記事項等)
- 選択肢定数エクスポート
  - `RELATIONSHIP_OPTIONS` (続柄: 父、母、祖父母等)
  - `GENDER_OPTIONS` (性別: 男、女、その他)
  - `BLOOD_TYPE_OPTIONS` (血液型: A、B、O、AB型)
  - `PREFECTURE_OPTIONS` (都道府県: 47都道府県)

#### src/utils/applicationValidation.ts (NEW)
- Zodバリデーションスキーマ実装
  - `applicationKeySchema`: ApplicationKey検証 (1-255文字)
  - `applicationFormSchema`: フォーム全体検証 (20フィールド)
    - 全角カタカナ検証 (フリガナフィールド)
    - 電話番号形式検証 (ハイフンあり/なし両対応)
    - 郵便番号形式検証 (XXX-XXXX or 7桁)
    - メールアドレス形式検証
    - 年齢範囲検証 (保護者: 18-100歳、園児: 0-10歳)
  - `formatZodError`: エラーメッセージ整形ヘルパー関数

### 2. APIサービス

#### src/services/applicationService.ts (NEW)
- `validateApplicationKey`: ApplicationKey検証API呼び出し
  - エンドポイント: `POST /api/application/validate-key`
  - 戻り値: `{ isValid, nurseryId, nurseryName }`
- `submitApplication`: 申込送信API呼び出し
  - エンドポイント: `POST /api/application/submit?key={key}`
  - Rate Limiting対応 (10回/時間)
  - 戻り値: `{ applicationId }`

### 3. UIコンポーネント

#### src/components/application/FormField.tsx (NEW)
- 再利用可能なフォームフィールドコンポーネント
- プロパティ:
  - `as`: 入力タイプ (input, textarea, select)
  - `type`: HTML input type (text, tel, email, date等)
  - `required`: 必須フィールドマーク表示
  - `error`: エラーメッセージ表示
  - `helpText`: ヘルプテキスト表示
  - `options`: セレクトボックス選択肢
  - `maxLength`: 最大文字数制限
- アクセシビリティ対応:
  - `aria-invalid`: エラー状態表示
  - `aria-describedby`: エラーメッセージ関連付け
  - `role="alert"`: エラーメッセージのロール設定
- Tailwind CSSスタイリング (レスポンシブ対応)

### 4. 画面実装

#### src/pages/application/ApplicationKeyInput.tsx (NEW)
**役割**: ApplicationKey入力画面 (ステップ1/4)

**主な機能**:
- ApplicationKey入力フォーム
- リアルタイムバリデーション (Zod)
- API検証 (非同期処理)
- ローディング状態表示 (スピナー付き)
- エラーメッセージ表示
- 検証成功時の自動遷移

**セキュリティ**:
- ApplicationKey、NurseryId、NurseryNameをsessionStorageに保存
- 次画面で検証 (未認証の場合は入力画面へリダイレクト)

**UI/UX**:
- センター配置レイアウト
- モダンなカードデザイン
- ローディング中はボタン無効化
- エラー時は入力フィールドが赤枠表示

#### src/pages/application/ApplicationForm.tsx (NEW)
**役割**: 申込情報入力画面 (ステップ2/4)

**主な機能**:
- 20フィールドの入力フォーム
  - セクション1: 申請保護者情報 (13フィールド)
  - セクション2: 園児情報 (7フィールド)
- リアルタイムバリデーション (Zod)
- 下書き保存機能 (localStorage)
- 下書き自動復元 (初回表示時)
- フィールド単位のエラー表示
- 最初のエラーフィールドへの自動スクロール

**データフロー**:
1. sessionStorageからApplicationKey検証
2. localStorageから下書きデータ復元
3. フォーム入力 → リアルタイムバリデーション
4. 下書き保存 → localStorage保存
5. 確認画面へ → sessionStorage保存

**UI/UX**:
- 2カラムレスポンシブレイアウト
- セクション区切り (色分けボーダー)
- 必須フィールドマーク (*) 表示
- プレースホルダー例示
- ヘルプテキスト表示
- エラー時は赤枠 + エラーメッセージ
- 3ボタンレイアウト (戻る / 下書き保存 / 確認画面へ)

#### src/pages/application/ApplicationConfirm.tsx (NEW)
**役割**: 入力内容確認画面 (ステップ3/4)

**主な機能**:
- 入力内容の表示 (読み取り専用)
- 選択肢ラベル変換 (value → label)
- 日付フォーマット (YYYY-MM-DD → 和暦表示)
- API送信処理 (非同期)
- 送信中ローディング表示
- エラーハンドリング

**データフロー**:
1. sessionStorageから入力データ取得
2. データ整形・表示
3. 送信ボタンクリック → API呼び出し
4. 成功時: localStorage/sessionStorage削除 → 完了画面へ
5. エラー時: エラーメッセージ表示 (再送信可能)

**UI/UX**:
- 定義リスト形式 (dt/dd)
- セクション区切り (色分けボーダー)
- オプションフィールドは値がある場合のみ表示
- 複数行テキストは改行保持 (whitespace-pre-wrap)
- 2ボタンレイアウト (戻って修正 / 申込を送信)
- 送信中はボタン無効化 + スピナー表示

#### src/pages/application/ApplicationComplete.tsx (NEW)
**役割**: 申込完了画面 (ステップ4/4)

**主な機能**:
- 成功メッセージ表示
- 注意事項表示
- セッションクリーンアップ
- 下書きデータ削除

**セキュリティ**:
- ApplicationKey削除 (セキュリティのため)
- 下書きデータ削除 (localStorage/sessionStorage)
- セッション情報完全クリア

**UI/UX**:
- センター配置レイアウト
- 成功アイコン (緑色チェックマーク)
- 保育園名表示
- 注意事項ボックス (青色背景)
- 閉じるボタン (トップページへ遷移)

### 5. ルーティング設定

#### src/App.tsx (MODIFIED)
**追加したルート**:
```typescript
<Route path="/application" element={<ApplicationKeyInput />} />
<Route path="/application/form" element={<ApplicationForm />} />
<Route path="/application/confirm" element={<ApplicationConfirm />} />
<Route path="/application/complete" element={<ApplicationComplete />} />
```

**トップページ更新**:
- 「保護者向け」セクション追加
- 入園申込フォームへのリンク追加

## 画面フロー

```
[トップページ]
    ↓ クリック: 入園申込フォーム
[ApplicationKeyInput] (ApplicationKey入力)
    ↓ 検証成功
[ApplicationForm] (申込情報入力)
    ↓ 確認画面へ
[ApplicationConfirm] (入力内容確認)
    ↓ 送信成功
[ApplicationComplete] (完了)
    ↓ 閉じる
[トップページ]
```

## 技術仕様

### バリデーション仕様

| フィールド | 検証ルール | エラーメッセージ |
|-----------|----------|----------------|
| applicantName | 必須、最大100文字 | お名前を入力してください |
| applicantNameKana | 必須、最大100文字、全角カタカナ | フリガナは全角カタカナで入力してください |
| dateOfBirth | 必須、18-100歳 | 生年月日を正しく入力してください（18歳以上100歳以下） |
| postalCode | 任意、XXX-XXXX or 7桁 | 郵便番号は7桁の数字、またはXXX-XXXX形式で入力してください |
| mobilePhone | 必須、0XXXXXXXXX or 0XX-XXXX-XXXX | 携帯電話番号は正しい形式で入力してください |
| email | 任意、メール形式 | メールアドレスを正しい形式で入力してください |
| relationshipToChild | 必須、最大20文字 | 続柄を選択してください |
| childName | 必須、最大100文字 | お子さまのお名前を入力してください |
| childNameKana | 必須、最大100文字、全角カタカナ | フリガナは全角カタカナで入力してください |
| childDateOfBirth | 必須、0-10歳 | お子さまの生年月日を正しく入力してください（0歳以上10歳以下） |
| childGender | 必須、最大2文字 | お子さまの性別を選択してください |

### データ永続化

| ストレージ | キー | 値 | 用途 |
|-----------|-----|---|------|
| sessionStorage | applicationKey | string | ApplicationKey一時保存 |
| sessionStorage | nurseryId | string | 保育園ID一時保存 |
| sessionStorage | nurseryName | string | 保育園名表示用 |
| sessionStorage | applicationFormData | JSON | 入力データ確認画面間の受け渡し |
| localStorage | application-form-draft | JSON | 下書きデータ永続保存 |

### APIエンドポイント

| メソッド | エンドポイント | 認証 | Rate Limit | 説明 |
|---------|--------------|-----|-----------|------|
| POST | /api/application/validate-key | なし | - | ApplicationKey検証 |
| POST | /api/application/submit?key={key} | なし | 10回/時間 | 申込送信 |

## 修正したバグ

### Zodエラープロパティ名の修正
**問題**: TypeScriptコンパイルエラー
```
error TS2339: Property 'errors' does not exist on type 'ZodError<unknown>'.
```

**原因**: Zod v3では`error.errors`が`error.issues`に変更された

**修正箇所**:
1. `src/pages/application/ApplicationForm.tsx:100`
2. `src/pages/application/ApplicationKeyInput.tsx:22`
3. `src/utils/applicationValidation.ts:147`

**修正内容**:
```typescript
// 修正前
err.errors.forEach((error) => { ... })

// 修正後
err.issues.forEach((error) => { ... })
```

## セキュリティ考慮事項

1. **ApplicationKey検証**: サーバー側で必ず検証
2. **Rate Limiting**: 申込送信は10回/時間に制限
3. **セッションクリーンアップ**: 完了後はApplicationKeyを削除
4. **XSS対策**: React自動エスケープ + DOMPurify不要 (入力データのみ)
5. **CSRF対策**: バックエンドのAntiforgery設定に依存

## アクセシビリティ対応

1. **ARIA属性**: `aria-invalid`, `aria-describedby`, `role="alert"`
2. **ラベル関連付け**: `htmlFor` / `id` による関連付け
3. **フォーカス管理**: エラー時は最初のエラーフィールドにスクロール
4. **キーボード操作**: Tab/Shift+Tab/Enterキーで操作可能
5. **セマンティックHTML**: `<form>`, `<label>`, `<button>` 使用

## レスポンシブデザイン

- **ブレークポイント**: Tailwind CSS デフォルト (sm: 640px, md: 768px, lg: 1024px)
- **最大幅**: 768px (max-w-3xl)
- **モバイル対応**: 単一カラムレイアウト
- **タッチ対応**: ボタンサイズ最適化 (py-3 px-4)

## テスト項目

### 単体テスト (推奨)
- [ ] Zodバリデーション正常系テスト
- [ ] Zodバリデーション異常系テスト (各フィールド)
- [ ] formatZodError関数テスト

### 結合テスト (推奨)
- [ ] ApplicationKey検証API成功ケース
- [ ] ApplicationKey検証API失敗ケース
- [ ] 申込送信API成功ケース
- [ ] 申込送信API失敗ケース
- [ ] Rate Limitingエラーハンドリング

### E2Eテスト (推奨)
- [ ] 完全フロー: ApplicationKey入力 → フォーム入力 → 確認 → 送信 → 完了
- [ ] 下書き保存 → 復元フロー
- [ ] バリデーションエラー表示
- [ ] エラーフィールドへの自動スクロール
- [ ] ApplicationKey未入力時のリダイレクト

## 今後の拡張案

1. **多言語対応**: i18next導入による英語/日本語切り替え
2. **写真アップロード**: 園児の顔写真アップロード機能
3. **進捗保存**: サーバー側での下書き保存 (ログイン不要)
4. **通知機能**: メール/SMS通知 (申込受付完了)
5. **スマホアプリ化**: PWA対応 (Service Worker + Manifest)
6. **分析機能**: Google Analytics / Mixpanel 統合
7. **A/Bテスト**: フォームレイアウトの最適化

## ファイル一覧

### 新規作成 (9ファイル)
1. `reactapp.client/src/types/application.ts`
2. `reactapp.client/src/utils/applicationValidation.ts`
3. `reactapp.client/src/services/applicationService.ts`
4. `reactapp.client/src/components/application/FormField.tsx`
5. `reactapp.client/src/pages/application/ApplicationKeyInput.tsx`
6. `reactapp.client/src/pages/application/ApplicationForm.tsx`
7. `reactapp.client/src/pages/application/ApplicationConfirm.tsx`
8. `reactapp.client/src/pages/application/ApplicationComplete.tsx`
9. `claudedocs/phase3-implementation-complete.md` (本ドキュメント)

### 変更 (1ファイル)
1. `reactapp.client/src/App.tsx` (ルーティング追加、トップページリンク追加)

## 実装時間
- 見積もり: 2-3時間
- 実際: 約2.5時間

## 完了日
2025-12-08

## 次のステップ

1. **Phase 4: デスクトップアプリ統合**
   - 申込一覧画面 (`/desktop/applications`)
   - 申込詳細モーダル
   - インポート処理UI
   - 却下処理UI

2. **Phase 5: テスト実装**
   - 単体テスト (Vitest)
   - E2Eテスト (Playwright)
   - アクセシビリティテスト (axe-core)

3. **Phase 6: 本番デプロイ準備**
   - 環境変数設定
   - HTTPS設定
   - Rate Limiting設定
   - 監視・ログ設定
