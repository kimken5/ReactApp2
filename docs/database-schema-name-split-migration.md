# データベーススキーマ変更影響分析: 名前フィールド分割とAllergy追加

**作成日**: 2025-12-31
**変更内容**: ApplicationWorksテーブルとChildrenテーブルにおける名前フィールドの分割とAllergyフィールド追加

---

## 1. 変更概要

### 1.1 ApplicationWorksテーブル変更

#### 変更前 → 変更後
| 変更前 | 変更後 | データ型 | 備考 |
|--------|--------|---------|------|
| ChildName | ChildFamilyName | nvarchar(20) | 苗字 |
| - | ChildFirstName | nvarchar(20) | 名前 |
| ChildNameKana | ChildFamilyNameKana | nvarchar(20) | ふりがな（苗字） |
| - | ChildFirstNameKana | nvarchar(20) | ふりがな（名前） |
| - | ChildAllergy | nvarchar(200) | **新規追加** アレルギー情報 |
| ChildMedicalNotes | ChildMedicalNotes | nvarchar(500) | **型変更**: nvarchar(1000) → nvarchar(500) |
| ChildSpecialInstructions | ChildSpecialInstructions | nvarchar(500) | **型変更**: nvarchar(1000) → nvarchar(500) |

### 1.2 Childrenテーブル変更

#### 変更前 → 変更後
| 変更前 | 変更後 | データ型 | 備考 |
|--------|--------|---------|------|
| Name | FamilyName | nvarchar(20) | 苗字 |
| - | FirstName | nvarchar(20) | 名前 |
| Furigana | FamilyFurigana | nvarchar(20) | ふりがな（苗字） |
| - | FirstFurigana | nvarchar(20) | ふりがな（名前） |
| - | Allergy | nvarchar(200) | **新規追加** アレルギー情報 |
| MedicalNotes | MedicalNotes | nvarchar(500) | **型変更**: nvarchar(1000) → nvarchar(500) |
| SpecialInstructions | SpecialInstructions | nvarchar(500) | **型変更**: nvarchar(1000) → nvarchar(500) |

### 1.3 表示ルール

**画面表示時の名前結合ルール**:
```
表示名 = FamilyName + " " + FirstName
例: "山田 太郎"
```

---

## 2. 影響範囲分析

### 2.1 バックエンド影響範囲（合計21ファイル）

#### A. モデルクラス（2ファイル）
1. **ReactApp.Server/Models/ApplicationWork.cs**
   - ChildName → ChildFamilyName, ChildFirstName
   - ChildNameKana → ChildFamilyNameKana, ChildFirstNameKana
   - ChildAllergy 追加
   - ChildMedicalNotes, ChildSpecialInstructions型変更

2. **ReactApp.Server/Models/Child.cs**
   - Name → FamilyName, FirstName
   - Furigana → FamilyFurigana, FirstFurigana
   - Allergy 追加
   - MedicalNotes, SpecialInstructions型変更
   - **計算プロパティ追加推奨**: `public string FullName => $"{FamilyName} {FirstName}";`

#### B. DTOクラス（4ファイル）
3. **ReactApp.Server/DTOs/Desktop/ApplicationWorkDto.cs**
   - ChildName → ChildFamilyName, ChildFirstName
   - ChildNameKana → ChildFamilyNameKana, ChildFirstNameKana
   - ChildAllergy 追加
   - 型変更対応

4. **ReactApp.Server/DTOs/Desktop/ChildDto.cs**
   - Name → FamilyName, FirstName
   - Furigana → FamilyFurigana, FirstFurigana
   - Allergy 追加
   - **計算プロパティ追加推奨**: `public string FullName => $"{FamilyName} {FirstName}";`

5. **ReactApp.Server/DTOs/ChildDto.cs** (モバイルアプリ用)
   - 同様の変更

6. **ReactApp.Server/DTOs/PhotoDto.cs**
   - TaggedChildren内のChildName → ChildFullName（計算プロパティ使用）

#### C. DbContext（1ファイル）
7. **ReactApp.Server/Data/KindergartenDbContext.cs**
   - OnModelCreating内のプロパティマッピング更新
   - HasColumnName設定の変更

