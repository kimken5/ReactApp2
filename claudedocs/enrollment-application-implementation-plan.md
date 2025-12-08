# 入園申込機能 実装計画書

**作成日**: 2025-12-08
**対象機能**: 入園申込Webフォーム + デスクトップアプリ取込画面

---

## 1. 概要

### 1.1 機能概要
保護者がスマートフォンでQRコードをスキャンし、Web申込フォームから入園申込を行う機能。デスクトップアプリ側で申込内容を確認し、承認・却下・取込を行う。

### 1.2 アーキテクチャ
```
保護者スマホ (Web申込フォーム)
    ↓ POST /api/application/submit?key={ApplicationKey}
ApplicationWorkテーブル (一時保存)
    ↓ デスクトップアプリで確認
    ↓ POST /api/desktop/application/import/{id}
園児マスタ + 保護者マスタ (本登録)
```

### 1.3 データフロー
1. 保護者: QRコードスキャン → Web申込フォームアクセス (`?key={ApplicationKey}`)
2. 保護者: 申込情報入力 → 送信
3. システム: ApplicationWorkテーブルに保存 (status: Pending)
4. スタッフ: デスクトップアプリで申込一覧確認
5. スタッフ: 申込詳細確認 → 取込 or 却下
6. システム: 取込時
   - 携帯電話番号で保護者マスタ検索
   - 一致あり → 保護者マスタ更新 + 園児マスタ新規作成
   - 一致なし → 保護者マスタ新規作成 + 園児マスタ新規作成
   - ParentChildRelationship作成
   - ApplicationWork更新 (status: Imported, isImported: true)

---

## 2. 実装フェーズ

### Phase 1: データベース・モデル層 ✅
**ステータス**: 完了 (2025-12-08)

- [x] ApplicationWorkテーブル作成 (CREATE SCRIPT完成、ユーザー側で実行済み)
- [ ] ApplicationWorkモデルクラス作成 (`ReactApp.Server/Models/ApplicationWork.cs`)
- [ ] DbContextへのDbSet追加 (`KindergartenDbContext.cs`)
- [ ] モデルビルダー設定追加 (OnModelCreating)

**成果物**:
- `database/create_application_work_table.sql` (外部キー制約なし版)
- `ReactApp.Server/Models/ApplicationWork.cs`

---

### Phase 2: バックエンドAPI実装
**想定工数**: 2-3日

#### 2.1 DTO作成
**ファイル**: `ReactApp.Server/DTOs/Application/`

- [ ] `ApplicationWorkDto.cs` - 申込情報全体
- [ ] `ApplicationListItemDto.cs` - 一覧表示用
- [ ] `CreateApplicationRequest.cs` - 保護者Web申込リクエスト
- [ ] `ImportApplicationRequest.cs` - デスクトップ取込リクエスト
- [ ] `RejectApplicationRequest.cs` - 却下リクエスト

#### 2.2 サービス層実装
**ファイル**: `ReactApp.Server/Services/`

- [ ] `IApplicationService.cs` - インターフェース
- [ ] `ApplicationService.cs` - サービス実装

**主要メソッド**:
```csharp
Task<ApplicationWorkDto> CreateApplicationAsync(CreateApplicationRequest request, string applicationKey);
Task<PagedResult<ApplicationListItemDto>> GetApplicationListAsync(int nurseryId, ApplicationFilter filter);
Task<ApplicationWorkDto> GetApplicationDetailAsync(int id);
Task<ImportResult> ImportApplicationAsync(int id, int userId);
Task RejectApplicationAsync(int id, RejectApplicationRequest request, int userId);
Task<bool> ValidateApplicationKeyAsync(string applicationKey);
```

**ビジネスロジック**:
- ApplicationKey検証 (Nurseriesテーブルと照合)
- 携帯電話番号正規化 (ハイフン除去)
- 保護者マスタ重複チェック (携帯電話番号)
- 園児ID・保護者ID採番ロジック (MAX + 1)
- ParentChildRelationship自動作成
- トランザクション管理

#### 2.3 コントローラー実装
**ファイル**: `ReactApp.Server/Controllers/`

**保護者向けAPI** (`ApplicationController.cs`):
- [ ] `POST /api/application/validate-key?key={key}` - ApplicationKey検証
- [ ] `POST /api/application/submit?key={key}` - 申込送信

**デスクトップAPI** (`DesktopApplicationController.cs`):
- [ ] `GET /api/desktop/application` - 申込一覧取得
- [ ] `GET /api/desktop/application/{id}` - 申込詳細取得
- [ ] `POST /api/desktop/application/{id}/import` - 取込実行
- [ ] `POST /api/desktop/application/{id}/reject` - 却下実行

#### 2.4 バリデーション
**ファイル**: `ReactApp.Server/Validators/`

