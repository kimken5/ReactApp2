# 2025-12-12 保護者テーブルスキーマ変更作業ログ

## 作業概要

ユーザー提供の新しい保護者テーブルスキーマに合わせて、システム全体を修正しました。

### 主な変更点

1. **削除されたフィールド**:
   - `Address` (住所) → 詳細住所フィールド（PostalCode, Prefecture, City, AddressLine）に分割
   - `MobilePhone` (携帯電話) → 既存の `PhoneNumber` フィールドに統合

2. **新しいテーブルスキーマ**:
   - PhoneNumber（携帯電話番号、15文字、必須）
   - Name（氏名、100文字）
   - NameKana（氏名ふりがな、100文字）
   - DateOfBirth（生年月日）
   - PostalCode（郵便番号、8文字）
   - Prefecture（都道府県、10文字）
   - City（市区町村、50文字）
   - AddressLine（番地・建物名、200文字）
   - HomePhone（固定電話、20文字）
   - Email（メールアドレス、200文字）

## 実施内容

### 1. バックエンド修正

#### 1.1 モデルクラス修正

**ファイル**: [ReactApp.Server/Models/Parent.cs](../ReactApp.Server/Models/Parent.cs)

**変更内容**:
- `Address` プロパティを削除
- `MobilePhone` プロパティを削除
- フィールドの並び順を新スキーマに合わせて変更
- XMLコメントでスキーマ変更履歴を記録

```csharp
public class Parent
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; } = string.Empty; // MobilePhoneがここに格納される
    public string? Name { get; set; }
    public string? NameKana { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PostalCode { get; set; }
    public string? Prefecture { get; set; }
    public string? City { get; set; }
    public string? AddressLine { get; set; }
    public string? HomePhone { get; set; }
    public string? Email { get; set; }
    public int NurseryId { get; set; }
    // ... 通知設定等
}
```

#### 1.2 DbContext修正

**ファイル**: [ReactApp.Server/Data/KindergartenDbContext.cs](../ReactApp.Server/Data/KindergartenDbContext.cs:135-151)

**変更内容**:
- カラム制約の並び順を新スキーマに合わせて変更
- `MobilePhone` 関連のインデックスを削除
- `Address` の設定を削除

```csharp
// カラム制約とデフォルト値（2025-12-12更新: スキーマ変更に対応）
entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(15);
entity.Property(e => e.Name).HasMaxLength(100);
entity.Property(e => e.NameKana).HasMaxLength(100);
entity.Property(e => e.PostalCode).HasMaxLength(8);
entity.Property(e => e.Prefecture).HasMaxLength(10);
entity.Property(e => e.City).HasMaxLength(50);
entity.Property(e => e.AddressLine).HasMaxLength(200);
entity.Property(e => e.HomePhone).HasMaxLength(20);
entity.Property(e => e.Email).HasMaxLength(200);
entity.Property(e => e.NurseryId).IsRequired();
```

#### 1.3 サービスクラス修正

**ファイル1**: [ReactApp.Server/Services/ApplicationService.cs](../ReactApp.Server/Services/ApplicationService.cs:348-385)

**変更内容**:
- 入園申込インポート時のマッピングを修正
- ApplicationWork.MobilePhone → Parent.PhoneNumber
- 詳細住所フィールドを個別にマッピング

**主な修正箇所**:
```csharp
// 保護者情報更新（既存保護者の上書き時）
existingParent.Name = application.ApplicantName;
existingParent.NameKana = application.ApplicantNameKana;
existingParent.DateOfBirth = application.DateOfBirth.ToDateTime(TimeOnly.MinValue);
existingParent.PostalCode = application.PostalCode;
existingParent.Prefecture = application.Prefecture;
existingParent.City = application.City;
existingParent.AddressLine = application.AddressLine;
existingParent.HomePhone = application.HomePhone;
existingParent.Email = application.Email;

// 新規保護者作成
var newParent = new Parent
{
    PhoneNumber = application.MobilePhone, // ★重要: MobilePhoneをPhoneNumberに格納
    Name = application.ApplicantName,
    NameKana = application.ApplicantNameKana,
    DateOfBirth = application.DateOfBirth.ToDateTime(TimeOnly.MinValue),
    PostalCode = application.PostalCode,
    Prefecture = application.Prefecture,
    City = application.City,
    AddressLine = application.AddressLine,
    HomePhone = application.HomePhone,
    Email = application.Email,
    // ...
};
```

