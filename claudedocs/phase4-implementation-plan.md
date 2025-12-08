# Phase 4 - デスクトップアプリ統合 実装計画

## 概要

Phase 2で実装したバックエンドAPIをデスクトップ管理画面から操作できるようにします。
職員が保護者からの入園申込を確認し、インポート（保護者・園児データ取り込み）または却下できるUIを実装します。

## 実装予定時間
約3-4時間

## 画面構成

### 1. 申込一覧ページ (`/desktop/applications`)
- **目的**: 入園申込の一覧表示とフィルタリング
- **主な機能**:
  - 申込一覧のテーブル表示（ページネーション対応）
  - ステータスフィルター（全て / 保留 / インポート済み / 却下済み）
  - 検索機能（申請者名、園児名、電話番号）
  - 並び替え（申込日時、ステータス）
  - 詳細表示ボタン → モーダル表示
  - インポート/却下ボタン

### 2. 申込詳細モーダル
- **目的**: 申込内容の詳細確認
- **表示内容**:
  - 申請保護者情報（13フィールド）
  - 園児情報（7フィールド）
  - 申込管理情報（ステータス、申込日時等）
  - 重複保護者情報（該当する場合）
  - インポート/却下ボタン

### 3. インポート処理UI
- **目的**: 保護者・園児データの取り込み確認
- **表示内容**:
  - 重複保護者の確認
    - 既存保護者を使用 / 新規保護者を作成
  - インポート内容のプレビュー
    - 作成される保護者レコード
    - 作成される園児レコード
    - 作成される関係レコード
  - 確認ボタン → API呼び出し

### 4. 却下処理UI
- **目的**: 申込の却下理由入力
- **入力項目**:
  - 却下理由（必須、1-500文字）
- **確認ボタン** → API呼び出し

## データ型定義

### ApplicationWorkDto (既存)
バックエンドで既に定義済み。フロントエンドで同じ型を作成。

```typescript
export interface ApplicationWorkDto {
  id: number;
  nurseryId: number;

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

  // 申込管理情報 (7フィールド)
  applicationStatus: 'Pending' | 'Imported' | 'Rejected';
  isImported: boolean;
  importedAt?: string;
  importedByUserId?: number;
  rejectedAt?: string;
  rejectedByUserId?: number;
  rejectionReason?: string;

  // 申込日時
  createdAt: string;

  // 重複保護者情報
  duplicateParentInfo?: DuplicateParentInfo;
}

export interface DuplicateParentInfo {
  hasDuplicate: boolean;
  existingParentId?: number;
  existingParentName?: string;
  childCount: number;
}
```

### APIリクエスト型

```typescript
export interface ImportApplicationRequest {
  useExistingParent: boolean;
  existingParentId?: number;
}

export interface RejectApplicationRequest {
  rejectionReason: string;
}
```

### ページネーション型 (既存)

```typescript
export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

## API呼び出し

### APIサービス (`src/services/desktopApplicationService.ts`)

```typescript
import axios from 'axios';
import type { ApplicationWorkDto, ImportApplicationRequest, RejectApplicationRequest } from '../types/desktopApplication';

const API_BASE_URL = '/api/desktop/application';

/**
 * 申込一覧を取得
 */
