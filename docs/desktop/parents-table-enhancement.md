# 保護者マスタテーブル拡張仕様書

## 概要

入園申込ワークテーブル（ApplicationWork）から保護者マスタ（Parents）へのデータ取込時に、保護者情報を完全に保存できるようParentsテーブルを拡張しました。

**実施日**: 2025-12-10
**目的**: ApplicationWorkテーブルの保護者情報を全て取り込めるようにする

---

## テーブル構造の差異分析

### ApplicationWorkテーブルの保護者フィールド

| フィールド名 | データ型 | 最大長 | 必須 | 説明 |
|---|---|---|---|---|
| ApplicantName | NVARCHAR | 100 | ✓ | 申請保護者氏名 |
| **ApplicantNameKana** | NVARCHAR | 100 | ✓ | **申請保護者ふりがな** |
| **DateOfBirth** | DATETIME | - | ✓ | **保護者生年月日** |
| **PostalCode** | NVARCHAR | 8 | - | **郵便番号** |
| **Prefecture** | NVARCHAR | 10 | - | **都道府県** |
| **City** | NVARCHAR | 50 | - | **市区町村** |
| **AddressLine** | NVARCHAR | 200 | - | **番地・建物名** |
| **MobilePhone** | NVARCHAR | 20 | ✓ | **携帯電話** |
| **HomePhone** | NVARCHAR | 20 | - | **固定電話** |
| Email | NVARCHAR | 255 | - | メールアドレス |
| RelationshipToChild | NVARCHAR | 20 | ✓ | 続柄 |

### 旧Parentsテーブル（拡張前）

| フィールド名 | データ型 | 最大長 | 必須 | 説明 |
|---|---|---|---|---|
| Id | INT | - | ✓ | 保護者ID（IDENTITY） |
| PhoneNumber | NVARCHAR | 15 | ✓ | 電話番号（SMS認証用） |
| Name | NVARCHAR | 100 | - | 保護者名 |
| Email | NVARCHAR | 200 | - | メールアドレス |
| **Address** | NVARCHAR | 200 | - | **住所（1フィールドのみ）** |
| NurseryId | INT | - | ✓ | 保育園ID |
| IsActive | BIT | - | ✓ | アクティブフラグ |
| CreatedAt | DATETIME | - | ✓ | 作成日時 |
| UpdatedAt | DATETIME | - | - | 更新日時 |
| LastLoginAt | DATETIME | - | - | 最終ログイン日時 |

### 不足していたフィールド（拡張前）

| 不足フィールド | 理由 |
|---|---|
| **NameKana** | ふりがなが保存できない |
| **DateOfBirth** | 生年月日が保存できない |
| **PostalCode** | 郵便番号が保存できない |
| **Prefecture** | 都道府県が保存できない |
| **City** | 市区町村が保存できない |
| **AddressLine** | 番地・建物名が単独で保存できない |
| **MobilePhone** | PhoneNumberはSMS認証用（最大15文字）で用途が異なる |
| **HomePhone** | 固定電話が保存できない |

---

## 拡張後のParentsテーブル構造

### 追加フィールド一覧

| フィールド名 | データ型 | 最大長 | NULL許可 | デフォルト値 | 説明 |
|---|---|---|---|---|---|
| **NameKana** | NVARCHAR | 100 | ✓ | NULL | 保護者氏名ふりがな |
| **DateOfBirth** | DATE | - | ✓ | NULL | 保護者生年月日 |
| **PostalCode** | NVARCHAR | 8 | ✓ | NULL | 郵便番号 |
| **Prefecture** | NVARCHAR | 10 | ✓ | NULL | 都道府県 |
| **City** | NVARCHAR | 50 | ✓ | NULL | 市区町村 |
| **AddressLine** | NVARCHAR | 200 | ✓ | NULL | 番地・建物名 |
| **MobilePhone** | NVARCHAR | 20 | ✓ | NULL | 携帯電話番号 |
| **HomePhone** | NVARCHAR | 20 | ✓ | NULL | 固定電話番号 |

### 追加インデックス一覧

| インデックス名 | カラム | 種類 | フィルター条件 | 用途 |
|---|---|---|---|---|
| **IX_Parents_MobilePhone_NurseryId** | MobilePhone, NurseryId | 複合 | MobilePhone IS NOT NULL | 重複チェック用 |
| **IX_Parents_PostalCode** | PostalCode | 単一 | PostalCode IS NOT NULL | 住所検索用 |