**ファイル2**: [ReactApp.Server/Services/DesktopMasterService.cs](../ReactApp.Server/Services/DesktopMasterService.cs)

**変更箇所**:
- 保護者作成（CreateParentAsync）: 7つの新規フィールドを追加
- 保護者一覧取得（GetAllParentsAsync）: DTOマッピングを修正
- 保護者詳細取得（GetParentByIdAsync）: DTOマッピングを修正
- 保護者更新（UpdateParentAsync）: 7つの新規フィールドの更新ロジックを追加

#### 1.4 DTO修正

**ファイル1**: [ReactApp.Server/DTOs/Desktop/ParentDto.cs](../ReactApp.Server/DTOs/Desktop/ParentDto.cs)

**変更内容**:
- `ParentDto`: `Address` と `MobilePhone` を削除、7つの新規フィールドを追加
- `CreateParentRequestDto`: 同様に修正
- `UpdateParentRequestDto`: 同様に修正

**ファイル2**: [ReactApp.Server/DTOs/Desktop/ChildDto.cs](../ReactApp.Server/DTOs/Desktop/ChildDto.cs:86-123)

**変更内容**:
- `CreateParentWithChildDto`: 園児と同時に保護者を作成する際のDTOを修正

#### 1.5 データベースマイグレーション

**ファイル**: [ReactApp.Server/Migrations/20251212015556_RemoveAddressAndMobilePhoneFromParents.cs](../ReactApp.Server/Migrations/20251212015556_RemoveAddressAndMobilePhoneFromParents.cs)

**マイグレーション内容**:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // 実際のテーブルスキーマにはAddressとMobilePhoneが存在しないため、
    // DROP COLUMNは実行不要。モデルから削除しただけで十分。
}
```

**実行結果**:
```
✅ Migration '20251212015556_RemoveAddressAndMobilePhoneFromParents' applied successfully
```

**注記**: ユーザーが提供したスクリプトに基づき、実際のデータベーステーブルには最初から `Address` と `MobilePhone` カラムが存在しないため、削除操作は不要でした。

### 2. フロントエンド修正

#### 2.1 型定義修正

**ファイル**: [reactapp.client/src/desktop/types/master.ts](../reactapp.client/src/desktop/types/master.ts)

**変更内容**:
- `CreateParentWithChildDto`: 7つの新規フィールドを追加、`address` を削除
- `ParentDto`: 同様に修正、`nurseryId` フィールドを追加
- `CreateParentRequestDto`: 同様に修正
- `UpdateParentRequestDto`: 同様に修正

```typescript
export interface ParentDto {
  id: number;
  phoneNumber: string;
  name?: string;
  nameKana?: string;
  dateOfBirth?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  homePhone?: string;
  email?: string;
  nurseryId: number;
  // ... 通知設定等
  children: ChildBasicInfoDto[];
}
```

#### 2.2 UIコンポーネント修正（保留）

**該当ファイル**:
- [reactapp.client/src/desktop/pages/ParentsPage.tsx](../reactapp.client/src/desktop/pages/ParentsPage.tsx)
- [reactapp.client/src/desktop/pages/ParentFormPage.tsx](../reactapp.client/src/desktop/pages/ParentFormPage.tsx)

**必要な修正内容**（次のステップ）:
1. フォームフィールドの追加:
   - 氏名ふりがな入力欄
   - 生年月日入力欄（DatePicker）
   - 郵便番号入力欄
   - 都道府県選択欄（ドロップダウン）
   - 市区町村入力欄
   - 番地・建物名入力欄
   - 固定電話入力欄

2. 一覧表示の更新:
   - 住所列を削除
   - 必要に応じて都道府県・市区町村列を追加

3. 詳細表示の更新:
   - 住所欄を削除
   - 詳細住所フィールドを個別に表示

## 修正されたファイル一覧

### バックエンド (C#)
1. `ReactApp.Server/Models/Parent.cs` - エンティティモデル
2. `ReactApp.Server/Data/KindergartenDbContext.cs` - DbContext設定
3. `ReactApp.Server/Services/ApplicationService.cs` - 入園申込サービス
4. `ReactApp.Server/Services/DesktopMasterService.cs` - デスクトップマスタサービス
5. `ReactApp.Server/DTOs/Desktop/ParentDto.cs` - 保護者DTO
6. `ReactApp.Server/DTOs/Desktop/ChildDto.cs` - 園児DTO（CreateParentWithChildDto）
7. `ReactApp.Server/Migrations/20251212015556_RemoveAddressAndMobilePhoneFromParents.cs` - マイグレーション

### フロントエンド (TypeScript)
8. `reactapp.client/src/desktop/types/master.ts` - 型定義

### ドキュメント
9. `claude_logs/2025-12-12_schema_change.md` - 本作業ログ

## ビルド結果

### バックエンド
```
✅ ビルドに成功しました。
    0 個の警告
    0 エラー