#### D. サービス層（11ファイル）
8. **ReactApp.Server/Services/ApplicationService.cs**
   - 入園申込取込ロジック修正
   - ApplicationWork → Child, Parent マッピング修正
   - フィールド名変更対応

9. **ReactApp.Server/Services/DesktopMasterService.cs**
   - 園児一覧取得時のフィールドマッピング
   - 検索ロジック修正（名前検索 → 苗字・名前両方で検索）

10. **ReactApp.Server/Services/ChildClassAssignmentService.cs**
    - 年度スライド処理でのChildName参照箇所修正

11. **ReactApp.Server/Services/PhotoService.cs**
    - 写真タグ付け時のChildName表示修正

12. **ReactApp.Server/Services/DesktopPhotoService.cs**
    - 写真管理画面での園児名表示修正

13. **ReactApp.Server/Services/DesktopDailyReportService.cs**
    - 日報一覧での園児名表示修正

14. **ReactApp.Server/Services/DesktopDashboardService.cs**
    - ダッシュボード表示での園児名表示修正

15. **ReactApp.Server/Services/DesktopContactNotificationService.cs**
    - 連絡通知での園児名表示修正

16. **ReactApp.Server/Services/DesktopAttendanceService.cs**
    - 出欠表での園児名表示修正

17. **ReactApp.Server/Services/DesktopAnnouncementService.cs**
    - お知らせ配信時の対象園児名表示修正

18. **ReactApp.Server/Services/FamilyService.cs**
    - 家族管理での園児名表示修正

#### E. マッピング設定（1ファイル）
19. **ReactApp.Server/Mapping/MappingProfile.cs**
   - AutoMapperマッピング設定更新
   - CreateMap設定で名前フィールド分割マッピング

#### F. コントローラー（2ファイル）
20. **ReactApp.Server/Controllers/DesktopMasterController.cs**
   - CreateChild, UpdateChildアクションでのDTOバインディング確認

21. **ReactApp.Server/Controllers/DesktopApplicationController.cs**
   - 申込取込アクションでのDTOバインディング確認

---

### 2.2 フロントエンド影響範囲（合計34ファイル）

#### A. 型定義（5ファイル）
1. **reactapp.client/src/types/publicApplication.ts**
   - ChildInfo インターフェース修正
   - childName → childFamilyName, childFirstName
   - childNameKana → childFamilyNameKana, childFirstNameKana
   - childAllergy 追加

2. **reactapp.client/src/types/desktopApplication.ts**
   - ApplicationWorkDto インターフェース修正（同上）

3. **reactapp.client/src/desktop/types/master.ts**
   - ChildDto インターフェース修正
   - name → familyName, firstName
   - furigana → familyFurigana, firstFurigana
   - allergy 追加
   - **計算プロパティ追加推奨**: `fullName?: string;` (バックエンドから受け取る)

4. **reactapp.client/src/desktop/types/photo.ts**
   - TaggedChild インターフェース内のchildName → childFullName

5. **reactapp.client/src/desktop/types/attendance.ts, dailyReport.ts, contactNotification.ts, announcement.ts**
   - 園児情報が含まれる型定義の修正

#### B. 保護者向けWeb申込フォーム（2ファイル）
6. **reactapp.client/src/pages/ApplicationFormPage.tsx**
   - フォームフィールド変更:
     - childName → childFamilyName, childFirstName（2つの入力欄）
     - childNameKana → childFamilyNameKana, childFirstNameKana（2つの入力欄）
     - childAllergy 入力欄追加
   - Zodバリデーションスキーマ更新
   - フォーム送信時のデータ構造変更

7. **reactapp.client/src/services/publicApplicationService.ts**
   - API送信データ型の更新

#### C. デスクトップアプリ - 申込管理（2ファイル）
8. **reactapp.client/src/desktop/pages/ApplicationsPage.tsx**
   - 申込一覧表示での園児名表示: `{app.childFamilyName} {app.childFirstName}`

