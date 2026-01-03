# デスクトップアプリ 乳児生活記録 データマッピング仕様

## 1. 概要

スタッフアプリ(モバイル)の生活記録画面から取得したデータをデスクトップアプリの週次マトリックスビューに表示するためのデータマッピング仕様を定義します。

---

## 2. 各記録タイプのデータマッピング

### 2.1 体温 (InfantTemperatures)

**モバイルUI**:
- タブ: 青色の体温アイコン
- 測定タイミング選択: 午前 / 午後
- 園児選択: 複数選択可能、現在の体温表示あり
- 体温入力: 電卓UI (35. / 36. / 37. / 38. のボタン)

**データベース**:
```sql
MeasurementType:
  - 'Home': 家庭での朝の体温 (保護者入力、CreatedByType='Parent')
  - 'Morning': 園の午前の体温 (スタッフ入力、CreatedByType='Staff')
  - 'Afternoon': 園の午後の体温 (スタッフ入力、CreatedByType='Staff')

Temperature: DECIMAL(3, 1) -- 例: 36.5
MeasuredAt: DATETIME2 -- 測定日時
IsAbnormal: BIT -- 37.5℃以上で自動設定
```

**デスクトップ表示**:
```
家庭 > 体温: 36.5℃ (8:30) 🔒 (読取専用)
午前 > 体温: 36.8℃ (10:00) (編集可)
午後 > 体温: 36.7℃ (14:00) (編集可)
```

---

### 2.2 食事 (InfantMeals)

**モバイルUI**:
- タブ: オレンジ色の食事アイコン
- 食事種別選択: 午前おやつ / 昼食 / 午後おやつ
- 園児選択: 複数選択可能、全解除ボタンあり
- 食事量: 完食 / ほぼ完食 / 半分 / 少量 / 食べず (大きなボタン)

**データベース**:
```sql
MealType:
  - 'Breakfast': 午前おやつ
  - 'Lunch': 昼食
  - 'Snack': 午後おやつ

OverallAmount:
  - 'All': 完食
  - 'Most': ほぼ完食
  - 'Half': 半分
  - 'Little': 少量
  - 'None': 食べず
```

**デスクトップ表示**:
```
午前 > おやつ: 完食
午後 > 昼食: 半分
午後 > おやつ: ほぼ完食
```

---

### 2.3 昼寝 (InfantSleeps)

**モバイルUI**:
- タブ: 紫色の睡眠アイコン
- 園児選択: 複数選択、時間帯表示あり (例: 14:30-15:00)
- 入眠時刻: ドロップダウン (時・分)、「現在時刻」ボタン
- 起床時刻: ドロップダウン (時・分)、「現在時刻」ボタン
- 睡眠の質: ぐっすり / 普通 / 浅い / 寝ない (アイコン付きボタン)

**データベース**:
```sql
SleepSequence: INT DEFAULT 1 -- 同日に複数回昼寝する場合
StartTime: DATETIME2 -- 入眠時刻
EndTime: DATETIME2 -- 起床時刻
DurationMinutes: 計算列 -- DATEDIFF(MINUTE, StartTime, EndTime)

SleepQuality:
  - 'Deep': ぐっすり
  - 'Normal': 普通
  - 'Light': 浅い
  - 'Restless': 寝ない
```

**デスクトップ表示**:
```
午後 > 昼寝: 12:30-14:00
          (90分)
```

---

### 2.4 排泄 (InfantToileting)

**モバイルUI**:
- タブ: 緑色の排泄アイコン
- 園児選択: 単一選択のみ (おしっこ: 1回/うんち: 3回 のバッジ表示)
- 種別選択: おしっこ / うんち

**おしっこの場合**:
- おしっこの量: 少量 / 普通 / 多量 (選択ボタン)
- おむつ交換回数: ± ボタンで数値入力

**うんちの場合**:
- 種別: おしっこ / うんち (トグル)
- 便の状態: 普通 / 硬め / 軟便 / 下痢
- 便の色: 普通 / 緑色 / 白色 / 黒色 / 血便

