# 設計資料更新サマリー - 複数クラス担当スタッフ対応

## 更新日時
2025-10-02

## 更新の背景
StaffClassAssignmentsテーブルの導入により、1人のスタッフが複数のクラスを担当できるようになりました。これに伴い、UI/UX、API、認証システムの各設計資料を更新しました。

## 更新した設計資料一覧

### 1. API設計仕様書 (`docs/api-design.md`)

#### 更新箇所

**2.1.2 SMS認証コード確認レスポンス**
- 保護者とスタッフで異なるレスポンス構造を明示
- スタッフレスポンスに`classAssignments`配列を追加
- `nurseryId`, `staffId`を追加

**16.1.2 スタッフSMS認証コード確認レスポンス**
- 単一クラス(`classId`, `className`)から配列形式(`classAssignments`)に変更
- `assignmentRole` (MainTeacher/AssistantTeacher) を含む

**16.2 スタッフクラスコンテキストAPI (新規追加)**
- `GET /staff/classes`: 担当クラス一覧取得
- `POST /staff/validate-class-access`: クラスアクセス権限検証

**16.3 連絡通知管理API**
- リクエストヘッダーに`X-Class-Context`を追加
- レスポンスに`classId`, `className`を追加

#### 影響範囲
- 認証エンドポイント: `/auth/verify-sms`
- スタッフ認証: `/staff/auth/verify-sms`
- 新規エンドポイント: `/staff/classes`, `/staff/validate-class-access`

---

### 2. 認証技術仕様書 (`docs/specifications/authentication-technical-spec.md`)

#### 更新箇所

**2.1 Staff テーブル**
- 複合主キー (NurseryId, StaffId) 構造を明記
- LastLoginAt が既存であることを明記
- インデックス追加: `IX_Staff_PhoneNumber_Active`, `IX_Staff_NurseryId_StaffId`

**2.1 StaffClassAssignments テーブル (新規追加)**
- テーブル定義全体を追加
- 複合主キー: (NurseryId, StaffId, ClassId)
- AssignmentRole 制約: MainTeacher / AssistantTeacher
- インデックス定義

**2.3 ユーザー統合ビュー (vw_UserLookup)**
- Staff部分のChildCountを「担当クラス数」に変更
- StaffIdをNVARCHARにキャスト

**3.1 check-userレスポンス**
- `staffInfo`に`nurseryId`, `staffId`, `classCount`を追加

**6.1 JWT拡張**
- スタッフJWTに`NurseryId`, `StaffId`クレームを追加
- `ClassAssignments`をJSON配列として含める

**6.3 スタッフクラスアクセス検証 (新規追加)**
- `IStaffClassAccessValidator`インターフェース
- `StaffClassAccessValidator`実装
- `ValidateAccessAsync`, `GetStaffClassAssignmentsAsync`メソッド

#### 影響範囲
- JwtService: クレーム生成ロジック
- AuthenticationService: クラス割り当て情報の取得
- 新規サービス: StaffClassAccessValidator

---

### 3. データベース設計書 (`docs/database-design.md`)

#### 確認結果
- **既に最新**: 複合主キー構造、StaffClassAssignmentsテーブルが既に反映済み
- 更新不要

#### 反映済み内容
- Staffテーブル: (NurseryId, StaffId) 複合主キー
- StaffClassAssignments: (NurseryId, StaffId, ClassId) 複合主キー
- AssignmentRole: MainTeacher / AssistantTeacher
- 日本語コメント完備

---

### 4. スタッフクラスコンテキスト フロントエンド技術仕様書 (`docs/specifications/staff-class-context-frontend-spec.md`)

#### 新規作成

**内容**
1. 型定義
   - `ClassAssignment`型
   - `AuthUser`の`staff.classAssignments`拡張
   - `ClassInfo`, `StaffClassContextType`

2. React Context実装
   - `StaffClassProvider`
   - `useStaffClass`フック
   - localStorageによる状態永続化

3. コンポーネント
   - `ClassSelector`: ドロップダウンでクラス切り替え
   - `StaffHeader`: ヘッダーにクラス選択UIを統合

4. APIリクエストヘッダー
   - `X-Class-Context`: 現在のクラスID
   - `X-Nursery-Id`: 保育園ID
   - Axios Interceptorによる自動付与

5. エラーハンドリング
   - 403 Forbiddenエラー時のリダイレクト
   - クラスアクセス権限エラー処理