9. **reactapp.client/src/desktop/components/application/ApplicationDetailModal.tsx**
   - 詳細表示での園児名、ふりがな、アレルギー表示
   - フィールド表示順序調整

10. **reactapp.client/src/desktop/components/application/ImportApplicationModal.tsx**
    - インポート確認画面での園児名表示

#### D. デスクトップアプリ - 園児管理（5ファイル）
11. **reactapp.client/src/desktop/pages/ChildrenPage.tsx**
    - 園児一覧テーブルの列変更:
      - 名前列: `{child.familyName} {child.firstName}`
      - ふりがな列: `{child.familyFurigana} {child.firstFurigana}`
      - アレルギー列追加（条件付き表示）
    - フィルタリング・検索ロジック修正（苗字・名前両方で検索）

12. **reactapp.client/src/desktop/pages/ChildFormPage.tsx**
    - 園児作成・編集フォーム修正:
      - name → familyName, firstName（2つの入力欄）
      - furigana → familyFurigana, firstFurigana（2つの入力欄）
      - allergy 入力欄追加
    - フォーム送信時のデータ構造変更

13. **reactapp.client/src/desktop/components/children/ChildEditModal.tsx**
    - 編集モーダルのフィールド変更（同上）

14. **reactapp.client/src/desktop/services/masterService.ts**
    - API送信データ型の更新

15. **reactapp.client/src/desktop/pages/ParentFormPage.tsx, ParentEditModal.tsx**
    - 園児選択UI内の園児名表示修正

#### E. デスクトップアプリ - 写真管理（3ファイル）
16. **reactapp.client/src/desktop/pages/PhotosPage.tsx**
    - 園児タグ選択時の名前表示: `{child.familyName} {child.firstName}`

17. **reactapp.client/src/desktop/pages/PhotoUploadPage.tsx**
    - 写真アップロード時の園児選択UI修正

18. **reactapp.client/src/desktop/components/common/PhotoDetailModal.tsx**
    - 写真詳細表示での園児名表示

19. **reactapp.client/src/desktop/components/photo/NoPhotoWarningDialog.tsx**
    - 撮影禁止警告での園児名表示

#### F. デスクトップアプリ - 日報管理（4ファイル）
20. **reactapp.client/src/desktop/pages/DailyReportsPage.tsx**
    - 日報一覧での園児名表示

21. **reactapp.client/src/desktop/pages/DailyReportFormPage.tsx**
    - 日報作成・編集画面での園児選択UI修正

22. **reactapp.client/src/desktop/components/DailyReportEditModal.tsx**
    - 編集モーダルでの園児名表示

23. **reactapp.client/src/desktop/components/DailyReportDetailModal.tsx**
    - 詳細表示での園児名表示

#### G. デスクトップアプリ - その他（13ファイル）
24. **reactapp.client/src/desktop/pages/DashboardPage.tsx**
    - ダッシュボードでの園児名表示

25. **reactapp.client/src/desktop/pages/AttendancePage.tsx**
    - 出欠表での園児名表示・検索機能修正

26. **reactapp.client/src/desktop/pages/AttendanceReportPage.tsx**
    - 出席状況レポートでの園児名表示

27. **reactapp.client/src/desktop/pages/ContactNotificationsPage.tsx**
    - 連絡通知一覧での園児名表示

28. **reactapp.client/src/desktop/pages/ContactNotificationDetailPage.tsx**
    - 連絡通知詳細での園児名表示

29. **reactapp.client/src/desktop/pages/AnnouncementsPage.tsx**
    - お知らせ管理での対象園児名表示

30. **reactapp.client/src/desktop/pages/AnnouncementFormPage.tsx**
    - お知らせ作成時の対象園児選択UI修正

31. **reactapp.client/src/desktop/components/announcements/ReadStatusModal.tsx**
    - 既読状況表示での園児名表示

32. **reactapp.client/src/desktop/pages/ClassCompositionPage.tsx**
    - クラス編成画面での園児名表示

33. **reactapp.client/src/components/staff/ChildClassAssignment.tsx**
    - 園児クラス割り当て画面での園児名表示