---

## フィールドマッピング

### ApplicationWork → Parents 取込時のマッピング

| ApplicationWork | Parents | 変換ロジック |
|---|---|---|
| ApplicantName | Name | そのまま |
| **ApplicantNameKana** | **NameKana** | そのまま |
| **DateOfBirth** | **DateOfBirth** | DateTime → DATE変換 |
| **PostalCode** | **PostalCode** | そのまま |
| **Prefecture** | **Prefecture** | そのまま |
| **City** | **City** | そのまま |
| **AddressLine** | **AddressLine** | そのまま |
| **MobilePhone** | **MobilePhone** | そのまま（正規化済み） |
| - | PhoneNumber | MobilePhoneをコピー |
| **HomePhone** | **HomePhone** | そのまま |
| Email | Email | そのまま |
| - | Address | Prefecture + City + AddressLineを結合 |

### 住所フィールドの使い分け

#### 新規登録（入園申込取込）
- **PostalCode**: 郵便番号
- **Prefecture**: 都道府県
- **City**: 市区町村
- **AddressLine**: 番地・建物名
- **Address**: Prefecture + City + AddressLineを結合した完全住所（後方互換性）

#### 従来登録（SMS認証経由）
- **Address**: 完全住所（後方互換性のため残す）
- 詳細フィールドは空（NULL）

---

## 実装内容

### 1. SQLスクリプト

**ファイル**: `ReactApp.Server/scripts/update_parents_table_for_application_import.sql`

**主な処理**:
1. 8つのフィールドを追加（すべてNULL許可）
2. 既存データに影響を与えない
3. MobilePhoneへPhoneNumberデータをコピー
4. 2つのインデックスを作成
5. トランザクション処理でロールバック対応

**実行方法**:
```sql
-- SQL Server Management Studioまたはsqlcmdで実行
:r C:\ClaudeCodeDev\ReactApp2\ReactApp.Server\scripts\update_parents_table_for_application_import.sql
```

### 2. モデルクラス修正

**ファイル**: `ReactApp.Server/Models/Parent.cs`

**追加プロパティ**:
```csharp
// 入園申込取込対応フィールド（2025-12-10追加）

[StringLength(100)]
public string? NameKana { get; set; }

public DateTime? DateOfBirth { get; set; }

[StringLength(8)]
public string? PostalCode { get; set; }

[StringLength(10)]
public string? Prefecture { get; set; }

[StringLength(50)]
public string? City { get; set; }

[StringLength(200)]
public string? AddressLine { get; set; }

[StringLength(20)]
public string? MobilePhone { get; set; }

[StringLength(20)]
public string? HomePhone { get; set; }
```

### 3. DbContext修正

**ファイル**: `ReactApp.Server/Data/KindergartenDbContext.cs`

**Entity Framework Core設定**:
```csharp
modelBuilder.Entity<Parent>(entity =>
{
    // 入園申込取込対応フィールド（2025-12-10追加）
    entity.Property(e => e.NameKana).HasMaxLength(100);
    entity.Property(e => e.PostalCode).HasMaxLength(8);
    entity.Property(e => e.Prefecture).HasMaxLength(10);
    entity.Property(e => e.City).HasMaxLength(50);
    entity.Property(e => e.AddressLine).HasMaxLength(200);
    entity.Property(e => e.MobilePhone).HasMaxLength(20);
    entity.Property(e => e.HomePhone).HasMaxLength(20);

    // MobilePhoneのインデックス（重複チェック用）
    entity.HasIndex(e => new { e.MobilePhone, e.NurseryId })
        .HasDatabaseName("IX_Parents_MobilePhone_NurseryId")
        .HasFilter("[MobilePhone] IS NOT NULL");

    entity.HasIndex(e => e.PostalCode)
        .HasDatabaseName("IX_Parents_PostalCode")
        .HasFilter("[PostalCode] IS NOT NULL");
});
```

---

## 互換性への配慮

### 後方互換性

1. **既存フィールドは削除しない**
   - `PhoneNumber`: SMS認証用として継続使用
   - `Address`: 旧形式の住所として継続使用

2. **新規フィールドはすべてNULL許可**
   - 既存データに影響なし
   - 段階的な移行が可能