**データベース**:
```sql
-- 1日1レコード (主キー: NurseryId, ChildId, RecordDate)

UrineAmount:
  - 'Little': 少量
  - 'Normal': 普通
  - 'Lot': 多量

BowelCondition:
  - 'Normal': 普通
  - 'Hard': 硬め
  - 'Soft': 軟便
  - 'Diarrhea': 下痢

BowelColor:
  - 'Normal': 普通 (茶色)
  - 'Green': 緑色
  - 'White': 白色
  - 'Black': 黒色
  - 'Bloody': 血便

DiaperChangeCount: INT -- 0～20回
```

**デスクトップ表示**:
```
排泄 > おしっこ: 普通
排泄 > うんち: 軟便/普通 (状態/色の形式)
排泄 > おむつ交換: 3回
```

**表示フォーマット関数**:
```typescript
// うんちの表示: 状態/色 の形式
function formatBowelCondition(condition: string, color: string): string {
  const conditionMap = {
    'Normal': '普通',
    'Hard': '硬め',
    'Soft': '軟便',
    'Diarrhea': '下痢'
  };

  const colorMap = {
    'Normal': '普通',
    'Green': '緑色',
    'White': '白色',
    'Black': '黒色',
    'Bloody': '血便'
  };

  return `${conditionMap[condition]}/${colorMap[color]}`;
}

// 例:
// formatBowelCondition('Soft', 'Normal') → "軟便/普通"
// formatBowelCondition('Normal', 'Black') → "普通/黒色"
```

---

### 2.5 機嫌 (InfantMoods)

**モバイルUI**:
- タブ: ピンク色の機嫌アイコン
- 園児選択: 複数選択可能、全解除ボタンあり
- 時間帯: 午前 / 午後 (トグル)
- 機嫌: 良い / 普通 / 悪い / 泣いている (顔アイコン付きボタン)

**データベース**:
```sql
MoodTime:
  - 'Morning': 午前
  - 'Afternoon': 午後

MoodState:
  - 'Good': 良い
  - 'Normal': 普通
  - 'Bad': 悪い
  - 'Crying': 泣いている

Notes: NVARCHAR(500) -- 備考 (オプション)
```

**デスクトップ表示**:
```
午前 > 機嫌: 良い
午後 > 機嫌: 普通
```

---

## 3. 週次マトリックステーブルの構造

### 3.1 縦軸 (行) の階層

```
【園児名】          ← 大項目 (rowspan=14)
  〈家庭〉          ← 中項目 (rowspan=2)
    体温           ← 小項目
    様子           ← 小項目
  〈午前〉          ← 中項目 (rowspan=3)
    体温           ← 小項目
    おやつ         ← 小項目
    機嫌           ← 小項目
  〈午後〉          ← 中項目 (rowspan=5)
    昼食           ← 小項目
    昼寝           ← 小項目
    体温           ← 小項目
    おやつ         ← 小項目
    機嫌           ← 小項目
  〈排泄〉          ← 中項目 (rowspan=3)
    おしっこ       ← 小項目
    うんち         ← 小項目
    おむつ交換     ← 小項目
```

**合計**: 1園児あたり14行

### 3.2 横軸 (列)

```
項目列 (固定) + 日付列7つ (日曜～土曜)
```

---

## 4. データ取得APIのレスポンス構造

```typescript
interface WeeklyRecordsData {
  weekStartDate: string; // "2026-01-04"
  weekEndDate: string;   // "2026-01-10"
  class: {
    classId: number;
    className: string;
    ageGroup: string;
  };
  children: ChildWeeklyRecord[];
}

interface ChildWeeklyRecord {
  childId: number;
  firstName: string;
  dailyRecords: {
    [date: string]: DailyRecord; // "2026-01-05": { ... }
  };
}

interface DailyRecord {
  home: {
    temperature?: {
      value: number;        // 36.5
      time: string;         // "08:30"
      isAbnormal: boolean;
      readonly: true;       // 保護者入力は読取専用
    };
    parentNote?: {
      text: string;         // "元気です。朝食はよく食べました。"
      readonly: true;
    };
  };

  morning: {
    temperature?: {
      value: number;
      time: string;
      isAbnormal: boolean;
      readonly: false;      // スタッフ入力は編集可
    };
    snack?: {
      amount: MealAmount;   // 'All', 'Most', 'Half', 'Little', 'None'
      readonly: false;
    };
    mood?: {
      state: MoodState;     // 'Good', 'Normal', 'Bad', 'Crying'
      notes?: string;
      readonly: false;
    };
  };

  afternoon: {
    lunch?: {
      amount: MealAmount;
      readonly: false;
    };
    sleep?: {
      start: string;        // "12:30"
      end: string;          // "14:00"
      duration: number;     // 90
      quality?: string;     // 'Deep', 'Normal', 'Light', 'Restless'
      readonly: false;
    };
    temperature?: {
      value: number;
      time: string;
      isAbnormal: boolean;
      readonly: false;
    };
    snack?: {
      amount: MealAmount;
      readonly: false;
    };
    mood?: {
      state: MoodState;
      notes?: string;
      readonly: false;
    };
  };

  toileting: {
    urine?: {
      amount: UrineAmount;  // 'Little', 'Normal', 'Lot'
      readonly: false;
    };
    bowel?: {
      condition: BowelCondition; // 'Normal', 'Hard', 'Soft', 'Diarrhea'
      color: BowelColor;         // 'Normal', 'Green', 'White', 'Black', 'Bloody'
      readonly: false;
    };
    diaperChangeCount?: {
      count: number;        // 3
      readonly: false;
    };
  };
}
```