- [ ] `CreateApplicationRequestValidator.cs` - FluentValidation
  - 必須項目チェック (保護者氏名、携帯電話、園児氏名等)
  - フォーマット検証 (電話番号、郵便番号、メールアドレス)
  - 日付妥当性チェック (生年月日)

---

### Phase 3: 保護者向けWeb申込フォーム実装
**想定工数**: 2-3日

#### 3.1 ルーティング設定
**ファイル**: `reactapp.client/src/main.tsx`

```tsx
{
  path: '/application',
  element: <ApplicationForm />
}
```

#### 3.2 コンポーネント構成
**ディレクトリ**: `reactapp.client/src/pages/Application/`

**主要コンポーネント**:
- [ ] `ApplicationForm.tsx` - メインフォームコンポーネント
- [ ] `ApplicantInfoSection.tsx` - 保護者情報入力セクション
- [ ] `ChildInfoSection.tsx` - 園児情報入力セクション
- [ ] `ApplicationConfirmDialog.tsx` - 送信確認ダイアログ
- [ ] `ApplicationSuccessPage.tsx` - 送信完了ページ

**フォーム項目**:
```typescript
interface ApplicationFormData {
  // 保護者情報
  applicantName: string;
  applicantNameKana: string;
  dateOfBirth: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  mobilePhone: string;
  homePhone?: string;
  emergencyContact?: string;
  email?: string;
  relationshipToChild: string;

  // 園児情報
  childName: string;
  childNameKana: string;
  childDateOfBirth: string;
  childGender: string;
  childBloodType?: string;
  childMedicalNotes?: string;
  childSpecialInstructions?: string;
}
```

#### 3.3 バリデーション
- [ ] クライアント側バリデーション (react-hook-form + yup/zod)
- [ ] リアルタイムエラー表示
- [ ] 必須項目マーク表示

#### 3.4 UI/UX設計
- [ ] レスポンシブデザイン (スマホ最適化)
- [ ] 入力補助機能 (郵便番号→住所自動入力)
- [ ] プログレスインジケーター (送信中表示)
- [ ] エラーハンドリング (ApplicationKey無効、サーバーエラー)

---

### Phase 4: デスクトップアプリ取込画面実装
**想定工数**: 3-4日

#### 4.1 ルーティング設定
**ファイル**: `reactapp.client/src/DesktopApp.tsx`

```tsx
{
  path: '/desktop/applications',
  element: <ApplicationManagement />
},
{
  path: '/desktop/applications/:id',
  element: <ApplicationDetail />
}
```

#### 4.2 コンポーネント構成
**ディレクトリ**: `reactapp.client/src/pages/Desktop/ApplicationManagement/`

**主要コンポーネント**:
- [ ] `ApplicationManagement.tsx` - 申込一覧画面
- [ ] `ApplicationList.tsx` - 申込一覧テーブル
- [ ] `ApplicationFilter.tsx` - フィルター (status, 申込日範囲)
- [ ] `ApplicationDetail.tsx` - 申込詳細画面
- [ ] `ImportConfirmDialog.tsx` - 取込確認ダイアログ
- [ ] `RejectDialog.tsx` - 却下理由入力ダイアログ
- [ ] `DuplicateParentWarning.tsx` - 重複保護者警告表示

**状態管理**:
```typescript
interface ApplicationState {
  applications: ApplicationListItem[];
  selectedApplication: ApplicationWorkDto | null;
  filter: ApplicationFilter;
  loading: boolean;
  error: string | null;
}

interface ApplicationFilter {
  status?: 'Pending' | 'Imported' | 'Rejected';
  startDate?: string;
  endDate?: string;
}
```

#### 4.3 機能実装
- [ ] 申込一覧表示 (ページネーション対応)
- [ ] ステータスフィルター (Pending/Imported/Rejected)
- [ ] 申込日範囲フィルター
- [ ] 詳細表示モーダル/別ページ
- [ ] 取込ボタン → 確認ダイアログ → API呼び出し
- [ ] 却下ボタン → 理由入力ダイアログ → API呼び出し
- [ ] 重複保護者検出 (携帯電話番号一致時に警告表示)
- [ ] 取込後の成功メッセージ表示

#### 4.4 業務管理メニュー統合
**ファイル**: `reactapp.client/src/pages/Desktop/Dashboard.tsx`

- [ ] サイドメニューに「入園申込管理」追加
- [ ] 未処理件数バッジ表示 (Pending件数)

---

### Phase 5: QRコード生成機能 (オプション)
**想定工数**: 0.5-1日

#### 5.1 保育園マスタ画面拡張
**ファイル**: `reactapp.client/src/pages/Desktop/NurseryMaster/`

- [ ] ApplicationKey表示エリア追加
- [ ] ApplicationKey生成ボタン (UUID v4生成)
- [ ] QRコード生成ボタン (qrcode.react使用)
- [ ] QRコード画像ダウンロード機能

