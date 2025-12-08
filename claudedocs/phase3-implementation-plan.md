# Phase 3 実装計画: 保護者向けWeb申込フォーム

## 概要

保護者がQRコードをスキャンして入園申込を行うためのWebフォームを実装します。

## 技術スタック

- **フレームワーク**: React 19.1 + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **バリデーション**: Zod + React Hook Form
- **HTTPクライアント**: Axios
- **ルーティング**: React Router

## 画面フロー

```
1. ApplicationKey入力画面
   ↓
2. 保育園情報確認画面
   ↓
3. 申込フォーム画面
   ├─ 申請保護者情報 (13フィールド)
   └─ 園児情報 (7フィールド)
   ↓
4. 確認画面
   ↓
5. 送信完了画面
```

## ファイル構成

```
reactapp.client/src/
├── pages/
│   └── application/
│       ├── ApplicationKeyInput.tsx      # ApplicationKey入力
│       ├── NurseryInfo.tsx              # 保育園情報表示
│       ├── ApplicationForm.tsx          # 申込フォーム
│       ├── ApplicationConfirm.tsx       # 確認画面
│       └── ApplicationComplete.tsx      # 完了画面
├── components/
│   └── application/
│       ├── ApplicantInfoSection.tsx     # 保護者情報セクション
│       ├── ChildInfoSection.tsx         # 園児情報セクション
│       └── FormField.tsx                # 共通フォームフィールド
├── types/
│   └── application.ts                   # 申込関連の型定義
├── services/
│   └── applicationService.ts            # 申込API呼び出し
└── utils/
    └── validation.ts                    # バリデーションスキーマ
```

## データ型定義

### ApplicationFormData
```typescript
interface ApplicationFormData {
  // 申請保護者情報 (13フィールド)
  applicantName: string;
  applicantNameKana: string;
  dateOfBirth: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  mobilePhone: string;
  homePhone?: string;
  emergencyContact?: string;
  email?: string;
  relationshipToChild: string;

  // 園児情報 (7フィールド)
  childName: string;
  childNameKana: string;
  childDateOfBirth: string;
  childGender: string;
  childBloodType?: string;
  childMedicalNotes?: string;
  childSpecialInstructions?: string;
}
```

## バリデーションルール

### 必須フィールド
- applicantName, applicantNameKana
- dateOfBirth
- mobilePhone
- relationshipToChild
- childName, childNameKana
- childDateOfBirth
- childGender

### フォーマット検証
- **電話番号**: `090-1234-5678` または `09012345678` 形式
- **郵便番号**: `123-4567` または `1234567` 形式
- **メールアドレス**: RFC 5322準拠
- **日付**: YYYY-MM-DD形式

### 長さ制限
- 名前系: 最大100文字
- カナ: 最大100文字（全角カタカナのみ）
- 電話番号: 最大20文字
- メールアドレス: 最大255文字
- メモ系: 最大1000文字

## 実装ステップ

### Step 1: 型定義とバリデーションスキーマ作成
- [ ] `types/application.ts` 作成
- [ ] `utils/validation.ts` 作成 (Zodスキーマ)

### Step 2: APIサービス実装
- [ ] `services/applicationService.ts` 作成
  - validateApplicationKey()
  - submitApplication()

### Step 3: 共通コンポーネント実装
- [ ] `components/application/FormField.tsx`
- [ ] エラー表示コンポーネント
- [ ] ローディングスピナー

### Step 4: 各画面の実装
- [ ] ApplicationKeyInput.tsx
- [ ] NurseryInfo.tsx
- [ ] ApplicationForm.tsx (ApplicantInfoSection + ChildInfoSection)
- [ ] ApplicationConfirm.tsx
- [ ] ApplicationComplete.tsx

### Step 5: ルーティング設定
- [ ] App.tsx または routes.tsx に追加

### Step 6: 動作確認
- [ ] ApplicationKey検証フロー
- [ ] フォーム入力バリデーション
- [ ] API送信
- [ ] エラーハンドリング

## UIデザイン方針

### レイアウト
- モバイルファーストデザイン
- 最大幅: 768px (タブレットまで)
- レスポンシブ対応

### カラースキーム
- プライマリ: blue-600
- セカンダリ: gray-600
- エラー: red-600
- 成功: green-600

### フォントサイズ
- 見出し: text-2xl (24px)
- サブ見出し: text-xl (20px)
- 本文: text-base (16px)
- 説明文: text-sm (14px)

### スペーシング
- セクション間: mb-8
- フィールド間: mb-4
- ラベルとインプット: mb-2

## エラーハンドリング

### クライアント側
- バリデーションエラー: フィールド下に赤文字で表示
- 必須フィールド: アスタリスク(*)表示

### サーバー側
- 400 Bad Request: バリデーションエラーメッセージ表示
- 404 Not Found: ApplicationKey無効メッセージ
- 429 Too Many Requests: Rate Limitメッセージ
- 500 Internal Server Error: 一般エラーメッセージ

## アクセシビリティ

- [ ] aria-label 設定
- [ ] キーボードナビゲーション対応
- [ ] エラーメッセージのaria-describedby設定
- [ ] フォーカス管理

## パフォーマンス

- [ ] コード分割 (React.lazy)
- [ ] 画像最適化
- [ ] フォーム状態のメモ化

## セキュリティ

- [ ] XSS対策 (React自動エスケープ)
- [ ] CSRF対策 (不要: 公開API)
- [ ] 入力値サニタイゼーション
- [ ] ApplicationKeyの安全な管理

## 今後の拡張性

- [ ] 多言語対応 (i18next)
- [ ] 下書き保存機能 (LocalStorage)
- [ ] ファイルアップロード (写真等)
- [ ] 郵便番号自動住所入力
- [ ] 兄弟姉妹の追加入力

## 完成イメージ

### ApplicationKey入力画面
```
┌──────────────────────────────┐
│  入園申込フォーム              │
├──────────────────────────────┤
│  申込キーを入力してください    │
│                              │
│  [___________________]       │
│                              │
│  [次へ]                      │
└──────────────────────────────┘
```

### 申込フォーム画面
```
┌──────────────────────────────┐
│  さくら保育園 入園申込         │
├──────────────────────────────┤
│  ■ 申請保護者情報             │
│  お名前 *                    │
│  [___________________]       │
│                              │
│  フリガナ *                  │
│  [___________________]       │
│                              │
│  （以下、13フィールド続く）   │
│                              │
│  ■ 園児情報                  │
│  お名前 *                    │
│  [___________________]       │
│                              │
│  （以下、7フィールド続く）    │
│                              │
│  [戻る]  [確認画面へ]        │
└──────────────────────────────┘
```

## 見積もり

- **実装時間**: 2-3時間
- **テスト時間**: 30分
- **合計**: 約3-3.5時間
