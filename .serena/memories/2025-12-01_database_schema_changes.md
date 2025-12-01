# 2025-12-01 データベーススキーマ変更

## 概要
ユーザーからの要件に基づき、データベース設計仕様書を修正しました。

## 主な変更内容

### 1. AcademicYearsテーブルのスキーマ変更
**変更前**:
- 主キー: `Id INT IDENTITY(1,1) PRIMARY KEY`
- インデックス: `IX_AcademicYears_NurseryId_Year`

**変更後**:
- 複合主キー: `PRIMARY KEY (NurseryId, Year)`
- ID列を削除
- インデックス: `IX_AcademicYears_NurseryId_IsCurrent` のみ

**理由**: ユーザーが実際のデータベースで複合主キーを採用したため、仕様書を実装に合わせて修正

### 2. AttendanceStatisticsテーブルの削除
**変更内容**:
- AttendanceStatisticsテーブル定義を完全に削除
- 関連するビュー(v_ChildAttendanceSummary)を削除
- 関連するストアドプロシージャ(sp_CalculateAttendanceStatistics)を削除
- マイグレーション順序からAttendanceStatisticsを削除(Phase 4: 14番目のテーブル作成)
- サマリーの新規テーブル数を5から4に変更

**理由**: ユーザーの方針変更により、バッチ処理による統計計算を廃止し、リアルタイム計算方式に変更したため

### 3. 統計計算方式の変更
**旧方式**:
- AttendanceStatisticsテーブルに事前計算した統計値をキャッシュ
- 日次バッチ(深夜0時)、月次バッチ、年度バッチで更新
- sp_CalculateAttendanceStatisticsストアドプロシージャを使用

**新方式**:
- DailyAttendancesテーブルから直接リアルタイムでクエリ
- 画面上で条件(年度、月、クラスなど)を入力
- その場でSQLクエリを発行してリアルタイムな統計値を表示
- バッチ処理は一切行わない

## 修正したファイル

### docs/desktop/database-design.md
1. **Section 2.1 AcademicYears**: 複合主キー(NurseryId, Year)に変更
2. **Section 2.5 AttendanceStatistics**: セクション全体を削除
3. **Section 3 マイグレーション順序**: Phase 4から AttendanceStatistics を削除
4. **Section 5.3 v_ChildAttendanceSummary**: リアルタイム集計クエリ例に置き換え
5. **Section 6.2 sp_CalculateAttendanceStatistics**: ストアドプロシージャを削除
6. **Section 7.1 AcademicYear.cs**: Idプロパティを削除、複合主キーのコメント追加
7. **Section 7.5 AttendanceStatistic.cs**: クラス定義全体を削除
8. **Section 8.2 新規テーブルサマリー**: AttendanceStatisticsの行を削除、合計を5→4テーブルに変更
9. **冒頭の変更履歴**: 今回の変更を記録
10. **設計方針の変更**: リアルタイム統計計算方式の説明を追加

## 影響範囲

### 削除したもの
- AttendanceStatisticsテーブル定義
- AttendanceStatisticエンティティクラス
- v_ChildAttendanceSummaryビュー(旧定義)
- sp_CalculateAttendanceStatisticsストアドプロシージャ
- バッチ処理に関する全ての記述

### 追加したもの
- リアルタイム統計クエリの例
- 設計方針の変更に関する説明
- 変更履歴セクション

### 変更したもの
- AcademicYearエンティティクラス(Idプロパティ削除)
- AcademicYearsテーブル定義(複合主キー採用)
- 新規テーブル数(5→4)

## 今後の対応が必要な箇所

### 1. 実装コードの確認
実際のC#コード(`ReactApp.Server/Models/AcademicYear.cs`)が存在する場合、以下の修正が必要:
```csharp
// 削除が必要
// public int Id { get; set; }

// 追加が必要
// [Key, Column(Order = 0)]
// public int NurseryId { get; set; }
// [Key, Column(Order = 1)]
// public int Year { get; set; }
```

### 2. DbContext設定の確認
`KindergartenDbContext.cs`で複合主キーを設定:
```csharp
modelBuilder.Entity<AcademicYear>()
    .HasKey(ay => new { ay.NurseryId, ay.Year });
```

### 3. 統計表示機能の実装
リアルタイム統計クエリを実装するサービスメソッドを作成する必要があります。

## 検証結果
- ✅ docs/desktop/database-design.md内にAttendanceStatisticsへの不要な参照は残っていません(説明文を除く)
- ✅ AcademicYearエンティティクラスからIdプロパティを削除しました
- ✅ マイグレーション順序が正しく更新されました(4テーブル)
- ✅ サマリーセクションが正しく更新されました

## 作業時間
- 作業日: 2025-12-01
- 作業時間: 約20分