---

## 5. 表示フォーマット関数一覧

### 5.1 体温

```typescript
function formatTemperature(temp?: TemperatureRecord): string {
  if (!temp) return '';
  return `${temp.value}℃ (${temp.time})`;
}
// 例: "36.5℃ (8:30)"
```

### 5.2 食事

```typescript
function formatMealAmount(amount?: string): string {
  const map: Record<string, string> = {
    'All': '完食',
    'Most': 'ほぼ完食',
    'Half': '半分',
    'Little': '少量',
    'None': '食べず'
  };
  return amount ? (map[amount] || amount) : '';
}
```

### 5.3 昼寝

```typescript
function formatSleep(sleep?: SleepRecord): string {
  if (!sleep) return '';
  const lines = [
    `${sleep.start}-${sleep.end}`,
    `(${sleep.duration}分)`
  ];
  return lines.join('\n');
}
// 例: "12:30-14:00\n(90分)"
```

### 5.4 排泄

```typescript
// おしっこ
function formatUrineAmount(amount?: string): string {
  const map: Record<string, string> = {
    'Little': '少量',
    'Normal': '普通',
    'Lot': '多量'
  };
  return amount ? (map[amount] || amount) : '';
}

// うんち (状態/色)
function formatBowelCondition(condition?: string, color?: string): string {
  if (!condition) return '';

  const conditionMap: Record<string, string> = {
    'Normal': '普通',
    'Hard': '硬め',
    'Soft': '軟便',
    'Diarrhea': '下痢'
  };

  const colorMap: Record<string, string> = {
    'Normal': '普通',
    'Green': '緑色',
    'White': '白色',
    'Black': '黒色',
    'Bloody': '血便'
  };

  const conditionText = conditionMap[condition] || condition;
  const colorText = colorMap[color || 'Normal'] || color || '普通';

  return `${conditionText}/${colorText}`;
}
// 例: "軟便/普通", "普通/黒色"

// おむつ交換
function formatDiaperChangeCount(count?: number): string {
  return count ? `${count}回` : '';
}
```

### 5.5 機嫌

```typescript
function formatMoodState(state?: string): string {
  const map: Record<string, string> = {
    'Good': '良い',
    'Normal': '普通',
    'Bad': '悪い',
    'Crying': '泣いている'
  };
  return state ? (map[state] || state) : '';
}
```

---

## 6. データ入力の制約

### 6.1 保護者入力データ (読取専用)
- **家庭の体温**: `CreatedByType='Parent'`
- **保護者からの様子**: `ParentMorningNote`
- デスクトップでは表示のみ、編集不可
- 背景色: 薄い黄色 (#FFFBEB)
- 🔒 アイコン表示

### 6.2 スタッフ入力データ (編集可)
- **午前・午後の体温、食事、機嫌、昼寝、排泄**
- デスクトップで編集可能
- 背景色: 白 (#FFFFFF)
- ホバー時: 薄い青背景 + 青枠表示

### 6.3 未入力セルの扱い
- 空セルには「未入力」とグレーで表示
- クリックでモーダルが開き、新規入力可能

---

## 7. 関連ドキュメント

- [要件定義書](infant-records-requirements.md)
- [UI設計書](infant-records-ui-spec.md)
- [データベース仕様書](infant-records-database-spec.md)