34. **reactapp.client/src/utils/applicationValidation.ts**
    - バリデーションロジックの更新

---

## 3. 仕様書更新箇所

### 3.1 データベース設計書
1. **docs/desktop/database-design.md**
   - ApplicationWork テーブル定義更新
   - Children テーブル定義更新
   - サンプルデータJSON更新

2. **docs/mobile/database-design.md**
   - Children テーブル定義更新

### 3.2 要件定義書
3. **docs/desktop/requirements.md**
   - 入園申込管理機能セクション更新
   - 園児管理機能セクション更新
   - データ要件JSON更新

4. **docs/mobile/requirements.md**
   - 園児情報表示セクション更新

### 3.3 実装計画書
5. **claudedocs/enrollment-application-implementation-plan.md**
   - フィールドマッピング図更新

6. **claudedocs/nophoto-implementation-plan.md**
   - ApplicationWork/Childフィールド参照箇所更新

---

## 4. マイグレーション実装計画

### Phase 1: バックエンド基盤修正（優先度: 最高）
- [ ] モデルクラス修正（ApplicationWork.cs, Child.cs）
- [ ] DTO修正（ApplicationWorkDto.cs, ChildDto.cs）
- [ ] DbContext修正（KindergartenDbContext.cs）
- [ ] ビルド確認

### Phase 2: バックエンドサービス層修正（優先度: 高）
- [ ] ApplicationService.cs（申込取込ロジック）
- [ ] DesktopMasterService.cs（園児CRUD）
- [ ] AutoMapper設定（MappingProfile.cs）
- [ ] その他サービス層（9ファイル）

### Phase 3: フロントエンド型定義修正（優先度: 高）
- [ ] publicApplication.ts, desktopApplication.ts
- [ ] master.ts, photo.ts
- [ ] その他型定義ファイル（4ファイル）

### Phase 4: フロントエンドUI修正 - 申込フォーム（優先度: 高）
- [ ] ApplicationFormPage.tsx（入力欄追加）
- [ ] ApplicationsPage.tsx（一覧表示）
- [ ] ApplicationDetailModal.tsx（詳細表示）
- [ ] ImportApplicationModal.tsx（インポート確認）

### Phase 5: フロントエンドUI修正 - 園児管理（優先度: 高）
- [ ] ChildrenPage.tsx（一覧表示）
- [ ] ChildFormPage.tsx（作成・編集フォーム）
- [ ] ChildEditModal.tsx（編集モーダル）
- [ ] masterService.ts（API連携）

### Phase 6: フロントエンドUI修正 - その他画面（優先度: 中）
- [ ] 写真管理（3ファイル）
- [ ] 日報管理（4ファイル）
- [ ] 出欠管理（2ファイル）
- [ ] 連絡通知管理（2ファイル）
- [ ] お知らせ管理（3ファイル）
- [ ] クラス編成（2ファイル）
- [ ] ダッシュボード（1ファイル）

### Phase 7: テスト・検証（優先度: 高）
- [ ] バックエンド単体テスト
- [ ] API統合テスト
- [ ] フロントエンド画面動作確認
- [ ] 申込フォーム → 取込 → 園児マスタ E2Eテスト

### Phase 8: ドキュメント更新（優先度: 中）
- [ ] データベース設計書更新
- [ ] 要件定義書更新
- [ ] 実装計画書更新

---

## 5. 破壊的変更への対応

### 5.1 既存データ移行は不要
- **理由**: ユーザー側でテーブルレイアウトを既に変更済み
- **前提**: 既存データが新スキーマに合致していることを確認

### 5.2 API互換性
- **破壊的変更**: DTOフィールド名変更により既存APIクライアントが動作しなくなる
- **対策**: フロントエンド・バックエンドを同時にデプロイする必要がある

### 5.3 検索機能への影響
- **変更前**: Name単一フィールドでの全文検索
- **変更後**: FamilyName + FirstName両方で検索
- **実装**: `WHERE FamilyName LIKE @keyword OR FirstName LIKE @keyword`

---

## 6. 検証項目チェックリスト