export async function getApplicationList(params: {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResult<ApplicationWorkDto>> {
  const response = await axios.get(API_BASE_URL, { params });
  return response.data;
}

/**
 * 申込詳細を取得
 */
export async function getApplicationDetail(id: number): Promise<ApplicationWorkDto> {
  const response = await axios.get(`${API_BASE_URL}/${id}`);
  return response.data;
}

/**
 * 申込をインポート
 */
export async function importApplication(
  id: number,
  request: ImportApplicationRequest
): Promise<ImportApplicationResult> {
  const response = await axios.post(`${API_BASE_URL}/${id}/import`, request);
  return response.data;
}

/**
 * 申込を却下
 */
export async function rejectApplication(
  id: number,
  request: RejectApplicationRequest
): Promise<void> {
  await axios.post(`${API_BASE_URL}/${id}/reject`, request);
}
```

## UI設計

### 申込一覧テーブル

| 列名 | 内容 | 幅 |
|-----|------|-----|
| ID | 申込ID | 80px |
| ステータス | Pending/Imported/Rejected | 100px |
| 申請者名 | 申請保護者氏名 | 150px |
| 園児名 | 園児氏名 | 150px |
| 続柄 | 申請者と園児の続柄 | 80px |
| 携帯電話 | 申請者携帯番号 | 140px |
| 申込日時 | 申込日時 | 160px |
| 重複 | 重複保護者の有無 | 80px |
| 操作 | 詳細/インポート/却下 | 200px |

### ステータス表示

- **Pending**: 🟡 保留中 (黄色バッジ)
- **Imported**: 🟢 取り込み済み (緑色バッジ)
- **Rejected**: 🔴 却下済み (赤色バッジ)

### フィルターUI

```
[ステータス: v 全て     ] [検索: _____________] [🔍]
```

### 操作ボタン

- **詳細**: 青色ボタン → モーダル表示
- **インポート**: 緑色ボタン → インポート確認モーダル (Pending時のみ表示)
- **却下**: 赤色ボタン → 却下理由入力モーダル (Pending時のみ表示)

## ファイル構成

```
reactapp.client/src/
├── types/
│   └── desktopApplication.ts (NEW)
├── services/
│   └── desktopApplicationService.ts (NEW)
├── desktop/
│   ├── pages/
│   │   └── ApplicationsPage.tsx (NEW)
│   └── components/
│       ├── application/
│       │   ├── ApplicationListTable.tsx (NEW)
│       │   ├── ApplicationDetailModal.tsx (NEW)
│       │   ├── ImportApplicationModal.tsx (NEW)
│       │   └── RejectApplicationModal.tsx (NEW)
│       └── ... (既存)
└── ...
```

## 実装順序

1. **型定義とAPIサービス**
   - `types/desktopApplication.ts` 作成
   - `services/desktopApplicationService.ts` 作成

2. **申込一覧ページ**
   - `desktop/pages/ApplicationsPage.tsx` 作成
   - `desktop/components/application/ApplicationListTable.tsx` 作成

3. **申込詳細モーダル**
   - `desktop/components/application/ApplicationDetailModal.tsx` 作成

4. **インポート処理UI**
   - `desktop/components/application/ImportApplicationModal.tsx` 作成

5. **却下処理UI**
   - `desktop/components/application/RejectApplicationModal.tsx` 作成

6. **ルーティング設定**
   - `desktop/DesktopApp.tsx` にルート追加

7. **ナビゲーションメニュー更新**
   - サイドバーに「入園申込管理」リンク追加

## 技術仕様

### 状態管理
- React useState/useEffect
- ページネーション状態
- フィルター状態
- モーダル表示状態

### エラーハンドリング
- API呼び出しエラー表示
- 401 Unauthorized → ログイン画面へリダイレクト
- 403 Forbidden → 権限エラー表示
- 404 Not Found → 申込が見つかりません
- 500 Internal Server Error → サーバーエラー表示

### ローディング状態
- テーブルローディング中はスケルトン表示
- インポート/却下処理中はボタン無効化 + スピナー表示

### バリデーション
- 却下理由: 必須、1-500文字

### アクセシビリティ
- テーブルに適切な`<thead>`, `<tbody>`, `<th>`, `<td>`
- モーダルに`role="dialog"`, `aria-labelledby`, `aria-describedby`
- フォーカストラップ (モーダル内でのTab順序)
- Escキーでモーダル閉じる

## 想定されるユーザーストーリー

### ユーザーストーリー1: 申込一覧の確認
```
As a 職員
I want to 入園申込の一覧を確認したい
So that どの申込がまだ処理されていないか把握できる
```

### ユーザーストーリー2: 申込詳細の確認
```
As a 職員
I want to 申込の詳細内容を確認したい
So that 申請者と園児の情報を詳しく見られる
```

### ユーザーストーリー3: 申込のインポート
```
As a 職員
I want to 申込をインポートして保護者・園児データを作成したい
So that システムに正式にデータを取り込める
```

### ユーザーストーリー4: 重複保護者の確認
```
As a 職員
I want to 重複する保護者がいる場合に確認したい
So that 既存の保護者データを使うか新規作成するか判断できる
```

### ユーザーストーリー5: 申込の却下
```
As a 職員
I want to 不適切な申込を却下したい
So that 却下理由を記録して申込を却下できる
```

## テストシナリオ

### 1. 申込一覧表示テスト
- [ ] 申込が0件の場合「申込がありません」と表示される
- [ ] 申込が複数件ある場合、テーブルに表示される
- [ ] ページネーションが正しく動作する
- [ ] ステータスフィルターが動作する
- [ ] 検索機能が動作する

### 2. 申込詳細表示テスト
- [ ] 詳細ボタンクリックでモーダルが表示される
- [ ] モーダル内に全フィールドが表示される
- [ ] 重複保護者情報が表示される（該当する場合）

### 3. インポート処理テスト
- [ ] インポートボタンクリックで確認モーダルが表示される
- [ ] 重複保護者がいる場合、選択肢が表示される
- [ ] インポート成功時、一覧が更新される
- [ ] インポート失敗時、エラーメッセージが表示される

### 4. 却下処理テスト
- [ ] 却下ボタンクリックで理由入力モーダルが表示される
- [ ] 却下理由が空の場合、エラー表示される
- [ ] 却下成功時、一覧が更新される
- [ ] 却下失敗時、エラーメッセージが表示される

### 5. 権限テスト
- [ ] JWT認証なしでアクセスすると401エラー
- [ ] 権限がない場合は403エラー

## セキュリティ考慮事項

1. **JWT認証**: 全APIエンドポイントはJWT認証必須
2. **CSRF対策**: バックエンドのAntiforgery設定に依存
3. **XSS対策**: React自動エスケープ
4. **権限チェック**: スタッフのみアクセス可能

## パフォーマンス考慮事項

1. **ページネーション**: 大量データ対応（デフォルト20件/ページ）
2. **遅延ローディング**: モーダル内のデータは必要時に取得
3. **キャッシュ**: 一覧データはブラウザキャッシュ利用

## 今後の拡張案

1. **一括インポート**: 複数申込を一度にインポート
2. **エクスポート**: CSV/Excel形式でエクスポート
3. **メール通知**: インポート/却下時に申請者へメール通知
4. **コメント機能**: 職員間でのコメント・メモ機能
5. **監査ログ**: 誰がいつインポート/却下したか詳細ログ