6. テスト、パフォーマンス、アクセシビリティ考慮事項

#### 影響範囲
- `reactapp.client/src/types/auth.ts`: 型拡張
- 新規ファイル: `src/types/staffClass.ts`
- 新規ファイル: `src/contexts/StaffClassContext.tsx`
- 新規ファイル: `src/components/staff/ClassSelector.tsx`
- 新規ファイル: `src/components/staff/StaffHeader.tsx`

---

### 5. 要件定義書 (`docs/requirements/multi-class-staff-requirements.md`)

#### 既存
この文書を基に各設計資料を更新しました。

**主要要件**
- FR-MC-001: クラス選択機能
- FR-MC-002: 現在のクラスコンテキスト表示
- FR-MC-003: クラス切り替え機能
- INT-MC-001〜004: 認証システム統合要件

---

## 設計資料間の整合性検証

### ✅ 認証フロー
1. SMS認証成功 → `classAssignments`配列を返す (API設計、認証技術仕様)
2. フロントエンド → `AuthUser.staff.classAssignments`に格納 (フロントエンド技術仕様)
3. `StaffClassProvider` → `classAssignments`から`availableClasses`を初期化
4. JWT → `ClassAssignments`クレームとして含める (認証技術仕様)

### ✅ クラスコンテキスト管理
1. 単一クラス → 自動選択
2. 複数クラス → ClassSelectorで選択
3. localStorageに保存 → 次回ログイン時に復元
4. `X-Class-Context`ヘッダー → 全APIリクエストに付与

### ✅ データベース構造
1. Staff: (NurseryId, StaffId) 複合主キー
2. StaffClassAssignments: (NurseryId, StaffId, ClassId) 複合主キー
3. AssignmentRole: MainTeacher / AssistantTeacher
4. 外部キー制約: Staff → StaffClassAssignments → Classes

### ✅ API設計
1. 認証エンドポイント → `classAssignments`を返す
2. `/staff/classes` → 担当クラス一覧取得
3. `/staff/validate-class-access` → アクセス権限検証
4. 全スタッフAPIで`X-Class-Context`ヘッダーを受け取る

---

## 実装優先順位

### フェーズ1: バックエンド基盤
1. ✅ StaffClassAssignmentsテーブル作成 (完了)
2. ⏳ AuthenticationDTOs.cs拡張 (ClassAssignmentDto追加)
3. ⏳ AuthenticationService.cs修正 (GetStaffClassAssignmentsAsync追加)
4. ⏳ JwtService.cs修正 (ClassAssignmentsクレーム追加)
5. ⏳ StaffClassAccessValidator実装

### フェーズ2: API実装
1. ⏳ GET /staff/classes エンドポイント
2. ⏳ POST /staff/validate-class-access エンドポイント
3. ⏳ 既存スタッフAPIのX-Class-Contextヘッダー対応

### フェーズ3: フロントエンド実装
1. ⏳ `src/types/auth.ts`拡張
2. ⏳ `src/types/staffClass.ts`作成
3. ⏳ `StaffClassContext.tsx`作成
4. ⏳ `ClassSelector.tsx`作成
5. ⏳ `StaffHeader.tsx`作成
6. ⏳ 各画面コンポーネントでuseStaffClass使用

### フェーズ4: テストと検証
1. ⏳ 単体テスト (Context, Components)
2. ⏳ 統合テスト (API + フロントエンド)
3. ⏳ E2Eテスト (ユーザーシナリオ)

---

## 今後の課題

### 機能拡張
- [ ] クラスごとの通知カウント表示
- [ ] クラスごとの未処理タスク表示
- [ ] 全クラス横断表示モード

### パフォーマンス
- [ ] クラス切り替え時のデータ事前取得
- [ ] React Queryによるキャッシュ最適化

### UX改善
- [ ] クラス切り替え時のトースト通知
- [ ] 入力中のデータ保護 (切り替え前の確認ダイアログ)
- [ ] ダークモード対応

---

## 関連ドキュメント

- [複数クラス担当スタッフ要件定義書](requirements/multi-class-staff-requirements.md)
- [API設計仕様書](api-design.md)
- [認証技術仕様書](specifications/authentication-technical-spec.md)
- [データベース設計書](database-design.md)
- [スタッフクラスコンテキスト フロントエンド技術仕様書](specifications/staff-class-context-frontend-spec.md)