### 6.1 バックエンド検証
- [ ] ApplicationWork作成API: 新フィールドでの登録成功
- [ ] ApplicationWork取込API: Child/Parentへの正しいマッピング
- [ ] Child作成API: 新フィールドでの登録成功
- [ ] Child更新API: 新フィールドでの更新成功
- [ ] Child一覧API: FullName計算プロパティ正常動作
- [ ] 検索API: 苗字・名前両方での検索成功

### 6.2 フロントエンド検証
- [ ] 申込フォーム: 苗字・名前・ふりがな分割入力正常動作
- [ ] 申込フォーム: Allergyフィールド入力・送信成功
- [ ] 申込一覧: 園児名正常表示（苗字 名前）
- [ ] 申込詳細: 全フィールド正常表示
- [ ] 園児一覧: 園児名正常表示（苗字 名前）
- [ ] 園児作成・編集: 分割フィールド正常動作
- [ ] 写真管理: 園児タグ付け時の名前表示正常
- [ ] 日報管理: 園児名表示正常
- [ ] 出欠表: 園児名表示・検索正常
- [ ] 全画面でのAllergy表示確認

### 6.3 E2E検証
- [ ] 申込フォーム入力 → 送信 → ApplicationWork登録確認
- [ ] ApplicationWork取込 → Child/Parent登録確認
- [ ] 園児作成 → 一覧表示 → 詳細表示 → 編集 → 更新確認
- [ ] 園児削除 → 論理削除確認

---

## 7. ロールバック計画

万が一問題が発生した場合のロールバック手順:

1. **バックエンドコード復元**: 前回コミットにロールバック
2. **フロントエンドコード復元**: 前回コミットにロールバック
3. **データベーススキーマ復元**: ユーザー側で手動復元が必要

**注意**: データベーススキーマは既にユーザー側で変更済みのため、コードのみロールバック可能。

---

## 8. 推奨実装順序

1. **Phase 1 → 即時ビルド確認** (バックエンド基盤が正しいことを確認)
2. **Phase 2 → 単体テスト実行** (サービス層の動作確認)
3. **Phase 3 → フロントエンドビルド確認** (型エラー解消)
4. **Phase 4 → 申込フォーム動作確認** (最優先機能)
5. **Phase 5 → 園児管理動作確認** (コア機能)
6. **Phase 6 → その他画面順次対応**
7. **Phase 7 → 総合テスト**
8. **Phase 8 → ドキュメント整備**

---

## 9. 想定工数

| フェーズ | 工数見積 | 備考 |
|---------|---------|------|
| Phase 1 | 2時間 | モデル・DTO・DbContext修正 |
| Phase 2 | 4時間 | サービス層11ファイル修正 |
| Phase 3 | 1時間 | 型定義5ファイル修正 |
| Phase 4 | 3時間 | 申込フォーム4ファイル修正 |
| Phase 5 | 3時間 | 園児管理5ファイル修正 |
| Phase 6 | 5時間 | その他17ファイル修正 |
| Phase 7 | 3時間 | テスト・検証 |
| Phase 8 | 2時間 | ドキュメント更新 |
| **合計** | **23時間** | 約3営業日 |

---

## 10. リスク管理

| リスク | 影響度 | 対策 |
|--------|-------|------|
| フィールド名変更漏れ | 高 | 自動検索ツール使用、レビュー徹底 |
| 表示名結合ロジック漏れ | 中 | 計算プロパティ統一使用 |
| 検索機能の不具合 | 中 | 検索ロジックの入念なテスト |
| 既存データ不整合 | 低 | ユーザー側で既に対応済み |
| API互換性問題 | 高 | 同時デプロイ必須、ダウンタイム最小化 |

---

## 11. 次のアクション

1. **即座開始**: Phase 1（バックエンド基盤修正）
2. **優先対応**: Phase 4（申込フォーム）、Phase 5（園児管理）
3. **並行作業可能**: Phase 2（サービス層）とPhase 3（型定義）は独立して作業可能

---

**文書管理**:
- 作成者: Claude
- 最終更新: 2025-12-31
- バージョン: 1.0
