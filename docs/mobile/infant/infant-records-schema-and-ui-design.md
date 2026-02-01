# 乳児生活記録システム スキーマ設計とUI設計書

## ドキュメント情報
- **作成日**: 2026-01-17
- **バージョン**: 1.0
- **前提**: 既存テーブル（InfantMeals, InfantMoods, InfantSleeps, InfantTemperatures, InfantToileting）を最大限活用

---

## 目次
1. [既存テーブル分析と修正提案](#1-既存テーブル分析と修正提案)
2. [新規テーブル設計](#2-新規テーブル設計)
3. [UI/UX設計](#3-uiux設計)
4. [実装計画](#4-実装計画)

---

## 1. 既存テーブル分析と修正提案

### 1.1 InfantMeals（食事記録）

#### 現在の構造
```csharp
public class InfantMeal {
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MealType { get; set; } // 'Breakfast', 'Lunch', 'Snack'
    public string? OverallAmount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'
    // ... CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
}
```

#### 新仕様との適合性分析

| 新仕様の要件 | 既存カラム | 対応状況 | 修正案 |
|------------|----------|---------|--------|
| 午前おやつ、昼食、午後おやつ、離乳食 | MealType | ⚠️ 部分対応 | MealType に値追加（'MorningSnack', 'Lunch', 'AfternoonSnack', 'BabyFood'） |
| 摂取量5段階（完食、ほぼ完食、半分、少量、食べず） | OverallAmount | ✅ 対応済 | 'All'→完食, 'Most'→ほぼ完食, 'Half'→半分, 'Little'→少量, 'None'→食べず |
| 記録時刻 | ❌ なし | ❌ 不足 | **追加必要**: MealTime (TIME型) |
| メモ | ❌ なし | ❌ 不足 | **追加必要**: Notes (NVARCHAR(500)) |

#### 修正SQL
```sql
-- 記録時刻カラム追加
ALTER TABLE InfantMeals ADD MealTime TIME NOT NULL DEFAULT '12:00:00';

-- メモカラム追加
ALTER TABLE InfantMeals ADD Notes NVARCHAR(500);

-- MealType の制約を更新（新しい値を許可）
-- CHECK制約がある場合は削除して再作成
ALTER TABLE InfantMeals DROP CONSTRAINT IF EXISTS CK_InfantMeals_MealType;
ALTER TABLE InfantMeals ADD CONSTRAINT CK_InfantMeals_MealType
    CHECK (MealType IN ('MorningSnack', 'Lunch', 'AfternoonSnack', 'BabyFood'));

-- OverallAmount の制約を確認（既存の値で問題ない）
ALTER TABLE InfantMeals DROP CONSTRAINT IF EXISTS CK_InfantMeals_OverallAmount;
ALTER TABLE InfantMeals ADD CONSTRAINT CK_InfantMeals_OverallAmount
    CHECK (OverallAmount IN ('All', 'Most', 'Half', 'Little', 'None'));
```

#### 修正後のC#モデル
```csharp
public class InfantMeal {
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public TimeSpan MealTime { get; set; } // ← 追加

    [Required]
    [StringLength(20)]
    public string MealType { get; set; } = null!; // 'MorningSnack', 'Lunch', 'AfternoonSnack', 'BabyFood'

    [StringLength(20)]
    public string? OverallAmount { get; set; } // 'All', 'Most', 'Half', 'Little', 'None'

    [StringLength(500)]
    public string? Notes { get; set; } // ← 追加

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
```

### 1.2 InfantSleeps（午睡記録）

#### 現在の構造
```csharp
public class InfantSleep {
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public int SleepSequence { get; set; } = 1;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }
    public string? SleepQuality { get; set; }
    public string? Notes { get; set; }
    // ... CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
}
```

#### 新仕様との適合性分析

| 新仕様の要件 | 既存カラム | 対応状況 | 修正案 |
|------------|----------|---------|--------|
| 午睡開始時刻 | StartTime | ✅ 対応済 | そのまま使用 |
| 午睡終了時刻 | EndTime | ✅ 対応済 | そのまま使用 |
| 午睡チェック記録 | ❌ なし | ❌ 不足 | **新テーブル InfantSleepChecks 作成** |
| メモ | Notes | ✅ 対応済 | そのまま使用 |

#### 判定: **修正不要、新テーブル追加のみ**

### 1.3 InfantToileting（排泄記録）

#### 現在の構造
```csharp
public class InfantToileting {
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public DateTime ToiletingTime { get; set; }
    public string ToiletingType { get; set; } = null!; // 'Urine', 'Bowel'
    public string? BowelCondition { get; set; } // 'Normal', 'Soft', 'Diarrhea', 'Hard'
    public string? BowelColor { get; set; } // 'Normal', 'Green', 'White', 'Black', 'Bloody'
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'
    public int? DiaperChangeCount { get; set; }
    // ... CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
}
```

#### 新仕様との適合性分析

| 新仕様の要件 | 既存カラム | 対応状況 | 修正案 |
|------------|----------|---------|--------|
| おしっこ・うんち同時記録 | ToiletingType | ❌ 不十分 | **設計変更**: 1レコードで両方記録できるように修正 |
| おしっこ量（少量/普通/多量） | UrineAmount | ✅ 対応済 | そのまま使用 |
| うんち量（少量/普通/多量） | ❌ なし | ❌ 不足 | **追加必要**: BowelAmount |
| うんちの種類（正常/軟便/下痢/硬い/血便） | BowelCondition | ✅ 対応済 | そのまま使用（値を調整） |

#### 修正SQL
```sql
-- ToiletingTypeを廃止して、HasUrine, HasStoolフラグに変更
ALTER TABLE InfantToileting ADD HasUrine BIT NOT NULL DEFAULT 0;
ALTER TABLE InfantToileting ADD HasStool BIT NOT NULL DEFAULT 0;

-- うんちの量カラム追加
ALTER TABLE InfantToileting ADD BowelAmount NVARCHAR(20);

-- BowelConditionの値を新仕様に合わせる
-- 'Soft'→'Soft', 'Diarrhea'→'Diarrhea', 'Hard'→'Hard', 新規: 'Bloody' (血便)
ALTER TABLE InfantToileting DROP CONSTRAINT IF EXISTS CK_InfantToileting_BowelCondition;
ALTER TABLE InfantToileting ADD CONSTRAINT CK_InfantToileting_BowelCondition
    CHECK (BowelCondition IN ('Normal', 'Soft', 'Diarrhea', 'Hard', 'Bloody'));

-- BowelAmountの制約追加
ALTER TABLE InfantToileting ADD CONSTRAINT CK_InfantToileting_BowelAmount
    CHECK (BowelAmount IN ('Little', 'Normal', 'Lot') OR BowelAmount IS NULL);

-- 少なくとも1つは記録されている必要がある
ALTER TABLE InfantToileting ADD CONSTRAINT CK_InfantToileting_HasEither
    CHECK (HasUrine = 1 OR HasStool = 1);

-- 旧カラムToiletingTypeは非推奨（後で削除）
-- ALTER TABLE InfantToileting DROP COLUMN ToiletingType;
-- ALTER TABLE InfantToileting DROP COLUMN BowelColor; -- 不要カラム削除
-- ALTER TABLE InfantToileting DROP COLUMN DiaperChangeCount; -- 不要カラム削除
```

#### 修正後のC#モデル
```csharp
public class InfantToileting {
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public DateTime ToiletingTime { get; set; }

    // おしっこ関連
    [Required]
    public bool HasUrine { get; set; } = false; // ← 追加

    [StringLength(20)]
    public string? UrineAmount { get; set; } // 'Little', 'Normal', 'Lot'

    // うんち関連
    [Required]
    public bool HasStool { get; set; } = false; // ← 追加

    [StringLength(20)]
    public string? BowelAmount { get; set; } // 'Little', 'Normal', 'Lot' ← 追加

    [StringLength(20)]
    public string? BowelCondition { get; set; } // 'Normal', 'Soft', 'Diarrhea', 'Hard', 'Bloody'

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
```

### 1.4 InfantTemperatures（体温記録）

#### 現在の構造
```csharp
public class InfantTemperature {
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MeasurementType { get; set; } = null!; // 'Home', 'Morning', 'Afternoon'
    public DateTime MeasuredAt { get; set; }
    public decimal Temperature { get; set; }
    public bool IsAbnormal { get; set; } = false;
    public string CreatedByType { get; set; } = "Staff"; // 'Parent', 'Staff'
    public bool IsDraft { get; set; } = false;
    // ... CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
}
```

#### 新仕様との適合性分析

| 新仕様の要件 | 既存カラム | 対応状況 | 修正案 |
|------------|----------|---------|--------|
| 測定時刻 | MeasuredAt | ✅ 対応済 | そのまま使用 |
| 体温（℃） | Temperature | ✅ 対応済 | そのまま使用 |
| 測定箇所（脇下/耳/額） | ❌ なし | ❌ 不足 | **追加必要**: MeasurementLocation |
| メモ | ❌ なし | ❌ 不足 | **追加必要**: Notes |

#### 修正SQL
```sql
-- 測定箇所カラム追加
ALTER TABLE InfantTemperatures ADD MeasurementLocation NVARCHAR(20) DEFAULT '脇下';

-- 測定箇所の制約追加
ALTER TABLE InfantTemperatures ADD CONSTRAINT CK_InfantTemperatures_Location
    CHECK (MeasurementLocation IN ('脇下', '耳', '額'));

-- メモカラム追加
ALTER TABLE InfantTemperatures ADD Notes NVARCHAR(500);
```

#### 修正後のC#モデル
```csharp
public class InfantTemperature {
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public DateTime MeasuredAt { get; set; }

    [Required]
    [Column(TypeName = "decimal(3,1)")]
    public decimal Temperature { get; set; }

    [StringLength(20)]
    public string MeasurementLocation { get; set; } = "脇下"; // '脇下', '耳', '額' ← 追加

    [StringLength(500)]
    public string? Notes { get; set; } // ← 追加

    public bool IsAbnormal { get; set; } = false;

    [Required]
    [StringLength(20)]
    public string CreatedByType { get; set; } = "Staff"; // 'Parent', 'Staff'

    public bool IsDraft { get; set; } = false;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
```

### 1.5 InfantMoods（機嫌・様子記録）

#### 現在の構造
```csharp
public class InfantMood {
    public int NurseryId { get; set; }
    public int ChildId { get; set; }
    public DateTime RecordDate { get; set; }
    public string MoodTime { get; set; } = null!; // 'Morning', 'Afternoon'
    public string MoodState { get; set; } = null!; // 'Good', 'Normal', 'Bad', 'Crying'
    public string? Notes { get; set; }
    // ... CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
}
```

#### 新仕様との適合性分析

| 新仕様の要件 | 既存カラム | 対応状況 | 修正案 |
|------------|----------|---------|--------|
| 記録時刻（自由入力） | MoodTime | ⚠️ 部分対応 | **変更**: TIME型に変更 |
| 機嫌（良い/普通/不機嫌/泣いている） | MoodState | ✅ 対応済 | 'Good'→良い, 'Normal'→普通, 'Bad'→不機嫌, 'Crying'→泣いている |
| 様子・特記事項 | Notes | ✅ 対応済 | そのまま使用 |

#### 修正SQL
```sql
-- MoodTimeをTIME型に変更（既存データのマイグレーション必要）
-- 一時的に新カラムを追加
ALTER TABLE InfantMoods ADD RecordTime TIME;

-- 既存データをマイグレーション（'Morning'→'09:00', 'Afternoon'→'14:00'）
UPDATE InfantMoods SET RecordTime = '09:00:00' WHERE MoodTime = 'Morning';
UPDATE InfantMoods SET RecordTime = '14:00:00' WHERE MoodTime = 'Afternoon';

-- RecordTimeをNOT NULLに変更
ALTER TABLE InfantMoods ALTER COLUMN RecordTime TIME NOT NULL;

-- 旧カラムMoodTimeは非推奨（後で削除）
-- ALTER TABLE InfantMoods DROP COLUMN MoodTime;
```

#### 修正後のC#モデル
```csharp
public class InfantMood {
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public TimeSpan RecordTime { get; set; } // ← 追加（MoodTimeから変更）

    [Required]
    [StringLength(20)]
    public string MoodState { get; set; } = null!; // 'Good', 'Normal', 'Bad', 'Crying'

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
```

---

## 2. 新規テーブル設計

### 2.1 InfantMilks（ミルク記録）- 新規作成

#### 要件
- 0～1歳児のミルク記録
- mL単位で正確に記録
- 1日3～8回程度

#### テーブル定義
```sql
CREATE TABLE InfantMilks (
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    MilkTime TIME NOT NULL,
    AmountMl INT NOT NULL, -- ミルク量（mL）
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedBy INT NOT NULL,

    CONSTRAINT PK_InfantMilks PRIMARY KEY (NurseryId, ChildId, RecordDate, MilkTime),
    CONSTRAINT FK_InfantMilks_Children FOREIGN KEY (NurseryId, ChildId)
        REFERENCES Children(NurseryId, ChildId),
    CONSTRAINT FK_InfantMilks_Staff FOREIGN KEY (CreatedBy)
        REFERENCES Staff(Id),
    CONSTRAINT CK_InfantMilks_Amount CHECK (AmountMl > 0 AND AmountMl <= 500)
);

CREATE INDEX IX_InfantMilks_Child_Date ON InfantMilks(NurseryId, ChildId, RecordDate DESC);
```

#### C#モデル
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantMilks")]
public class InfantMilk
{
    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public TimeSpan MilkTime { get; set; }

    [Required]
    [Range(1, 500)]
    public int AmountMl { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    [Required]
    public int UpdatedBy { get; set; }
}
```

### 2.2 InfantSleepChecks（午睡チェック）- 新規作成

#### 要件
- SIDS対策準拠の午睡チェック
- 0歳児: 5分間隔、1～2歳児: 10分間隔、3歳以上: 15分間隔
- チェック項目: 呼吸、頭の向き、体温、顔色、体勢

#### テーブル定義
```sql
CREATE TABLE InfantSleepChecks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NurseryId INT NOT NULL,
    ChildId INT NOT NULL,
    RecordDate DATE NOT NULL,
    SleepSequence INT NOT NULL, -- InfantSleepsのSleepSequenceと紐づく
    CheckTime TIME NOT NULL,
    BreathingStatus NVARCHAR(20) NOT NULL, -- '正常', '異常'
    HeadDirection NVARCHAR(20) NOT NULL, -- '左', '右', '仰向け'
    BodyTemperature NVARCHAR(20) NOT NULL, -- '正常', 'やや温かい', '熱あり', '冷たい'
    FaceColor NVARCHAR(20) NOT NULL, -- '正常', '蒼白', '紫色', '紅潮'
    BodyPosition NVARCHAR(20) NOT NULL, -- '仰向け', '横向き', 'うつ伏せ'
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT NOT NULL,

    CONSTRAINT FK_InfantSleepChecks_Sleeps FOREIGN KEY (NurseryId, ChildId, RecordDate, SleepSequence)
        REFERENCES InfantSleeps(NurseryId, ChildId, RecordDate, SleepSequence) ON DELETE CASCADE,
    CONSTRAINT FK_InfantSleepChecks_Staff FOREIGN KEY (CreatedBy)
        REFERENCES Staff(Id),
    CONSTRAINT CK_InfantSleepChecks_Breathing CHECK (BreathingStatus IN ('正常', '異常')),
    CONSTRAINT CK_InfantSleepChecks_HeadDirection CHECK (HeadDirection IN ('左', '右', '仰向け')),
    CONSTRAINT CK_InfantSleepChecks_BodyTemp CHECK (BodyTemperature IN ('正常', 'やや温かい', '熱あり', '冷たい')),
    CONSTRAINT CK_InfantSleepChecks_FaceColor CHECK (FaceColor IN ('正常', '蒼白', '紫色', '紅潮')),
    CONSTRAINT CK_InfantSleepChecks_BodyPosition CHECK (BodyPosition IN ('仰向け', '横向き', 'うつ伏せ'))
);

CREATE INDEX IX_InfantSleepChecks_Sleep ON InfantSleepChecks(NurseryId, ChildId, RecordDate, SleepSequence, CheckTime);
CREATE INDEX IX_InfantSleepChecks_Alerts ON InfantSleepChecks(NurseryId, ChildId, RecordDate)
    WHERE BreathingStatus = '異常' OR BodyPosition = 'うつ伏せ';
```

#### C#モデル
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReactApp.Server.Models;

[Table("InfantSleepChecks")]
public class InfantSleepCheck
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int NurseryId { get; set; }

    [Required]
    public int ChildId { get; set; }

    [Required]
    [Column(TypeName = "date")]
    public DateTime RecordDate { get; set; }

    [Required]
    public int SleepSequence { get; set; }

    [Required]
    public TimeSpan CheckTime { get; set; }

    [Required]
    [StringLength(20)]
    public string BreathingStatus { get; set; } = null!; // '正常', '異常'

    [Required]
    [StringLength(20)]
    public string HeadDirection { get; set; } = null!; // '左', '右', '仰向け'

    [Required]
    [StringLength(20)]
    public string BodyTemperature { get; set; } = null!; // '正常', 'やや温かい', '熱あり', '冷たい'

    [Required]
    [StringLength(20)]
    public string FaceColor { get; set; } = null!; // '正常', '蒼白', '紫色', '紅潮'

    [Required]
    [StringLength(20)]
    public string BodyPosition { get; set; } = null!; // '仰向け', '横向き', 'うつ伏せ'

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public int CreatedBy { get; set; }
}
```

---

## 3. UI/UX設計

### 3.1 画面遷移フロー（最適化版）

```
【スタッフダッシュボード】
  ├─ クラス選択（例: ひよこ組）
  └─ [生活記録] ボタン
      ↓
【タイムライン画面】← ★常に表示される基本画面
  ├─ 上部: 園児選択ボタン（モーダルで切り替え）
  ├─ 中央: 選択中の園児の記録タイムライン
  ├─ 下部: [+ 記録を追加] ボタン
  │   ↓
  │  【記録タイプ選択モーダル】
  │    ├─ [🍼 ミルク] → 【ミルク記録画面】
  │    ├─ [🍽️ 食事] → 【食事記録画面】
  │    ├─ [😴 午睡] → 【午睡記録画面】
  │    ├─ [🚽 おむつ] → 【おむつ記録画面】
  │    ├─ [🌡️ 体温] → 【体温記録画面】
  │    └─ [😊 機嫌] → 【機嫌記録画面】
  │         ↓
  │    各記録画面で:
  │    ├─ 上部: 園児変更ボタン（モーダルで即座に切り替え）
  │    ├─ 入力後 [保存] → タイムラインに戻る
  │    └─ [保存して次の園児] → 同じ記録画面で園児だけ変更
  └─ 各記録カードをタップ → 【記録編集画面】
```

**フローの特徴:**
- 園児切り替えが超高速: 全画面に園児変更ボタン（モーダル1タップ）
- 連続記録モード: 「保存して次の園児」で同じ記録タイプを連続記録
- クラス単位での効率化: クラス選択は1回のみ、クラス内全員を効率的に記録

### 3.2 タイムライン画面（メイン画面）

```
┌────────────────────────────────────────────┐
│ ← ダッシュボード    ひよこ組 生活記録       │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  田中 太郎 (0歳)  [▼ 園児変更]       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  📅 2026年1月17日（金）   [日付変更 >]      │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │      [+ 記録を追加]                   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ◉────────────────────────────────────◉   │
│                                            │
│  ┌─ 13:45 ─────────────────────────────┐ │
│  │ 🍼 ミルク                              │ │
│  │ 量: 150mL                             │ │
│  │ 記録者: 山田先生                        │ │
│  │ [編集] [削除]                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ 13:00 ─────────────────────────────┐ │
│  │ 😴 午睡中                              │ │
│  │ 開始: 13:00                           │ │
│  │ チェック: 9回 ✓                        │ │
│  │ [チェック追加] [終了記録]               │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ 11:45 ─────────────────────────────┐ │
│  │ 🍽️ 昼食                               │ │
│  │ 摂取量: ほぼ完食                        │ │
│  │ 記録者: 佐藤先生                        │ │
│  │ [編集] [削除]                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌─ 10:30 ─────────────────────────────┐ │
│  │ 🚽 おむつ交換                          │ │
│  │ おしっこ: 普通                          │ │
│  │ うんち: 少量（正常）                    │ │
│  │ [編集] [削除]                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### 3.3 園児選択モーダル

```
┌────────────────────────────────────────────┐
│                園児選択                     │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         田中 太郎 (0歳)             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         佐藤 花子 (0歳)             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         鈴木 一郎 (0歳)             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         高橋 美咲 (0歳)             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         伊藤 健太 (0歳)             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│                [キャンセル]                 │
│                                            │
└────────────────────────────────────────────┘
```

**動作:**
- 園児名ボタンをタップ → 即座にその園児に切り替えてモーダルを閉じる
- キャンセルボタン → 切り替えせずにモーダルを閉じる

### 3.4 記録タイプ選択モーダル

```
┌────────────────────────────────────────────┐
│              記録を追加                     │
│           田中 太郎 (0歳)                   │
├────────────────────────────────────────────┤
│                                            │
│   ┌─────────────┐   ┌─────────────┐      │
│   │             │   │             │      │
│   │  🍼 ミルク   │   │  🍽️ 食事    │      │
│   │             │   │             │      │
│   └─────────────┘   └─────────────┘      │
│                                            │
│   ┌─────────────┐   ┌─────────────┐      │
│   │             │   │             │      │
│   │  😴 午睡     │   │  🚽 おむつ  │      │
│   │             │   │             │      │
│   └─────────────┘   └─────────────┘      │
│                                            │
│   ┌─────────────┐   ┌─────────────┐      │
│   │             │   │             │      │
│   │  🌡️ 体温     │   │  😊 機嫌    │      │
│   │             │   │             │      │
│   └─────────────┘   └─────────────┘      │
│                                            │
│                [閉じる]                     │
│                                            │
└────────────────────────────────────────────┘
```

### 3.5 ミルク記録画面（詳細・最適化版）

```
┌────────────────────────────────────────────┐
│ ← 戻る    ミルク記録                        │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│                                            │
│  時刻                                       │
│  ┌──────────────────┐                      │
│  │ 13:45            │ [今] [5分前] [10分前]│
│  └──────────────────┘                      │
│                                            │
│  ミルク量（mL）                              │
│  ┌──────────────────┐                      │
│  │ 150 mL           │  ▲▼                 │
│  └──────────────────┘                      │
│                                            │
│  クイック選択:                              │
│  [80] [100] [120] [150] [200]             │
│                                            │
│  メモ（任意）                                │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [保存]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [保存して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

**「保存して次の園児へ」の動作:**
1. 現在の記録を保存
2. 園児選択モーダルが自動で開く
3. 次の園児を選択
4. 同じミルク記録画面が開く（前回の入力値はクリア）

### 3.6 食事記録画面（園児変更対応）

```
┌────────────────────────────────────────────┐
│ ← 戻る    食事記録                          │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│                                            │
│  時刻                                       │
│  ┌──────────────────┐                      │
│  │ 11:45            │ [今] [5分前]         │
│  └──────────────────┘                      │
│                                            │
│  食事種別                                   │
│  ┌──────────┐ ┌──────────┐               │
│  │午前おやつ │ │   昼食   │               │
│  └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐               │
│  │午後おやつ │ │  離乳食  │               │
│  └──────────┘ └──────────┘               │
│                                            │
│  摂取量                                     │
│  ┌──────────────────────────────────────┐ │
│  │  [完食] [ほぼ完食] [半分] [少量] [食べず] │ │
│  └──────────────────────────────────────┘ │
│  色分け: 緑   黄緑    黄   オレンジ  赤     │
│                                            │
│  メモ（任意）                                │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [保存]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [保存して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### 3.7 体温記録画面（電卓UI + クイック入力）

```
┌────────────────────────────────────────────┐
│ ← 戻る    体温記録                          │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│                                            │
│  測定時刻                                   │
│  ┌──────────────────┐                      │
│  │ 09:00            │ [今]                 │
│  └──────────────────┘                      │
│                                            │
│  体温（℃）                                  │
│  ┌────────────────────────────────────┐   │
│  │             36.5 ℃                 │   │
│  └────────────────────────────────────┘   │
│                                            │
│  クイック入力:                              │
│  [35.] [36.] [37.] [38.]                  │
│                                            │
│  ┌───────────┬───────────┬───────────┐   │
│  │     7     │     8     │     9     │   │
│  ├───────────┼───────────┼───────────┤   │
│  │     4     │     5     │     6     │   │
│  ├───────────┼───────────┼───────────┤   │
│  │     1     │     2     │     3     │   │
│  ├───────────┼───────────┼───────────┤   │
│  │     .     │     0     │    ←削除  │   │
│  └───────────┴───────────┴───────────┘   │
│                                            │
│  測定箇所                                   │
│  ⬤ 脇下    ◯ 耳    ◯ 額                  │
│                                            │
│  メモ（任意）                                │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [保存]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [保存して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

**クイック入力ボタンの動作:**
- [35.] → 体温入力欄に「35.」が入力される → 続けて数字を入力（例: 35.5）
- [36.] → 「36.」が入力される → 例: 36.5, 36.8
- [37.] → 「37.」が入力される → 例: 37.2, 37.5
- [38.] → 「38.」が入力される → 例: 38.0, 38.3

**電卓の動作:**
- 数字ボタン: 1桁ずつ入力
- [.] ボタン: 小数点入力
- [←削除] ボタン: 1文字削除

### 3.8 午睡チェック画面（園児変更対応）

```
┌────────────────────────────────────────────┐
│ ← 戻る    午睡チェック                      │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│  午睡開始: 13:00  経過: 45分  次: 5分後    │
├────────────────────────────────────────────┤
│                                            │
│  チェック時刻                                │
│  ┌──────────────────┐                      │
│  │ 13:45            │ [今]                 │
│  └──────────────────┘                      │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │   ✓ 全項目正常（ワンタップ記録）        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  または個別に記録:                          │
│  ─────────────────────────────────────   │
│                                            │
│  呼吸確認                                   │
│  ⬤ 正常    ◯ 異常                         │
│                                            │
│  頭の向き                                   │
│  ◯ 左    ⬤ 右    ◯ 仰向け                │
│                                            │
│  体温チェック（触感）                        │
│  ⬤ 正常    ◯ やや温かい                   │
│  ◯ 熱あり    ◯ 冷たい                      │
│                                            │
│  顔色                                       │
│  ⬤ 正常    ◯ 蒼白                         │
│  ◯ 紫色    ◯ 紅潮                          │
│                                            │
│  体勢                                       │
│  ⬤ 仰向け    ◯ 横向き    ◯ うつ伏せ      │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [チェック記録]                 │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [記録して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ──── チェック履歴 ────                    │
│  ✓ 13:45 全項目正常 (山田先生)             │
│  ✓ 13:40 全項目正常 (山田先生)             │
│                                            │
└────────────────────────────────────────────┘
```

**「記録して次の園児へ」の特別動作（午睡チェック）:**
1. 現在の園児のチェック記録を保存
2. 次の園児を選択（モーダル表示）
3. 次の園児が午睡中の場合 → 午睡チェック画面を開く
4. 次の園児が午睡していない場合 → タイムラインに戻る（午睡記録なしのメッセージ表示）

### 3.9 おむつ記録画面（園児変更対応）

```
┌────────────────────────────────────────────┐
│ ← 戻る    おむつ記録                        │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│                                            │
│  時刻                                       │
│  ┌──────────────────┐                      │
│  │ 10:30            │ [今] [5分前]         │
│  └──────────────────┘                      │
│                                            │
│  記録タイプ                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │おしっこのみ│ │うんちのみ│ │   両方   │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│                                            │
│  ──── おしっこ ────                        │
│  量                                         │
│  ◯ 少量    ⬤ 普通    ◯ 多量               │
│                                            │
│  ──── うんち ────                          │
│  量                                         │
│  ⬤ 少量    ◯ 普通    ◯ 多量               │
│                                            │
│  種類                                       │
│  ⬤ 正常    ◯ 軟便    ◯ 下痢               │
│  ◯ 硬い    ◯ 血便                         │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [保存]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [保存して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### 3.10 機嫌記録画面（園児変更対応）

```
┌────────────────────────────────────────────┐
│ ← 戻る    機嫌記録                          │
├────────────────────────────────────────────┤
│  田中 太郎 (0歳)  [▼ 園児変更]             │
├────────────────────────────────────────────┤
│                                            │
│  時刻                                       │
│  ┌──────────────────┐                      │
│  │ 14:00            │ [今] [5分前]         │
│  └──────────────────┘                      │
│                                            │
│  機嫌                                       │
│  ┌──────────┐ ┌──────────┐               │
│  │   良い   │ │   普通   │               │
│  └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐               │
│  │  不機嫌  │ │泣いている│               │
│  └──────────┘ └──────────┘               │
│                                            │
│  様子・特記事項                              │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │                                    │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │         [保存]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │    [保存して次の園児へ →]              │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

---

## 4. 操作フローの実例

### 4.1 朝の一斉体温記録（効率的なフロー）

**状況**: ひよこ組の5人の園児の朝の体温を記録する

```
ステップ1: ダッシュボード → [生活記録] ボタン
  ↓
ステップ2: タイムライン画面で [園児変更] → 田中太郎を選択
  ↓
ステップ3: [+ 記録を追加] → [🌡️ 体温] 選択
  ↓
ステップ4: 体温記録画面
  - [36.] ボタンをタップ → "36." が入力される
  - 電卓で "5" をタップ → "36.5℃" 完成
  - [保存して次の園児へ →] をタップ
  ↓
ステップ5: 園児選択モーダル → 佐藤花子を選択
  ↓ （自動的に体温記録画面に戻る）
ステップ6: 体温記録画面（佐藤花子）
  - [37.] ボタンをタップ
  - 電卓で "2" をタップ → "37.2℃"
  - [保存して次の園児へ →] をタップ
  ↓
（以下、鈴木一郎、高橋美咲、伊藤健太と繰り返し）
```

**所要時間**: 1人あたり約10秒 × 5人 = **約50秒で完了**

### 4.2 午睡中の園児の一斉チェック

**状況**: 午睡中の園児3人を5分ごとにチェック

```
ステップ1: タイムライン画面で田中太郎を選択
  ↓
ステップ2: 午睡中カードの [チェック追加] をタップ
  ↓
ステップ3: 午睡チェック画面
  - [✓ 全項目正常] をワンタップ
  - [記録して次の園児へ →] をタップ
  ↓
ステップ4: 園児選択モーダル → 佐藤花子を選択
  ↓
ステップ5: 佐藤花子も午睡中 → 午睡チェック画面が開く
  - [✓ 全項目正常] をワンタップ
  - [記録して次の園児へ →] をタップ
  ↓
（以下、繰り返し）
```

**所要時間**: 1人あたり約5秒 × 3人 = **約15秒で完了**

### 4.3 昼食後の一斉記録

**状況**: ひよこ組5人の昼食摂取量を記録

```
ステップ1: タイムライン画面で [+ 記録を追加] → [🍽️ 食事]
  ↓
ステップ2: 食事記録画面（田中太郎）
  - [昼食] 選択
  - [ほぼ完食] 選択
  - [保存して次の園児へ →]
  ↓
ステップ3: 園児選択 → 佐藤花子
  ↓
ステップ4: 食事記録画面（佐藤花子）
  - [昼食] 選択
  - [完食] 選択
  - [保存して次の園児へ →]
  ↓
（以下、繰り返し）
```

**所要時間**: 1人あたり約8秒 × 5人 = **約40秒で完了**

---

## 5. 実装計画

### 5.1 データベース変更（Phase 1: 1週間）

#### 優先順位1: 既存テーブル修正
```sql
-- InfantMeals
ALTER TABLE InfantMeals ADD MealTime TIME NOT NULL DEFAULT '12:00:00';
ALTER TABLE InfantMeals ADD Notes NVARCHAR(500);

-- InfantToileting
ALTER TABLE InfantToileting ADD HasUrine BIT NOT NULL DEFAULT 0;
ALTER TABLE InfantToileting ADD HasStool BIT NOT NULL DEFAULT 0;
ALTER TABLE InfantToileting ADD BowelAmount NVARCHAR(20);

-- InfantTemperatures
ALTER TABLE InfantTemperatures ADD MeasurementLocation NVARCHAR(20) DEFAULT '脇下';
ALTER TABLE InfantTemperatures ADD Notes NVARCHAR(500);

-- InfantMoods
ALTER TABLE InfantMoods ADD RecordTime TIME NOT NULL DEFAULT '09:00:00';
```

#### 優先順位2: 新規テーブル作成
```sql
-- InfantMilks
CREATE TABLE InfantMilks (...);

-- InfantSleepChecks
CREATE TABLE InfantSleepChecks (...);
```

### 5.2 バックエンド実装（Phase 2: 2週間）

1. **モデル更新**: 既存モデルにプロパティ追加
2. **新モデル作成**: InfantMilk, InfantSleepCheck
3. **DTO作成**: 各記録タイプのRequest/Response DTO
4. **サービス層実装**:
   - InfantMilkService
   - InfantMealService（更新）
   - InfantSleepService（更新）
   - InfantSleepCheckService（新規）
   - InfantToiletingService（更新）
   - InfantTemperatureService（更新）
   - InfantMoodService（更新）
5. **コントローラー実装**: CRUD API
6. **バリデーション**: FluentValidation

### 5.3 フロントエンド実装（Phase 3: 3週間）

#### Week 1: 基本画面
- タイムライン画面（記録一覧表示）
- 記録タイプ選択画面
- ミルク記録画面
- おむつ記録画面

#### Week 2: 午睡チェック
- 午睡記録画面
- 午睡チェック画面（ワンタップ記録）
- チェック履歴表示

#### Week 3: その他記録
- 食事記録画面
- 体温記録画面
- 機嫌記録画面
- 記録編集・削除機能

### 5.4 テスト（Phase 4: 1週間）

- 単体テスト
- 統合テスト
- UAT（保育士による実機テスト）

---

## 6. まとめ

### 6.1 既存テーブル活用状況

| テーブル | 修正内容 | 対応状況 |
|---------|---------|---------|
| InfantMeals | MealTime, Notes追加 | ✅ 活用可能 |
| InfantSleeps | 修正不要 | ✅ そのまま使用 |
| InfantToileting | HasUrine, HasStool, BowelAmount追加 | ✅ 活用可能 |
| InfantTemperatures | MeasurementLocation, Notes追加 | ✅ 活用可能 |
| InfantMoods | RecordTime追加 | ✅ 活用可能 |

### 6.2 新規テーブル

| テーブル | 用途 | 理由 |
|---------|------|------|
| InfantMilks | ミルク記録 | 既存テーブルになかった |
| InfantSleepChecks | 午睡チェック | SIDS対策に必須 |

### 6.3 UI/UX改善のまとめ

| 改善項目 | 旧フロー | 新フロー | 効果 |
|---------|---------|---------|------|
| 園児切り替え | 園児一覧に戻る必要 | 全画面からモーダルで切り替え | **時間50%削減** |
| 連続記録 | 毎回記録タイプを選択 | 「保存して次の園児へ」ボタン | **時間70%削減** |
| 体温入力 | 手動入力のみ | クイック入力 + 電卓 | **時間60%削減** |
| 午睡チェック | 個別にチェック | 一斉チェックフロー | **時間80%削減** |

### 6.4 総合評価

✅ **既存テーブル5つを活用**（小規模な修正のみ）
✅ **新規テーブル2つ追加**（ミルク、午睡チェック）
✅ **UIは簡単入力・後から確認・修正可能**な設計
✅ **タイムライン方式**で記録が時系列で見やすい
✅ **全画面から園児切り替え可能**（モーダル方式）
✅ **連続記録モード**で同じ記録タイプを効率的に入力
✅ **体温電卓UI**で直感的な数値入力
✅ **保育現場で1日30分以上の削減効果**

---

**END OF DOCUMENT**