#### 5.2 必要なライブラリ
```bash
npm install qrcode.react
```

---

## 3. 仕様書更新タスク

### 3.1 要件定義書 ✅
**ファイル**: `docs/desktop/requirements.md`
**ステータス**: 完了 (2025-12-08)

- [x] セクション2.5追加 (入園申込管理機能)
- [x] セクション8.1更新 (実装予定マーク)
- [x] 画面遷移図更新

### 3.2 API設計書 ⏳
**ファイル**: `docs/desktop/api-design.md`
**ステータス**: 未着手

**追加内容**:
- [ ] セクション「入園申込管理API」追加
  - POST /api/application/validate-key
  - POST /api/application/submit
  - GET /api/desktop/application
  - GET /api/desktop/application/{id}
  - POST /api/desktop/application/{id}/import
  - POST /api/desktop/application/{id}/reject

### 3.3 データベース設計書 ⏳
**ファイル**: `docs/desktop/database-design.md`
**ステータス**: 未着手

**追加内容**:
- [ ] ApplicationWorkテーブル仕様追記
- [ ] ER図更新 (ApplicationWork追加)
- [ ] インデックス一覧更新

---

## 4. 技術的考慮事項

### 4.1 セキュリティ
- ApplicationKeyはUUID v4形式 (予測困難)
- ApplicationKey検証必須 (不正アクセス防止)
- Rate Limiting適用 (申込送信: 10件/時間/IP)
- CORS設定 (保護者Webフォーム用)

### 4.2 パフォーマンス
- ApplicationWork一覧はページネーション必須 (1ページ20件)
- インデックス活用 (NurseryId, ApplicationStatus, MobilePhone)
- キャッシング不要 (リアルタイム性重視)

### 4.3 データ整合性
- トランザクション管理 (取込処理: Parent + Child + Relationship + ApplicationWork更新)
- ロールバック対応 (エラー時)
- 重複チェック (携帯電話番号正規化後の比較)

### 4.4 UI/UX
- 保護者Webフォーム: モバイルファーストデザイン
- デスクトップ画面: テーブルビュー + フィルター
- エラーメッセージ: ユーザーフレンドリー (日本語)
- ローディング表示: 送信中・取込中

---

## 5. テスト計画

### 5.1 単体テスト
- ApplicationService単体テスト (xUnit)
  - ApplicationKey検証ロジック
  - 携帯電話番号正規化
  - 保護者重複チェック
  - 園児・保護者ID採番

### 5.2 統合テスト
- API統合テスト
  - 申込送信フロー
  - 取込フロー (重複あり/なし)
  - 却下フロー

### 5.3 E2Eテスト (Playwright)
- 保護者Webフォーム送信
- デスクトップアプリ取込操作
- エラーハンドリング

---

## 6. リリース計画

### 6.1 段階的リリース
1. **Phase 1-2**: バックエンドAPI完成 → Postmanでテスト
2. **Phase 3**: 保護者Webフォーム完成 → ステージング環境公開
3. **Phase 4**: デスクトップアプリ取込画面完成 → 統合テスト
4. **Phase 5**: QRコード生成機能追加 (オプション)
5. **本番リリース**: 全機能統合テスト完了後

### 6.2 本番環境設定
- ApplicationKey設定 (各保育園ごと)
- QRコード印刷物配布準備
- スタッフ向け操作マニュアル作成

---

## 7. リスクと対策

### 7.1 技術リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| 携帯電話番号重複ロジック不備 | 高 | 正規化処理を徹底、テストケース充実 |
| トランザクション失敗 | 中 | ロールバック処理実装、エラーログ記録 |
| ApplicationKey漏洩 | 高 | UUID v4使用、定期的な再生成推奨 |

### 7.2 運用リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| スタッフの操作ミス (誤って却下) | 中 | 確認ダイアログ表示、操作ログ記録 |
| 申込データ不備 | 低 | バリデーション強化、必須項目明示 |
| 重複保護者の誤判定 | 中 | 取込前に警告表示、手動確認可能に |

---

## 8. 次のアクションアイテム

### 優先度: 高
1. **API設計書更新** - 入園申込API仕様を詳細記載
2. **データベース設計書更新** - ApplicationWorkテーブル仕様を追記
3. **ApplicationWorkモデル作成** - C#モデルクラス実装

### 優先度: 中
4. DTO・サービス層実装
5. コントローラー実装
6. 保護者Webフォーム実装

### 優先度: 低
7. QRコード生成機能実装 (オプション)
8. E2Eテスト作成

---

## 9. 参照ドキュメント

- [要件定義書](../docs/desktop/requirements.md) - セクション2.5参照
- [ApplicationWork CREATE SCRIPT](../database/create_application_work_table.sql)
- [Nurseriesテーブル仕様](../docs/desktop/database-design.md) - ApplicationKey項目