```

### データベース
```
✅ Migration '20251212015556_RemoveAddressAndMobilePhoneFromParents' applied successfully
```

## 重要な注意点

### データマッピング

| ApplicationWork | Parents | 説明 |
|---|---|---|
| ApplicantName | Name | そのまま |
| ApplicantNameKana | NameKana | そのまま |
| DateOfBirth | DateOfBirth | DateOnly → DateTime変換 |
| PostalCode | PostalCode | そのまま |
| Prefecture | Prefecture | そのまま |
| City | City | そのまま |
| AddressLine | AddressLine | そのまま |
| **MobilePhone** | **PhoneNumber** | ★重要: MobilePhoneの値をPhoneNumberに格納 |
| HomePhone | HomePhone | そのまま |
| Email | Email | そのまま |

### 削除されたフィールドの扱い

1. **Address フィールド**:
   - ユーザー提供のスキーマでは最初から存在しない
   - 新規システムでは PostalCode + Prefecture + City + AddressLine の組み合わせを使用

2. **MobilePhone フィールド**:
   - ユーザー提供のスキーマでは最初から存在しない
   - ApplicationWorkの `MobilePhone` は Parent の `PhoneNumber` に格納される
   - `PhoneNumber` は「携帯電話番号」を意味する（SMS認証用）

## 今後の作業

### 短期（必須）

1. ~~**バックエンド修正**~~ ✅ 完了
   - ~~Parent.csモデル修正~~
   - ~~KindergartenDbContext.cs修正~~
   - ~~ApplicationService.cs修正~~
   - ~~DesktopMasterService.cs修正~~
   - ~~DTO修正~~

2. ~~**フロントエンド型定義**~~ ✅ 完了
   - ~~master.ts修正~~

3. **UIコンポーネント修正** 🔄 保留
   - ParentFormPage.tsx: フォームフィールド追加
   - ParentsPage.tsx: 一覧表示更新
   - 詳細表示画面の更新

4. **テスト**
   - 保護者の新規作成テスト
   - 保護者の編集テスト
   - 入園申込インポートテスト（MobilePhone→PhoneNumberマッピング確認）

### 中期

1. **データ検証**
   - 郵便番号の形式チェック（ハイフン有無）
   - 都道府県マスタとの整合性確認

2. **UI/UX改善**
   - 郵便番号から住所自動入力機能
   - 都道府県プルダウンメニュー
   - 入力支援機能

## トラブルシューティング

### 発生した問題と解決策

**問題1**: ビルドエラー - `Address` プロパティが見つからない
- **原因**: ApplicationService.cs と DesktopMasterService.cs で削除されたフィールドを参照
- **解決**: すべての参照箇所を詳細住所フィールドに置き換え

**問題2**: CreateParentWithChildDto のビルドエラー
- **原因**: 園児作成時の保護者DTO に新規フィールドが不足
- **解決**: ChildDto.cs の CreateParentWithChildDto を修正

**問題3**: マイグレーション実行時のエラー
- **原因**: 存在しないインデックス（IX_Parents_MobilePhone_NurseryId）を削除しようとした
- **解決**: Up() メソッドを空にして、マイグレーション履歴のみ記録

## 関連ドキュメント

- [保護者マスタ拡張仕様書（旧版）](../docs/desktop/parents-table-enhancement.md) - 2025-12-10作成
- [作業ログ 2025-12-10](./2025-12-10.md) - 複数園児申込実装
- [作業ログ 2025-12-09](./2025-12-09.md) - 申込管理画面UI改善
- [作業ログ 2025-12-08](./2025-12-08.md) - Phase 2バックエンド実装

## 備考

- すべてのバックエンド修正は完了し、ビルド成功を確認
- データベースマイグレーションは正常に適用済み
- フロントエンドの型定義は更新済み
- UIコンポーネントの修正は次の作業として保留（別途対応が必要）
- 新規フィールドはすべて nullable なので、既存データへの影響なし
