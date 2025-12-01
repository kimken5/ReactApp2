# 年度スライド仕様書更新 (2025-12-01)

## 更新の背景

ユーザーが Phase 1 のテーブル作成・拡張を実施済みで、実際の実装と仕様書の内容に差異がありました。主な差異:

1. **複合主キーの順序**: 実装では `AcademicYear` が先頭
2. **カラム名の統一**: すべての年度カラムが `AcademicYear` に統一
3. **StaffClassAssignmentsの変更範囲**: テーブル再構築により、IsCurrent/IsFuture が既に含まれている

## 更新したファイル

### 1. docs/desktop/academic-year-slide-design.md (v1.1)

**主な変更点**:

#### ChildClassAssignments
- 複合主キー: `(NurseryId, ChildId, Year)` → `(AcademicYear, NurseryId, ChildId)`
- すべての `Year` カラム参照を `AcademicYear` に変更
- CREATE TABLE 文、インデックス、コメント、すべてのSQL文を更新

#### StaffClassAssignments
- セクション名変更: "拡張" → "実装済みテーブル定義"
- 完全なテーブル定義を記載（ALTER文ではなくCREATE文）
- 複合主キー: `(AcademicYear, NurseryId, StaffId, ClassId)`
- IsCurrent, IsFuture が既に含まれていることを明記

#### すべてのSQL文
- 年度スライド処理フロー内のすべてのクエリで `Year` → `AcademicYear` に変更
- INSERT文の列順序を複合主キー順序に合わせて変更
- WHERE句、JOIN条件、すべて `AcademicYear` に統一

#### ドキュメントメタデータ
- バージョン: 1.0 → 1.1
- ステータス: "レビュー待ち" → "実装済み (Phase 1)"
- 変更履歴セクションを追加

### 2. docs/desktop/database-design.md

**主な変更点**:

#### Section 1.5: StaffClassAssignments テーブル拡張
- セクション名変更: "テーブル拡張" → "テーブル再構築（年度スライド対応）"
- ALTER TABLE → CREATE TABLE に変更（テーブル再構築の実態を反映）
- 完全なテーブル定義を記載
- 複合主キー `(AcademicYear, NurseryId, StaffId, ClassId)` を明記
- IsCurrent, IsFuture カラムを含めた完全なスキーマを記載

#### Section 8.1: 既存テーブル拡張のサマリー
- StaffClassAssignments: 3カラム → 5カラム（IsCurrent, IsFuture追加を反映）
- 説明文: "年度別クラス割り当て、年度スライド管理（複合主キー変更含む）"
- 合計カラム数: 28カラム → 30カラム

#### Section 8.2: 新規テーブルのサマリー
- ChildClassAssignmentsテーブルを追加
- 合計テーブル数: 4テーブル → 5テーブル

## 実装済みのテーブル定義（Phase 1完了）

### ChildClassAssignments
```sql
CREATE TABLE [dbo].[ChildClassAssignments] (
    [AcademicYear] INT NOT NULL,
    [NurseryId] INT NOT NULL,
    [ChildId] INT NOT NULL,
    [ClassId] NVARCHAR(50) NOT NULL,
    [IsCurrent] BIT NOT NULL DEFAULT 0,
    [IsFuture] BIT NOT NULL DEFAULT 0,
    [AssignedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [AssignedByUserId] INT NULL,
    [Notes] NVARCHAR(200) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT PK_ChildClassAssignments PRIMARY KEY ([AcademicYear], [NurseryId], [ChildId])
);
```

### StaffClassAssignments (再構築)
```sql
CREATE TABLE [dbo].[StaffClassAssignments] (
    [AcademicYear] INT NOT NULL,
    [NurseryId] INT NOT NULL,
    [StaffId] INT NOT NULL,
    [ClassId] NVARCHAR(50) NOT NULL,
    [AssignmentRole] NVARCHAR(50) NULL,
    [IsCurrent] BIT NOT NULL DEFAULT 0,
    [IsFuture] BIT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [AssignedByUserId] INT NULL,
    [Notes] NVARCHAR(200) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,
    CONSTRAINT PK_StaffClassAssignments PRIMARY KEY ([AcademicYear], [NurseryId], [StaffId], [ClassId])
);
```

## 次のフェーズ（Phase 2）

Entity Framework モデルの作成:
1. ChildClassAssignment.cs モデル作成
2. StaffClassAssignment.cs モデル更新（複合主キー対応）
3. KindergartenDbContext.cs の設定更新
4. マイグレーション作成と適用

## 重要な設計原則

1. **AcademicYearを複合主キーの先頭に配置**: パーティショニング、クエリパフォーマンスの最適化
2. **命名の一貫性**: すべての年度カラムを `AcademicYear` に統一
3. **年度スライド管理**: IsCurrent/IsFuture フラグによる現在年度と未来年度の明確な区別
4. **履歴保持**: すべての年度のデータを保持し、過去参照を可能にする
