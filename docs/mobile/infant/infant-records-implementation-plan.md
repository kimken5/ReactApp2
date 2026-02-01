# 乳児生活記録システム 実装計画

## ドキュメント情報
- **作成日**: 2026-01-17
- **対象**: 乳児生活記録システム（タイムライン方式）
- **前提**: テーブル設計完了、UI/UX設計完了

---

## 目次
1. [実装概要](#1-実装概要)
2. [Phase 1: データベース構築](#2-phase-1-データベース構築)
3. [Phase 2: バックエンド実装](#3-phase-2-バックエンド実装)
4. [Phase 3: フロントエンド実装](#4-phase-3-フロントエンド実装)
5. [Phase 4: テスト・検証](#5-phase-4-テスト検証)
6. [Phase 5: デプロイ・運用開始](#6-phase-5-デプロイ運用開始)

---

## 1. 実装概要

### 1.1 全体スケジュール

| Phase | 内容 | 期間 | 担当 |
|-------|------|------|------|
| Phase 1 | データベース構築 | 2日 | バックエンド |
| Phase 2 | バックエンド実装 | 2週間 | バックエンド |
| Phase 3 | フロントエンド実装 | 3週間 | フロントエンド |
| Phase 4 | テスト・検証 | 1週間 | 全員 |
| Phase 5 | デプロイ・運用開始 | 3日 | インフラ + 全員 |
| **合計** | | **約6週間** | |

### 1.2 主要マイルストーン

- **M1**: データベース構築完了（2日後）
- **M2**: バックエンドAPI完成（2週間後）
- **M3**: フロントエンド基本機能完成（3週間後）
- **M4**: UAT完了（4週間後）
- **M5**: 本番リリース（6週間後）

### 1.3 実装対象テーブル

#### 新規テーブル（2つ）
- InfantMilks（ミルク記録）
- InfantSleepChecks（午睡チェック）

#### 修正テーブル（4つ）
- InfantMeals（食事記録）- MealTime, Notes追加
- InfantToileting（排泄記録）- HasUrine, HasStool, BowelAmount追加
- InfantTemperatures（体温記録）- MeasurementLocation, Notes追加
- InfantMoods（機嫌記録）- RecordTime追加

#### 修正不要（1つ）
- InfantSleeps（午睡記録）- そのまま使用

---

## 2. Phase 1: データベース構築

### 2.1 作業内容

#### Day 1: テーブル作成
- [ ] 新規テーブル作成（InfantMilks、InfantSleepChecks）
- [ ] 既存テーブルへのカラム追加（InfantMeals、InfantToileting、InfantTemperatures、InfantMoods）
- [ ] インデックス作成
- [ ] 拡張プロパティ設定

#### Day 2: マイグレーションとテスト
- [ ] マイグレーションスクリプト実行
- [ ] データ整合性確認
- [ ] パフォーマンステスト（インデックス効果確認）

### 2.2 実行手順

#### 2.2.1 開発環境での実行

```bash
# 1. マイグレーションスクリプトの準備
cd ReactApp.Server
dotnet ef migrations add AddInfantRecordsSystem

# 2. データベース更新
dotnet ef database update

# 3. SQLスクリプト実行（必要に応じて）
# Azure Data Studio または SQL Server Management Studio で実行
# ファイル: docs/infant-records-create-tables.sql
```

#### 2.2.2 本番環境での実行

```bash
# 1. バックアップ取得
# Azure Portal から SQL Database のバックアップを確認

# 2. メンテナンスモード開始
# アプリケーションを一時停止

# 3. マイグレーション実行
# Azure Data Studio で接続してスクリプト実行

# 4. データ確認
# 各テーブルの作成状態を確認

# 5. アプリケーション再開
```

### 2.3 検証項目

- [ ] テーブルが正しく作成されているか
- [ ] 主キーが設定されているか
- [ ] インデックスが作成されているか
- [ ] デフォルト値が設定されているか
- [ ] 拡張プロパティ（コメント）が設定されているか

### 2.4 成果物

- マイグレーションファイル（C#）
- SQLスクリプト（`infant-records-create-tables.sql`）- 完成済み
- データベース検証レポート

---

## 3. Phase 2: バックエンド実装

### 3.1 Week 1: モデル・DTO・バリデーション

#### 3.1.1 C#モデル作成

**新規モデル（2つ）**

```bash
ReactApp.Server/Models/
  ├─ InfantMilk.cs          # 新規作成
  └─ InfantSleepCheck.cs    # 新規作成
```

**既存モデル修正（4つ）**

```bash
ReactApp.Server/Models/
  ├─ InfantMeal.cs          # MealTime, Notes追加
  ├─ InfantToileting.cs     # HasUrine, HasStool, BowelAmount追加
  ├─ InfantTemperature.cs   # MeasurementLocation, Notes追加
  └─ InfantMood.cs          # RecordTime追加
```

#### 3.1.2 DTO作成

```bash
ReactApp.Server/DTOs/InfantRecords/
  # ミルク記録
  ├─ InfantMilkRequestDto.cs
  ├─ InfantMilkResponseDto.cs

  # 食事記録
  ├─ InfantMealRequestDto.cs
  ├─ InfantMealResponseDto.cs

  # 午睡記録
  ├─ InfantSleepRequestDto.cs
  ├─ InfantSleepResponseDto.cs

  # 午睡チェック
  ├─ InfantSleepCheckRequestDto.cs
  ├─ InfantSleepCheckResponseDto.cs

  # おむつ記録
  ├─ InfantToiletingRequestDto.cs
  ├─ InfantToiletingResponseDto.cs

  # 体温記録
  ├─ InfantTemperatureRequestDto.cs
  ├─ InfantTemperatureResponseDto.cs

  # 機嫌記録
  ├─ InfantMoodRequestDto.cs
  ├─ InfantMoodResponseDto.cs

  # タイムライン用
  └─ InfantTimelineDto.cs
```

#### 3.1.3 バリデーション作成

```bash
ReactApp.Server/Validators/InfantRecords/
  ├─ InfantMilkRequestValidator.cs
  ├─ InfantMealRequestValidator.cs
  ├─ InfantSleepRequestValidator.cs
  ├─ InfantSleepCheckRequestValidator.cs
  ├─ InfantToiletingRequestValidator.cs
  ├─ InfantTemperatureRequestValidator.cs
  └─ InfantMoodRequestValidator.cs
```

**バリデーションルール例（InfantMilkRequestValidator）:**

```csharp
public class InfantMilkRequestValidator : AbstractValidator<InfantMilkRequestDto>
{
    public InfantMilkRequestValidator()
    {
        RuleFor(x => x.AmountMl)
            .GreaterThan(0).WithMessage("ミルク量は1mL以上である必要があります")
            .LessThanOrEqualTo(500).WithMessage("ミルク量は500mL以下である必要があります");

        RuleFor(x => x.MilkTime)
            .NotEmpty().WithMessage("ミルク時刻は必須です");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("メモは500文字以内で入力してください");
    }
}
```

### 3.2 Week 2: サービス層・コントローラー実装

#### 3.2.1 サービスインターフェース

```bash
ReactApp.Server/Services/
  ├─ IInfantMilkService.cs
  ├─ IInfantMealService.cs
  ├─ IInfantSleepService.cs
  ├─ IInfantSleepCheckService.cs
  ├─ IInfantToiletingService.cs
  ├─ IInfantTemperatureService.cs
  ├─ IInfantMoodService.cs
  └─ IInfantTimelineService.cs  # タイムライン統合用
```

#### 3.2.2 サービス実装

```bash
ReactApp.Server/Services/
  ├─ InfantMilkService.cs
  ├─ InfantMealService.cs
  ├─ InfantSleepService.cs
  ├─ InfantSleepCheckService.cs
  ├─ InfantToiletingService.cs
  ├─ InfantTemperatureService.cs
  ├─ InfantMoodService.cs
  └─ InfantTimelineService.cs
```

**主要メソッド（全サービス共通）:**

- `GetByChildAndDateAsync(int nurseryId, int childId, DateTime date)` - 特定日の記録取得
- `CreateAsync(RequestDto dto)` - 記録作成
- `UpdateAsync(int id, RequestDto dto)` - 記録更新
- `DeleteAsync(int id)` - 記録削除
- `GetTimelineAsync(int nurseryId, int childId, DateTime date)` - タイムライン取得（InfantTimelineServiceのみ）

**午睡チェックサービスの特別メソッド:**

- `GetChecksByDateAndSequenceAsync(int nurseryId, int childId, DateTime date, int sleepSequence)` - 特定午睡のチェック一覧取得
- `CreateCheckAsync(InfantSleepCheckRequestDto dto)` - 午睡チェック記録作成
- `GetAlertChecksAsync(int nurseryId, DateTime date)` - 異常アラートチェック一覧取得

#### 3.2.3 コントローラー作成

```bash
ReactApp.Server/Controllers/
  ├─ InfantMilksController.cs
  ├─ InfantMealsController.cs
  ├─ InfantSleepsController.cs
  ├─ InfantSleepChecksController.cs
  ├─ InfantToiletingController.cs
  ├─ InfantTemperaturesController.cs
  ├─ InfantMoodsController.cs
  └─ InfantTimelinesController.cs
```

**APIエンドポイント設計:**

```
# ミルク記録
GET    /api/infant-milks/{childId}/{date}
POST   /api/infant-milks
PUT    /api/infant-milks/{id}
DELETE /api/infant-milks/{id}

# 食事記録
GET    /api/infant-meals/{childId}/{date}
POST   /api/infant-meals
PUT    /api/infant-meals/{id}
DELETE /api/infant-meals/{id}

# 午睡記録
GET    /api/infant-sleeps/{childId}/{date}
POST   /api/infant-sleeps
PUT    /api/infant-sleeps/{id}
DELETE /api/infant-sleeps/{id}

# 午睡チェック
GET    /api/infant-sleep-checks/{childId}/{date}/{sleepSequence}
POST   /api/infant-sleep-checks
GET    /api/infant-sleep-checks/alerts/{nurseryId}/{date}

# おむつ記録
GET    /api/infant-toileting/{childId}/{date}
POST   /api/infant-toileting
PUT    /api/infant-toileting/{id}
DELETE /api/infant-toileting/{id}

# 体温記録
GET    /api/infant-temperatures/{childId}/{date}
POST   /api/infant-temperatures
PUT    /api/infant-temperatures/{id}
DELETE /api/infant-temperatures/{id}

# 機嫌記録
GET    /api/infant-moods/{childId}/{date}
POST   /api/infant-moods
PUT    /api/infant-moods/{id}
DELETE /api/infant-moods/{id}

# タイムライン（全記録統合）
GET    /api/infant-timelines/{childId}/{date}
```

#### 3.2.4 DbContext更新

```csharp
// ReactApp.Server/Data/KindergartenDbContext.cs

public DbSet<InfantMilk> InfantMilks { get; set; }
public DbSet<InfantSleepCheck> InfantSleepChecks { get; set; }

// OnModelCreatingメソッドで navigation properties を ignore
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... 既存のコード ...

    // InfantMilks
    modelBuilder.Entity<InfantMilk>()
        .Ignore(e => e.Nursery)
        .Ignore(e => e.Child)
        .Ignore(e => e.Creator)
        .Ignore(e => e.Updater);

    // InfantSleepChecks
    modelBuilder.Entity<InfantSleepCheck>()
        .Ignore(e => e.Nursery)
        .Ignore(e => e.Child)
        .Ignore(e => e.InfantSleep)
        .Ignore(e => e.Creator);
}
```

### 3.3 実装優先順位

#### 優先度1（Week 1前半）
1. InfantMilks（ミルク記録）- 最も単純な構造
2. InfantMeals（食事記録）- 既存テーブル修正
3. InfantTemperatures（体温記録）- 既存テーブル修正

#### 優先度2（Week 1後半）
4. InfantToileting（おむつ記録）- 既存テーブル修正
5. InfantMoods（機嫌記録）- 既存テーブル修正

#### 優先度3（Week 2）
6. InfantSleeps（午睡記録）- 既存テーブルそのまま
7. InfantSleepChecks（午睡チェック）- 複雑な構造
8. InfantTimeline（タイムライン統合）- 全記録を統合

### 3.4 成果物

- [ ] C#モデル（2新規 + 4修正）
- [ ] DTO（7種類 × 2 + タイムライン）
- [ ] バリデータ（7種類）
- [ ] サービスインターフェース（8種類）
- [ ] サービス実装（8種類）
- [ ] コントローラー（8種類）
- [ ] DbContext更新
- [ ] APIドキュメント（Swagger）

---

## 4. Phase 3: フロントエンド実装

### 4.1 Week 1: 基本画面・共通コンポーネント

#### 4.1.1 ディレクトリ構成

```bash
reactapp.client/src/
  ├─ components/
  │   └─ staff/
  │       └─ infantRecords/
  │           ├─ InfantTimeline.tsx           # タイムライン画面（メイン）
  │           ├─ ChildSelectorModal.tsx       # 園児選択モーダル
  │           ├─ RecordTypeSelector.tsx       # 記録タイプ選択モーダル
  │           ├─ InfantMilkForm.tsx          # ミルク記録フォーム
  │           ├─ InfantMealForm.tsx          # 食事記録フォーム
  │           ├─ InfantSleepForm.tsx         # 午睡記録フォーム
  │           ├─ InfantSleepCheckForm.tsx    # 午睡チェックフォーム
  │           ├─ InfantToiletingForm.tsx     # おむつ記録フォーム
  │           ├─ InfantTemperatureForm.tsx   # 体温記録フォーム
  │           ├─ InfantMoodForm.tsx          # 機嫌記録フォーム
  │           ├─ TemperatureCalculator.tsx   # 体温電卓UI
  │           └─ TimelineCard.tsx            # タイムラインカード
  │
  ├─ contexts/
  │   └─ InfantRecordContext.tsx             # 状態管理
  │
  ├─ hooks/
  │   └─ useInfantRecords.ts                 # カスタムフック
  │
  ├─ services/
  │   └─ infantRecordService.ts              # API呼び出し
  │
  └─ types/
      └─ infantRecords.ts                    # TypeScript型定義
```

#### 4.1.2 型定義

```typescript
// reactapp.client/src/types/infantRecords.ts

export interface InfantMilk {
  nurseryId: number;
  childId: number;
  recordDate: string;
  milkTime: string;
  amountMl: number;
  notes?: string;
  createdAt: string;
  createdBy: number;
}

export interface InfantMeal {
  nurseryId: number;
  childId: number;
  recordDate: string;
  mealTime: string;
  mealType: 'MorningSnack' | 'Lunch' | 'AfternoonSnack' | 'BabyFood';
  overallAmount?: 'All' | 'Most' | 'Half' | 'Little' | 'None';
  notes?: string;
  // ...
}

export interface InfantSleepCheck {
  id: number;
  nurseryId: number;
  childId: number;
  recordDate: string;
  sleepSequence: number;
  checkTime: string;
  breathingStatus: 'Normal' | 'Abnormal';
  headDirection: 'Left' | 'Right' | 'FaceUp';
  bodyTemperature: 'Normal' | 'SlightlyWarm' | 'Cold';
  faceColor: 'Normal' | 'Pale' | 'Purple';
  bodyPosition: 'OnBack' | 'OnSide' | 'FaceDown';
  // ...
}

export interface InfantTimelineItem {
  time: string;
  type: 'Milk' | 'Meal' | 'Sleep' | 'Toileting' | 'Temperature' | 'Mood';
  data: any;
  icon: string;
}

export interface InfantRecordState {
  selectedClass: Class | null;
  selectedChild: Child | null;
  children: Child[];
  currentRecordType: RecordType | null;
  timelineItems: InfantTimelineItem[];
  loading: boolean;
  error: string | null;
}
```

#### 4.1.3 APIサービス

```typescript
// reactapp.client/src/services/infantRecordService.ts

export const infantRecordService = {
  // タイムライン取得
  async getTimeline(childId: number, date: string): Promise<InfantTimelineItem[]> {
    const response = await api.get(`/api/infant-timelines/${childId}/${date}`);
    return response.data;
  },

  // ミルク記録
  async createMilk(data: InfantMilkRequest): Promise<InfantMilk> {
    const response = await api.post('/api/infant-milks', data);
    return response.data;
  },

  async updateMilk(id: number, data: InfantMilkRequest): Promise<InfantMilk> {
    const response = await api.put(`/api/infant-milks/${id}`, data);
    return response.data;
  },

  async deleteMilk(id: number): Promise<void> {
    await api.delete(`/api/infant-milks/${id}`);
  },

  // 食事記録
  async createMeal(data: InfantMealRequest): Promise<InfantMeal> {
    const response = await api.post('/api/infant-meals', data);
    return response.data;
  },

  // 午睡チェック
  async createSleepCheck(data: InfantSleepCheckRequest): Promise<InfantSleepCheck> {
    const response = await api.post('/api/infant-sleep-checks', data);
    return response.data;
  },

  async getSleepChecks(childId: number, date: string, sleepSequence: number): Promise<InfantSleepCheck[]> {
    const response = await api.get(`/api/infant-sleep-checks/${childId}/${date}/${sleepSequence}`);
    return response.data;
  },

  // ... 他の記録タイプ
};
```

#### 4.1.4 Context & Hook

```typescript
// reactapp.client/src/contexts/InfantRecordContext.tsx

export const InfantRecordContext = createContext<{
  state: InfantRecordState;
  actions: {
    setSelectedChild: (child: Child) => void;
    setSelectedClass: (classInfo: Class) => void;
    loadTimeline: (childId: number, date: string) => Promise<void>;
    addRecord: (type: RecordType, data: any) => Promise<void>;
    updateRecord: (type: RecordType, id: number, data: any) => Promise<void>;
    deleteRecord: (type: RecordType, id: number) => Promise<void>;
  };
} | undefined>(undefined);

export const InfantRecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(infantRecordReducer, initialState);

  const actions = {
    setSelectedChild: (child: Child) => {
      dispatch({ type: 'SET_SELECTED_CHILD', payload: child });
    },

    loadTimeline: async (childId: number, date: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const timeline = await infantRecordService.getTimeline(childId, date);
        dispatch({ type: 'SET_TIMELINE', payload: timeline });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // ...
  };

  return (
    <InfantRecordContext.Provider value={{ state, actions }}>
      {children}
    </InfantRecordContext.Provider>
  );
};
```

### 4.2 Week 2: 記録フォーム実装（基本）

#### 4.2.1 ミルク記録フォーム

```tsx
// reactapp.client/src/components/staff/infantRecords/InfantMilkForm.tsx

export const InfantMilkForm: React.FC<{
  selectedChild: Child;
  onSave: (data: InfantMilkRequest) => Promise<void>;
  onSaveAndNext: (data: InfantMilkRequest) => Promise<void>;
  onChildChange: () => void;
}> = ({ selectedChild, onSave, onSaveAndNext, onChildChange }) => {
  const [formData, setFormData] = useState<InfantMilkRequest>({
    milkTime: getCurrentTime(),
    amountMl: 150,
    notes: '',
  });

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">ミルク記録</h2>
        <button onClick={onChildChange} className="text-blue-600">
          {selectedChild.name} ({selectedChild.age}歳) ▼ 園児変更
        </button>
      </div>

      {/* 時刻入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">時刻</label>
        <input
          type="time"
          value={formData.milkTime}
          onChange={(e) => setFormData({ ...formData, milkTime: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={() => setMilkTimeNow()} className="btn-secondary">今</button>
          <button onClick={() => setMilkTime5MinAgo()} className="btn-secondary">5分前</button>
          <button onClick={() => setMilkTime10MinAgo()} className="btn-secondary">10分前</button>
        </div>
      </div>

      {/* ミルク量入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">ミルク量（mL）</label>
        <input
          type="number"
          value={formData.amountMl}
          onChange={(e) => setFormData({ ...formData, amountMl: parseInt(e.target.value) })}
          className="w-full border rounded px-3 py-2"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={() => setAmount(80)} className="btn-secondary">80</button>
          <button onClick={() => setAmount(100)} className="btn-secondary">100</button>
          <button onClick={() => setAmount(120)} className="btn-secondary">120</button>
          <button onClick={() => setAmount(150)} className="btn-secondary">150</button>
          <button onClick={() => setAmount(200)} className="btn-secondary">200</button>
        </div>
      </div>

      {/* メモ */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">メモ（任意）</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      {/* 保存ボタン */}
      <button onClick={() => onSave(formData)} className="w-full btn-primary mb-2">
        保存
      </button>
      <button onClick={() => onSaveAndNext(formData)} className="w-full btn-secondary">
        保存して次の園児へ →
      </button>
    </div>
  );
};
```

#### 4.2.2 体温記録フォーム（電卓UI）

```tsx
// reactapp.client/src/components/staff/infantRecords/InfantTemperatureForm.tsx

export const InfantTemperatureForm: React.FC = () => {
  const [temperature, setTemperature] = useState<string>('');

  const handleQuickInput = (prefix: string) => {
    setTemperature(prefix);
  };

  const handleNumberInput = (digit: string) => {
    setTemperature(prev => prev + digit);
  };

  const handleDecimal = () => {
    if (!temperature.includes('.')) {
      setTemperature(prev => prev + '.');
    }
  };

  const handleDelete = () => {
    setTemperature(prev => prev.slice(0, -1));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* ... ヘッダー ... */}

      {/* 体温表示 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">体温（℃）</label>
        <input
          type="text"
          value={temperature}
          readOnly
          className="w-full border rounded px-3 py-2 text-center text-2xl font-bold"
        />
      </div>

      {/* クイック入力 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleQuickInput('35.')} className="flex-1 btn-secondary">35.</button>
        <button onClick={() => handleQuickInput('36.')} className="flex-1 btn-secondary">36.</button>
        <button onClick={() => handleQuickInput('37.')} className="flex-1 btn-secondary">37.</button>
        <button onClick={() => handleQuickInput('38.')} className="flex-1 btn-secondary">38.</button>
      </div>

      {/* 電卓 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num.toString())}
            className="h-12 btn-secondary text-xl"
          >
            {num}
          </button>
        ))}
        <button onClick={handleDecimal} className="h-12 btn-secondary text-xl">.</button>
        <button onClick={() => handleNumberInput('0')} className="h-12 btn-secondary text-xl">0</button>
        <button onClick={handleDelete} className="h-12 btn-secondary text-xl">←削除</button>
      </div>

      {/* 測定箇所 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">測定箇所</label>
        <div className="flex gap-2">
          <button className="flex-1 btn-secondary">脇下</button>
          <button className="flex-1 btn-outline">耳</button>
          <button className="flex-1 btn-outline">額</button>
        </div>
      </div>

      {/* ... 保存ボタン ... */}
    </div>
  );
};
```

### 4.3 Week 3: 午睡チェック・タイムライン統合

#### 4.3.1 午睡チェックフォーム

```tsx
// reactapp.client/src/components/staff/infantRecords/InfantSleepCheckForm.tsx

export const InfantSleepCheckForm: React.FC = () => {
  const [isAllNormal, setIsAllNormal] = useState(true);
  const [checkData, setCheckData] = useState<InfantSleepCheckRequest>({
    checkTime: getCurrentTime(),
    breathingStatus: 'Normal',
    headDirection: 'Right',
    bodyTemperature: 'Normal', // 'Normal' | 'SlightlyWarm' | 'Hot' | 'Cold'
    faceColor: 'Normal', // 'Normal' | 'Pale' | 'Purple' | 'Flushed'
    bodyPosition: 'OnBack',
  });

  const handleAllNormalClick = async () => {
    // 全項目正常でワンタップ記録
    const normalData: InfantSleepCheckRequest = {
      checkTime: getCurrentTime(),
      breathingStatus: 'Normal',
      headDirection: 'FaceUp',
      bodyTemperature: 'Normal', // 正常
      faceColor: 'Normal', // 正常
      bodyPosition: 'OnBack',
    };
    await onSave(normalData);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* ... ヘッダー（午睡開始時刻、経過時間、次のチェック時刻） ... */}

      {/* ワンタップ記録 */}
      <button
        onClick={handleAllNormalClick}
        className="w-full btn-primary mb-4 text-lg py-3"
      >
        ✓ 全項目正常（ワンタップ記録）
      </button>

      <div className="text-center text-sm text-gray-500 mb-4">
        または個別に記録:
      </div>

      {/* 個別チェック項目 */}
      <div className="space-y-4">
        {/* 呼吸確認 */}
        <div>
          <label className="block text-sm font-medium mb-2">呼吸確認</label>
          <div className="flex gap-2">
            <button className={checkData.breathingStatus === 'Normal' ? 'btn-primary' : 'btn-outline'}>
              正常
            </button>
            <button className={checkData.breathingStatus === 'Abnormal' ? 'btn-danger' : 'btn-outline'}>
              異常
            </button>
          </div>
        </div>

        {/* 頭の向き */}
        <div>
          <label className="block text-sm font-medium mb-2">頭の向き</label>
          <div className="flex gap-2">
            <button className="btn-outline">左</button>
            <button className="btn-primary">右</button>
            <button className="btn-outline">仰向け</button>
          </div>
        </div>

        {/* ... 他のチェック項目 ... */}
      </div>

      {/* 保存ボタン */}
      <button onClick={() => onSave(checkData)} className="w-full btn-primary mt-4">
        チェック記録
      </button>
      <button onClick={() => onSaveAndNext(checkData)} className="w-full btn-secondary mt-2">
        記録して次の園児へ →
      </button>

      {/* チェック履歴 */}
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">チェック履歴</h3>
        <div className="space-y-2">
          <div className="text-sm">✓ 13:45 全項目正常 (山田先生)</div>
          <div className="text-sm">✓ 13:40 全項目正常 (山田先生)</div>
        </div>
      </div>
    </div>
  );
};
```

#### 4.3.2 タイムライン画面

```tsx
// reactapp.client/src/components/staff/infantRecords/InfantTimeline.tsx

export const InfantTimeline: React.FC = () => {
  const { state, actions } = useInfantRecord();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (state.selectedChild) {
      actions.loadTimeline(state.selectedChild.id, formatDate(selectedDate));
    }
  }, [state.selectedChild, selectedDate]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-blue-600">
          ← ダッシュボード
        </button>
        <h1 className="text-xl font-bold">ひよこ組 生活記録</h1>
      </div>

      {/* 園児選択 */}
      <div className="mb-4 p-3 bg-white rounded shadow">
        <button
          onClick={() => setShowChildSelector(true)}
          className="w-full flex items-center justify-between"
        >
          <span className="font-medium">
            {state.selectedChild?.name} ({state.selectedChild?.age}歳)
          </span>
          <span className="text-blue-600">▼ 園児変更</span>
        </button>
      </div>

      {/* 日付選択 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg">📅 {formatDateJa(selectedDate)}</span>
        <button className="text-blue-600">日付変更 &gt;</button>
      </div>

      {/* 記録追加ボタン */}
      <button
        onClick={() => setShowRecordTypeSelector(true)}
        className="w-full btn-primary mb-4"
      >
        + 記録を追加
      </button>

      {/* タイムライン */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

        <div className="space-y-4">
          {state.timelineItems.map((item, index) => (
            <TimelineCard
              key={index}
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      </div>

      {/* モーダル */}
      {showChildSelector && (
        <ChildSelectorModal
          children={state.children}
          selectedChild={state.selectedChild}
          onSelect={handleChildSelect}
          onClose={() => setShowChildSelector(false)}
        />
      )}

      {showRecordTypeSelector && (
        <RecordTypeSelector
          onSelect={handleRecordTypeSelect}
          onClose={() => setShowRecordTypeSelector(false)}
        />
      )}
    </div>
  );
};
```

### 4.4 実装優先順位（フロントエンド）

#### Week 1
- [ ] タイムライン画面（基本レイアウト）
- [ ] 園児選択モーダル
- [ ] 記録タイプ選択モーダル
- [ ] ミルク記録フォーム
- [ ] 食事記録フォーム

#### Week 2
- [ ] おむつ記録フォーム
- [ ] 体温記録フォーム（電卓UI）
- [ ] 機嫌記録フォーム

#### Week 3
- [ ] 午睡記録フォーム
- [ ] 午睡チェックフォーム（ワンタップ記録）
- [ ] タイムライン統合（全記録表示）
- [ ] 記録編集・削除機能

### 4.5 成果物

- [ ] React コンポーネント（15種類以上）
- [ ] TypeScript 型定義
- [ ] Context & Hook
- [ ] API サービス
- [ ] CSS スタイル（Tailwind CSS）

---

## 5. Phase 4: テスト・検証

### 5.1 単体テスト

#### 5.1.1 バックエンド単体テスト

```bash
ReactApp.Server.Tests/
  ├─ Services/
  │   ├─ InfantMilkServiceTests.cs
  │   ├─ InfantMealServiceTests.cs
  │   ├─ InfantSleepServiceTests.cs
  │   ├─ InfantSleepCheckServiceTests.cs
  │   ├─ InfantToiletingServiceTests.cs
  │   ├─ InfantTemperatureServiceTests.cs
  │   ├─ InfantMoodServiceTests.cs
  │   └─ InfantTimelineServiceTests.cs
  │
  └─ Validators/
      ├─ InfantMilkRequestValidatorTests.cs
      └─ ... 他のバリデータテスト
```

**テストケース例:**

```csharp
[Fact]
public async Task CreateMilk_ValidData_ReturnsCreatedMilk()
{
    // Arrange
    var request = new InfantMilkRequestDto
    {
        NurseryId = 1,
        ChildId = 1,
        RecordDate = DateTime.Today,
        MilkTime = new TimeSpan(10, 0, 0),
        AmountMl = 150
    };

    // Act
    var result = await _service.CreateAsync(request);

    // Assert
    Assert.NotNull(result);
    Assert.Equal(150, result.AmountMl);
}

[Fact]
public async Task CreateMilk_InvalidAmount_ThrowsValidationException()
{
    // Arrange
    var request = new InfantMilkRequestDto
    {
        AmountMl = -10 // 無効な値
    };

    // Act & Assert
    await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(request));
}
```

#### 5.1.2 フロントエンド単体テスト

```bash
reactapp.client/src/
  ├─ components/staff/infantRecords/__tests__/
  │   ├─ InfantTimeline.test.tsx
  │   ├─ InfantMilkForm.test.tsx
  │   ├─ InfantTemperatureForm.test.tsx
  │   └─ ... 他のコンポーネントテスト
  │
  └─ services/__tests__/
      └─ infantRecordService.test.ts
```

### 5.2 統合テスト

#### 5.2.1 API統合テスト

```bash
# Postman または REST Client で実行
GET /api/infant-timelines/1/2026-01-17
POST /api/infant-milks
PUT /api/infant-milks/1
DELETE /api/infant-milks/1
```

#### 5.2.2 E2Eテスト（Playwright）

```bash
tests/e2e/
  └─ infantRecords/
      ├─ timeline.spec.ts
      ├─ milkRecord.spec.ts
      ├─ sleepCheck.spec.ts
      └─ childSwitch.spec.ts
```

**E2Eテストシナリオ例:**

```typescript
// tests/e2e/infantRecords/milkRecord.spec.ts

test('ミルク記録の作成から削除までのフロー', async ({ page }) => {
  // 1. ログイン
  await page.goto('/staff/login');
  await page.fill('input[name="phone"]', '09012345678');
  await page.click('button[type="submit"]');

  // 2. タイムライン画面に移動
  await page.click('text=生活記録');

  // 3. 園児選択
  await page.click('text=園児変更');
  await page.click('text=田中 太郎');

  // 4. ミルク記録追加
  await page.click('text=+ 記録を追加');
  await page.click('text=🍼 ミルク');

  // 5. フォーム入力
  await page.fill('input[type="number"]', '150');
  await page.click('button:has-text("保存")');

  // 6. タイムラインに表示されることを確認
  await expect(page.locator('text=150mL')).toBeVisible();

  // 7. 削除
  await page.click('button:has-text("削除")');
  await page.click('button:has-text("削除する")');

  // 8. 削除されたことを確認
  await expect(page.locator('text=150mL')).not.toBeVisible();
});
```

### 5.3 UAT（ユーザー受け入れテスト）

#### 5.3.1 テストシナリオ

**シナリオ1: 朝の一斉体温記録**
1. クラス選択（ひよこ組）
2. 生活記録ボタンをタップ
3. 園児選択（田中太郎）
4. 体温記録を選択
5. [36.] → [5] → 36.5℃
6. 「保存して次の園児へ」をタップ
7. 次の園児（佐藤花子）を選択
8. [37.] → [2] → 37.2℃
9. 5人分繰り返し

**シナリオ2: 午睡中の一斉チェック**
1. タイムライン画面で午睡中の園児を選択
2. 午睡カードの「チェック追加」をタップ
3. 「✓ 全項目正常」をワンタップ
4. 「記録して次の園児へ」をタップ
5. 次の午睡中の園児を選択
6. 3人分繰り返し

**シナリオ3: 昼食後の一斉記録**
1. 食事記録を選択
2. [昼食] → [ほぼ完食]
3. 「保存して次の園児へ」
4. 5人分繰り返し

#### 5.3.2 検証項目

- [ ] 操作性（タップしやすさ、反応速度）
- [ ] 園児切り替えのスムーズさ
- [ ] 連続記録モードの効率性
- [ ] 体温電卓UIの使いやすさ
- [ ] タイムライン表示の見やすさ
- [ ] エラーメッセージの適切さ
- [ ] データの正確性

### 5.4 パフォーマンステスト

#### 5.4.1 負荷テスト

```bash
# Apache JMeter または k6 で実行
- 同時接続数: 50人
- タイムライン取得: 1秒以内
- 記録作成: 0.5秒以内
```

#### 5.4.2 レスポンス時間目標

| API | 目標レスポンス時間 |
|-----|------------------|
| GET /api/infant-timelines/{childId}/{date} | < 1秒 |
| POST /api/infant-milks | < 0.5秒 |
| POST /api/infant-sleep-checks | < 0.5秒 |
| GET /api/infant-sleep-checks/alerts/{nurseryId}/{date} | < 1秒 |

### 5.5 成果物

- [ ] 単体テストレポート（カバレッジ80%以上）
- [ ] 統合テストレポート
- [ ] E2Eテストレポート
- [ ] UATテストレポート
- [ ] パフォーマンステストレポート
- [ ] バグレポート・修正記録

---

## 6. Phase 5: デプロイ・運用開始

### 6.1 デプロイ手順

#### 6.1.1 ステージング環境デプロイ

```bash
# 1. ビルド
cd ReactApp.Server
dotnet publish -c Release -o ./publish

cd ../reactapp.client
npm run build

# 2. Azure App Service へデプロイ
az webapp deployment source config-zip \
  --resource-group <resource-group> \
  --name <app-name-staging> \
  --src ./publish.zip

# 3. データベースマイグレーション実行
dotnet ef database update --connection "<staging-connection-string>"

# 4. 動作確認
curl https://<app-name-staging>.azurewebsites.net/health
```

#### 6.1.2 本番環境デプロイ

```bash
# 1. メンテナンスモード開始
# Azure Portal でアプリケーション一時停止

# 2. データベースバックアップ
# Azure Portal で手動バックアップ実行

# 3. マイグレーション実行
dotnet ef database update --connection "<production-connection-string>"

# 4. アプリケーションデプロイ
az webapp deployment source config-zip \
  --resource-group <resource-group> \
  --name <app-name-production> \
  --src ./publish.zip

# 5. 動作確認
curl https://<app-name-production>.azurewebsites.net/health

# 6. メンテナンスモード解除
# Azure Portal でアプリケーション再開
```

### 6.2 運用開始準備

#### 6.2.1 スタッフトレーニング

**トレーニング内容:**
- システムの基本操作（30分）
- 園児切り替え・連続記録モード（15分）
- 体温電卓UIの使い方（10分）
- 午睡チェックの記録方法（15分）
- エラー対応・問い合わせ方法（10分）

**トレーニング資料:**
- [ ] 操作マニュアル（PDF）
- [ ] クイックリファレンスガイド（1ページ）
- [ ] FAQ
- [ ] 動画チュートリアル（5分）

#### 6.2.2 運用体制

**サポート体制:**
- レベル1: 園内ITサポート担当者
- レベル2: システム開発チーム
- レベル3: Azure サポート

**問い合わせ窓口:**
- メール: support@example.com
- 電話: 0120-xxx-xxxx（平日9-18時）
- Slack: #infant-records-support

#### 6.2.3 監視・アラート設定

**Azure Monitor設定:**
- [ ] アプリケーション可用性（99.9%以上）
- [ ] レスポンス時間（P95 < 1秒）
- [ ] エラー率（< 1%）
- [ ] データベース接続エラー
- [ ] APIエラー（500番台）

**アラート通知先:**
- Slack: #infant-records-alerts
- メール: dev-team@example.com
- SMS: 緊急時のみ

### 6.3 ロールバック計画

**ロールバック条件:**
- 重大なバグ発見（データ損失リスク）
- パフォーマンス劣化（レスポンス時間2倍以上）
- 可用性低下（99%未満）

**ロールバック手順:**
```bash
# 1. アプリケーション停止
az webapp stop --name <app-name>

# 2. データベースバックアップから復元
# Azure Portal で復元実行

# 3. 旧バージョンのアプリケーションデプロイ
az webapp deployment source config-zip \
  --name <app-name> \
  --src ./previous-version.zip

# 4. 動作確認
curl https://<app-name>.azurewebsites.net/health

# 5. アプリケーション再開
az webapp start --name <app-name>
```

### 6.4 成果物

- [ ] デプロイ手順書
- [ ] 操作マニュアル
- [ ] FAQ
- [ ] トレーニング資料
- [ ] 運用手順書
- [ ] ロールバック手順書
- [ ] 監視ダッシュボード設定
- [ ] アラート設定

---

## 7. リスク管理

### 7.1 技術的リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| データベーススキーマ変更の失敗 | 高 | 低 | マイグレーションスクリプトの事前テスト、バックアップ取得 |
| API パフォーマンス劣化 | 中 | 中 | インデックス最適化、キャッシュ導入 |
| フロントエンドのバグ | 中 | 中 | E2Eテストの充実、UAT実施 |
| モバイル端末の互換性問題 | 中 | 低 | 主要デバイスでのテスト実施 |

### 7.2 スケジュールリスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| バックエンド実装の遅延 | 高 | 中 | 優先順位付け、並行開発 |
| フロントエンド実装の遅延 | 高 | 中 | コンポーネント再利用、ライブラリ活用 |
| UAT期間の延長 | 中 | 中 | 早期フィードバック取得 |

### 7.3 運用リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| スタッフの操作ミス | 中 | 高 | トレーニング実施、操作ガイド提供 |
| システムダウン | 高 | 低 | 監視体制構築、ロールバック準備 |
| データ損失 | 高 | 低 | 定期バックアップ、トランザクション制御 |

---

## 8. 完了基準

### 8.1 Phase 1: データベース構築

- [x] 新規テーブル2つ作成完了
- [x] 既存テーブル4つ修正完了
- [ ] マイグレーション実行成功
- [ ] データ整合性確認完了

### 8.2 Phase 2: バックエンド実装

- [ ] モデル7つ作成完了
- [ ] DTO 15種類作成完了
- [ ] バリデータ7つ作成完了
- [ ] サービス8つ作成完了
- [ ] コントローラー8つ作成完了
- [ ] 単体テストカバレッジ80%以上
- [ ] Swagger ドキュメント完成

### 8.3 Phase 3: フロントエンド実装

- [ ] コンポーネント15種類作成完了
- [ ] タイムライン画面実装完了
- [ ] 園児選択モーダル実装完了
- [ ] 連続記録モード実装完了
- [ ] 体温電卓UI実装完了
- [ ] E2Eテスト10シナリオ以上作成

### 8.4 Phase 4: テスト・検証

- [ ] 単体テスト全パス
- [ ] 統合テスト全パス
- [ ] E2Eテスト全パス
- [ ] UAT完了（保育士5名以上）
- [ ] パフォーマンステスト合格（レスポンス時間目標達成）
- [ ] バグ0件（クリティカル・メジャー）

### 8.5 Phase 5: デプロイ・運用開始

- [ ] ステージング環境デプロイ成功
- [ ] 本番環境デプロイ成功
- [ ] スタッフトレーニング完了（全スタッフ）
- [ ] 運用手順書完成
- [ ] 監視・アラート設定完了
- [ ] 運用開始（本番稼働）

---

## 9. 付録

### 9.1 関連ドキュメント

- [docs/infant-records-requirements-v2.md](./infant-records-requirements-v2.md) - 要件定義書
- [docs/infant-records-schema-and-ui-design.md](./infant-records-schema-and-ui-design.md) - スキーマ・UI設計書
- [docs/infant-records-ui-flow-v2.md](./infant-records-ui-flow-v2.md) - UIフロー最適化版
- [docs/infant-records-create-tables.sql](./infant-records-create-tables.sql) - テーブル作成スクリプト
- [docs/mobile/database-design.md](./mobile/database-design.md) - データベース設計書

### 9.2 用語集

| 用語 | 説明 |
|------|------|
| タイムライン方式 | 個別園児の記録を時系列で表示する方式 |
| 連続記録モード | 同じ記録タイプで次々と園児を記録する機能 |
| SIDS対策 | 乳幼児突然死症候群の予防対策 |
| 体温電卓UI | クイック入力ボタン + 数字キーパッドの体温入力UI |
| 午睡チェック | 5分/10分/15分間隔での午睡中の園児チェック |

### 9.3 問い合わせ先

- プロジェクトマネージャー: pm@example.com
- バックエンド担当: backend@example.com
- フロントエンド担当: frontend@example.com
- インフラ担当: infra@example.com

---

**END OF DOCUMENT**
