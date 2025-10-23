# テーブル構造更新仕様書

## 概要

園児情報とクラス情報のテーブル構造を複合主キー設計に変更し、保育園単位での一意性を確保する。

## 修正対象テーブル

### 1. Classesテーブル

#### 修正前
```sql
CREATE TABLE Classes (
    Id NVARCHAR(50) PRIMARY KEY, -- "sakura-2024", "himawari-2024" 等
    Name NVARCHAR(50) NOT NULL, -- "さくら組", "ひまわり組"
    NurseryId INT NOT NULL,
    AgeGroupMin INT NOT NULL,
    AgeGroupMax INT NOT NULL,
    MaxCapacity INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

#### 修正後
```sql
CREATE TABLE Classes (
    NurseryId INT NOT NULL, -- 保育園ID（複合主キーの第1カラム）
    ClassId NVARCHAR(50) NOT NULL, -- クラスID（複合主キーの第2カラム）
    Name NVARCHAR(50) NOT NULL, -- "さくら組", "ひまわり組"
    AgeGroupMin INT NOT NULL,
    AgeGroupMax INT NOT NULL,
    MaxCapacity INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT PK_Classes PRIMARY KEY (NurseryId, ClassId),
    CONSTRAINT FK_Classes_Nursery FOREIGN KEY (NurseryId) REFERENCES Nurseries(Id) ON DELETE CASCADE
);
```

#### 変更点
- `Id` カラムを削除し、`ClassId` カラムに名称変更
- `NurseryId` を第1カラムに移動
- 複合主キー `(NurseryId, ClassId)` を設定
- 外部キー制約を明示的に追加

### 2. Childrenテーブル

#### 修正前
```sql
CREATE TABLE Children (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    NurseryId INT NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    EnrollmentDate DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

#### 修正後
```sql
CREATE TABLE Children (
    NurseryId INT NOT NULL, -- 保育園ID（複合主キーの第1カラム）
    ChildId INT IDENTITY(1,1) NOT NULL, -- 園児ID（複合主キーの第2カラム）
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    ClassId NVARCHAR(50) NOT NULL,
    EnrollmentDate DATE NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),

    CONSTRAINT PK_Children PRIMARY KEY (NurseryId, ChildId),
    CONSTRAINT FK_Children_Nursery FOREIGN KEY (NurseryId) REFERENCES Nurseries(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Children_Class FOREIGN KEY (NurseryId, ClassId) REFERENCES Classes(NurseryId, ClassId) ON DELETE CASCADE
);
```

#### 変更点
- `Id` カラムを削除し、`ChildId` カラムに名称変更
- `NurseryId` を第1カラムに移動
- 複合主キー `(NurseryId, ChildId)` を設定
- Classesテーブルへの複合外部キー制約を追加

## 影響する関連テーブル

以下のテーブルは外部キーでChildrenテーブルを参照しているため、構造変更が必要：

### 3. ParentChildRelationships
- `ChildId INT` → `NurseryId INT, ChildId INT` の複合外部キーに変更
- 複合主キー: `(ParentId, NurseryId, ChildId)`

### 4. ContactNotifications (AbsenceNotifications)
- `ChildId INT` → `NurseryId INT, ChildId INT` の複合外部キーに変更

### 5. DailyReports
- `ChildId INT` → `NurseryId INT, ChildId INT` の複合外部キーに変更

### 6. Photos
- `ChildId INT` → `NurseryId INT, ChildId INT` の複合外部キーに変更

### 7. StaffReports
- `ChildId INT` → `NurseryId INT, ChildId INT` の複合外部キーに変更

### 8. Announcements
- `TargetChildId INT` → `TargetNurseryId INT, TargetChildId INT` の複合外部キーに変更

## データ移行手順

1. **バックアップ作成**
   - 現在のテーブル構造とデータの完全バックアップ

2. **新テーブル作成**
   - 新しい構造でテーブルを作成

3. **データ移行**
   - 既存データを新しい構造に適合させて移行

4. **外部キー制約の再設定**
   - 関連テーブルの外部キー制約を新しい複合キーに対応

5. **インデックス再作成**
   - パフォーマンス最適化のためのインデックス再構築

6. **アプリケーション側修正**
   - エンティティモデルとコントローラーの修正

## 注意事項

- この変更は破壊的変更のため、十分なテストが必要
- データベースの整合性チェックを実行
- アプリケーションの動作確認を実施
- 本格運用前に開発環境での十分な検証を推奨

## 修正完了確認項目

- [ ] Classesテーブルの複合主キー設定
- [ ] Childrenテーブルの複合主キー設定
- [ ] 関連テーブルの外部キー制約修正
- [ ] インデックスの再作成
- [ ] アプリケーション側エンティティモデル修正
- [ ] APIコントローラーの修正
- [ ] フロントエンド側インターフェース修正
- [ ] 既存データの整合性確認
- [ ] パフォーマンステスト実行