3. **既存のインデックスは維持**
   - `IX_Parents_PhoneNumber_Unique`
   - `IX_Parents_Email`
   - その他のパフォーマンスインデックス

### データ移行戦略

#### 既存保護者データ
- そのまま維持（新規フィールドはNULL）
- PhoneNumber → MobilePhoneへコピー済み
- 必要に応じてデスクトップアプリから追記可能

#### 新規申込取込データ
- 全フィールドに値を設定
- MobilePhone → PhoneNumberへもコピー
- Address = Prefecture + City + AddressLineで自動生成

---

## 重複チェックロジックの変更

### 旧ロジック（変更前）
```csharp
var existingParent = await _context.Parents
    .Where(p => p.PhoneNumber == normalizedPhone && p.NurseryId == nurseryId)
    .FirstOrDefaultAsync();
```

### 新ロジック（変更後）
```csharp
var existingParent = await _context.Parents
    .Where(p => p.MobilePhone == normalizedMobilePhone && p.NurseryId == nurseryId)
    .FirstOrDefaultAsync();

// フォールバック: MobilePhoneがNULLの場合はPhoneNumberで検索
if (existingParent == null)
{
    existingParent = await _context.Parents
        .Where(p => p.PhoneNumber == normalizedMobilePhone && p.NurseryId == nurseryId)
        .FirstOrDefaultAsync();
}
```

---

## パフォーマンスへの影響

### インデックス効果

| インデックス | 対象クエリ | 効果 |
|---|---|---|
| IX_Parents_MobilePhone_NurseryId | 重複チェック | O(log n) |
| IX_Parents_PostalCode | 住所検索 | O(log n) |

### ストレージ増加量（概算）

- 1保護者あたり追加: 約500バイト（8フィールド × 平均50バイト + インデックス）
- 1000人の保護者: 約500KB
- 10000人の保護者: 約5MB

**結論**: パフォーマンスへの影響は軽微

---

## テスト観点

### 1. スキーマ検証
- ✅ 8つのフィールドがすべて追加されているか
- ✅ データ型・サイズが正しいか
- ✅ NULL許可が正しく設定されているか
- ✅ インデックスが作成されているか

### 2. データ取込検証
- ✅ ApplicationWorkから全フィールドが正しくマッピングされるか
- ✅ MobilePhoneによる重複チェックが機能するか
- ✅ 住所の結合（Address）が正しく行われるか

### 3. 後方互換性検証
- ✅ 既存のSMS認証が正常に動作するか
- ✅ 既存のPhoneNumber検索が機能するか
- ✅ 既存保護者データが破損していないか

### 4. パフォーマンス検証
- ✅ 重複チェッククエリのレスポンス時間（目標: <100ms）
- ✅ 一覧取得クエリのレスポンス時間（目標: <500ms）

---

## ロールバック手順

万が一問題が発生した場合のロールバック手順:

```sql
BEGIN TRANSACTION;

-- インデックス削除
DROP INDEX IF EXISTS IX_Parents_MobilePhone_NurseryId ON Parents;
DROP INDEX IF EXISTS IX_Parents_PostalCode ON Parents;

-- フィールド削除
ALTER TABLE Parents DROP COLUMN IF EXISTS NameKana;
ALTER TABLE Parents DROP COLUMN IF EXISTS DateOfBirth;
ALTER TABLE Parents DROP COLUMN IF EXISTS PostalCode;
ALTER TABLE Parents DROP COLUMN IF EXISTS Prefecture;
ALTER TABLE Parents DROP COLUMN IF EXISTS City;
ALTER TABLE Parents DROP COLUMN IF EXISTS AddressLine;
ALTER TABLE Parents DROP COLUMN IF EXISTS MobilePhone;
ALTER TABLE Parents DROP COLUMN IF EXISTS HomePhone;

COMMIT TRANSACTION;
```

---

## 関連ドキュメント

- [入園申込管理要件定義書](requirements.md#25-入園申込管理機能)
- [データベース設計書](database-design.md)
- [ApplicationWorkテーブル仕様](../mobile/database-design.md#applicationwork)

---

## 変更履歴

| 日付 | 担当者 | 変更内容 |
|---|---|---|
| 2025-12-10 | Claude | 初版作成：保護者マスタ拡張実装 |
