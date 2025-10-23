# 複数クラス掛け持ちスタッフ要件定義書

## 1. 背景と課題

### 1.1 背景
StaffClassAssignmentsテーブルの導入により、1人のスタッフが複数のクラスを担当できるようになりました。これにより、以下のような現実的なケースに対応可能になります:

- 主担任として1クラス、副担任として別のクラス
- 複数クラスを掛け持ちする専科の先生（音楽、体育など）
- 小規模園での兼任体制
- フリー保育士（複数クラスのサポート）

### 1.2 課題
複数クラスを担当するスタッフがモバイルアプリで作業する際、以下の画面で「どのクラスの作業をしているか」を明確にする必要があります:

#### 影響を受ける主要画面:
1. **レポート作成画面** (`/staff/reports/create`)
2. **写真管理画面** (`/staff/photos`)
3. **写真アップロード画面** (`/staff/photos/upload`)
4. **お知らせ作成画面** (`/staff/announcements/create`)
5. **連絡受信・確認画面** (`/staff/contacts`)
6. **スタッフダッシュボード** (`/staff/dashboard`)

---

## 2. 要件定義

### 2.1 クラスコンテキスト管理

#### FR-MC-001: クラス選択機能
**要件**: スタッフが担当する複数クラスの中から、現在作業対象のクラスを選択できる機能を提供する

**仕様**:
- スタッフログイン直後、担当クラス数を確認
- 担当クラスが1つの場合: 自動的にそのクラスを選択
- 担当クラスが複数の場合: クラス選択画面を表示

**データ取得**:
```sql
SELECT
    sca.ClassId,
    c.Name AS ClassName,
    sca.AssignmentRole
FROM StaffClassAssignments sca
INNER JOIN Classes c ON sca.NurseryId = c.NurseryId AND sca.ClassId = c.ClassId
WHERE sca.NurseryId = @NurseryId
  AND sca.StaffId = @StaffId
ORDER BY sca.AssignmentRole DESC, c.Name
```

#### FR-MC-002: 現在のクラスコンテキスト表示
**要件**: 全画面で現在選択中のクラスを明確に表示する

**表示位置**:
- ヘッダー部分に常時表示
- 例: 「🏫 さくら組（主担任）」

**デザイン要件**:
- 視認性の高い配色
- タップで即座にクラス変更可能
- 役割（主担任・副担任）も表示

#### FR-MC-003: クラス切り替え機能
**要件**: 画面遷移なしで現在のクラスコンテキストを切り替えられる

**UI仕様**:
- ヘッダーのクラス表示部分をタップ → クラス選択ドロップダウン表示
- ドロップダウンメニューで別クラスを選択 → 即座にコンテキスト切り替え
- 切り替え後、現在の画面内容を新しいクラスコンテキストで再読み込み

**状態管理**:
```typescript
interface StaffClassContext {
  nurseryId: number;
  staffId: number;
  currentClassId: string;
  currentClassName: string;
  assignmentRole: 'MainTeacher' | 'AssistantTeacher';
  availableClasses: Array<{
    classId: string;
    className: string;
    assignmentRole: 'MainTeacher' | 'AssistantTeacher';
  }>;
}
```

---

### 2.2 画面別要件

#### 2.2.1 レポート作成画面 (`/staff/reports/create`)

**FR-MC-RC-001: 園児選択のスコープ制限**
- 現在選択中のクラスに所属する園児のみを表示
- 他のクラスの園児は選択肢に表示しない

**FR-MC-RC-002: クラス情報の自動設定**
- 作成するレポートに現在のクラスコンテキストを自動的に関連付ける
- レポートメタデータに `ClassId` を含める

**データフィルタリング**:
```sql
-- 園児選択用クエリ
SELECT ChildId, FirstName, LastName, DateOfBirth
FROM Children
WHERE NurseryId = @NurseryId
  AND ClassId = @CurrentClassId
  AND IsActive = 1
ORDER BY LastName, FirstName
```

**UI要件**:
- ヘッダー: 「レポート作成 - さくら組」のように表示
- クラス切り替え時: 園児リストを自動更新、入力内容はリセット警告

---

#### 2.2.2 写真アップロード画面 (`/staff/photos/upload`)

**FR-MC-PU-001: デフォルトクラス設定**
- 公開範囲のデフォルト値を「現在のクラス」に設定
- スタッフは必要に応じて他のクラスや全体に変更可能

**FR-MC-PU-002: 園児タグ付けのスコープ**
- 園児選択時、現在のクラスの園児を優先表示
- 「他のクラスの園児も表示」オプションを提供

**FR-MC-PU-003: 活動タグのクラス紐付け**
- アップロードした写真に自動的にクラス情報を付与
- 後から別のスタッフが検索・フィルタしやすくする

**UI仕様**:
```
┌─────────────────────────────────┐
│ 写真アップロード - さくら組     │ ← クラスコンテキスト表示
├─────────────────────────────────┤
│ 公開範囲: [さくら組 ▼]          │ ← デフォルトで現在のクラス
│           □ ひまわり組           │
│           □ 全クラス             │
├─────────────────────────────────┤
│ 園児タグ: [さくら組の園児から選択]│
│           ☑ 田中 太郎            │
│           ☑ 佐藤 花子            │
│           □ 他のクラスも表示     │ ← トグルで全園児表示
└─────────────────────────────────┘
```

---

#### 2.2.3 写真管理画面 (`/staff/photos`)

**FR-MC-PM-001: クラスフィルタのデフォルト設定**
- 初期表示時、現在のクラスの写真のみを表示
- フィルタ条件を変更して他のクラスや全体も閲覧可能

**FR-MC-PM-002: クラス別写真統計**
- 各クラスごとの写真数を表示
- 現在のクラスの今週・今月のアップロード数を表示

**FR-MC-PM-003: 写真検索範囲の明示**
- 検索バーの上部に「現在の検索範囲: さくら組」と表示
- クラスコンテキスト切り替えで自動的に検索範囲も変更

**UI要件**:
```
┌─────────────────────────────────┐
│ 写真管理 - さくら組              │
├─────────────────────────────────┤
│ 検索範囲: [さくら組のみ ▼]      │
│           □ 全クラス             │
│           □ ひまわり組           │
├─────────────────────────────────┤
│ 📊 統計                          │
│ さくら組: 今週 12枚 / 今月 45枚  │
│ 全体: 今週 38枚 / 今月 156枚     │
└─────────────────────────────────┘
```

---

#### 2.2.4 お知らせ作成画面 (`/staff/announcements/create`)

**FR-MC-AC-001: 対象範囲のデフォルト設定**
- 対象範囲のデフォルトを「現在のクラス」に設定
- スタッフは全体や他のクラスにも送信可能

**FR-MC-AC-002: クラス固有のテンプレート**
- クラスごとに保存されたテンプレートを表示
- 現在のクラスのテンプレートを優先表示

**FR-MC-AC-003: 送信履歴のクラス別表示**
- 下書き一覧や送信履歴を現在のクラスでフィルタ
- 「全てのクラスの履歴を表示」オプションを提供

**データ構造**:
```json
{
  "title": "遠足のお知らせ",
  "content": "...",
  "category": "general",
  "targetAudience": "specific_class",
  "targetClassId": "sakura", // 現在のクラスコンテキスト
  "createdByStaffId": 123,
  "createdByClassName": "さくら組" // 作成時のクラスコンテキスト
}
```

---

#### 2.2.5 連絡受信・確認画面 (`/staff/contacts`)

**FR-MC-CC-001: クラス別連絡フィルタ**
- 現在のクラスに関連する連絡のみを表示
- タブで「さくら組」「ひまわり組」「全て」を切り替え可能

**FR-MC-CC-002: 未確認連絡のクラス別カウント**
- 各クラスごとの未確認連絡数をバッジ表示
- 例: 「さくら組 (3)」「ひまわり組 (1)」

**FR-MC-CC-003: 連絡詳細のクラス情報表示**
- 連絡元の園児のクラス情報を明示
- 複数クラス担当時の混乱を防止

**UI設計**:
```
┌─────────────────────────────────┐
│ 連絡受信                         │
├─────────────────────────────────┤
│ [さくら組(3)] [ひまわり組(1)] [全て(4)] │ ← タブ
├─────────────────────────────────┤
│ 🔴 欠席連絡 - 田中太郎（さくら組）│
│    今日は体調不良のため...        │
│                                  │
│ 🔴 遅刻連絡 - 佐藤花子（さくら組）│
│    病院に行くため10時頃...       │
└─────────────────────────────────┘
```

---

#### 2.2.6 スタッフダッシュボード (`/staff/dashboard`)

**FR-MC-SD-001: クラス別統計表示**
- 現在のクラスの本日の出席状況
- 現在のクラスの未確認連絡数
- 現在のクラスの今週のレポート作成数

**FR-MC-SD-002: 全クラス概要の表示**
- 担当する全クラスの概要を一覧表示
- 各クラスの未処理タスク数を表示

**FR-MC-SD-003: クイックアクセス**
- 「さくら組のレポートを作成」のようにクラス別のクイックアクションボタン
- クラスごとに色分けして視認性向上

**ダッシュボードレイアウト例**:
```
┌─────────────────────────────────┐
│ スタッフダッシュボード           │
│ 現在: さくら組（主担任）▼       │
├─────────────────────────────────┤
│ 📊 さくら組 - 今日の状況         │
│   出席: 18/20名                  │
│   未確認連絡: 3件                │
│   未作成レポート: 5名            │
├─────────────────────────────────┤
│ 🏫 担当クラス一覧                │
│   ● さくら組（主担任）           │
│      未処理タスク: 8件           │
│   ● ひまわり組（副担任）         │
│      未処理タスク: 2件           │
└─────────────────────────────────┘
```

---

### 2.3 クラスコンテキストの永続化

#### FR-MC-CP-001: セッション間での記憶
**要件**: スタッフが最後に選択したクラスコンテキストを記憶し、次回ログイン時に自動的に復元する

**実装方法**:
- ローカルストレージに保存: `lastSelectedClass_{staffId}`
- セッション開始時に復元
- 該当クラスが存在しない場合は再選択を促す

#### FR-MC-CP-002: クラスコンテキストの検証
**要件**: API呼び出し時に必ず現在のクラスコンテキストを検証し、権限を確認する

**バックエンド検証**:
```csharp
// すべてのスタッフ用APIエンドポイントで実行
public async Task<bool> ValidateStaffClassAccess(int staffId, int nurseryId, string classId)
{
    return await _context.StaffClassAssignments
        .AnyAsync(sca =>
            sca.StaffId == staffId &&
            sca.NurseryId == nurseryId &&
            sca.ClassId == classId
        );
}
```

---

### 2.4 ユーザーエクスペリエンス要件

#### UX-MC-001: クラス切り替えの直感性
- ヘッダーのクラス表示をタップするだけで切り替え可能
- ドロップダウンメニューで視覚的にわかりやすく
- 役割（主担任・副担任）もアイコンで表示

#### UX-MC-002: コンテキスト変更の明確な通知
- クラスを切り替えた際、トースト通知で確認
- 例: 「さくら組に切り替えました」
- 入力中のデータがある場合は警告ダイアログ

#### UX-MC-003: 複数クラス横断操作のサポート
- 一部の画面では「全クラス」モードを提供
- 写真管理や連絡確認で全クラスを横断的に確認可能
- ただしデフォルトは現在のクラスに絞る

---

### 2.5 エラーハンドリング

#### ER-MC-001: クラスコンテキスト未選択
**シナリオ**: 複数クラス担当スタッフがログイン直後にクラスを選択しなかった場合

**処理**:
- 強制的にクラス選択画面を表示
- 選択完了まで他の画面への遷移をブロック

#### ER-MC-002: クラスアクセス権限喪失
**シナリオ**: セッション中にStaffClassAssignmentsから削除された場合

**処理**:
- API呼び出し時に403 Forbiddenエラー
- フロントエンドでエラーをキャッチし、クラス選択画面に戻す
- 「担当クラスが変更されました。再度選択してください。」メッセージ表示

#### ER-MC-003: データの整合性エラー
**シナリオ**: 選択したクラスと異なるクラスのデータを操作しようとした場合

**処理**:
- バックエンドで厳密に検証
- クラスコンテキストとデータのClassIdが一致しない場合は拒否
- フロントエンドにエラーメッセージを返す

---

### 2.6 認証システムとの統合要件

#### INT-MC-001: AuthUser型の拡張
**課題**: 現在の`AuthUser`インターフェース（`reactapp.client/src/types/auth.ts`）にはスタッフのクラス割り当て情報が含まれていません。

**現在の構造**:
```typescript
export interface AuthUser {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'Parent' | 'Staff';
  staff?: {
    id: string;
    name: string;
    role: string;  // ← クラス割り当て情報なし
  } | null;
}
```

**必要な拡張**:
```typescript
export interface AuthUser {
  id: string;
  phoneNumber: string;
  name?: string;
  role: 'Parent' | 'Staff';
  staff?: {
    id: string;
    nurseryId: number;      // ← 追加
    staffId: number;        // ← 追加
    name: string;
    role: string;
    classAssignments: Array<{  // ← 追加
      classId: string;
      className: string;
      assignmentRole: 'MainTeacher' | 'AssistantTeacher';
    }>;
  } | null;
}
```

#### INT-MC-002: バックエンドDTO拡張
**対象ファイル**: `ReactApp.Server/DTOs/AuthenticationDTOs.cs`

**必要な変更**:
```csharp
public class StaffInfoDto
{
    public int StaffId { get; set; }
    public int NurseryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<ClassAssignmentDto> ClassAssignments { get; set; } = new();  // ← 追加
}

public class ClassAssignmentDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string AssignmentRole { get; set; } = string.Empty;
}
```

#### INT-MC-003: SMS認証時のクラス割り当て情報取得
**対象**: `AuthenticationController.VerifySms`エンドポイント

**実装要件**:
- SMS認証成功時、Staffロールの場合はStaffClassAssignmentsテーブルから割り当て情報を取得
- 取得したクラス情報を`AuthUserDto`に含めてフロントエンドに返す

```csharp
// AuthenticationService.csに追加
public async Task<List<ClassAssignmentDto>> GetStaffClassAssignmentsAsync(int nurseryId, int staffId)
{
    return await _context.StaffClassAssignments
        .Where(sca => sca.NurseryId == nurseryId && sca.StaffId == staffId)
        .Join(_context.Classes,
            sca => new { sca.NurseryId, sca.ClassId },
            c => new { c.NurseryId, c.ClassId },
            (sca, c) => new ClassAssignmentDto
            {
                ClassId = sca.ClassId,
                ClassName = c.Name,
                AssignmentRole = sca.AssignmentRole
            })
        .ToListAsync();
}
```

#### INT-MC-004: useAuth フックの統合
**課題**: 現在の`useAuth`フック（`reactapp.client/src/hooks/useAuth.ts`）はクラス情報を扱っていません。

**推奨アプローチ**:
- `useAuth`は認証状態のみを管理（現状維持）
- クラスコンテキスト管理は別の`useStaffClass`フックで実装
- `StaffClassProvider`は`useAuth`の`user.staff.classAssignments`を初期データとして使用

**統合パターン**:
```typescript
// App.tsx
function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      {isAuthenticated && user?.role === 'Staff' && (
        <StaffClassProvider initialAssignments={user.staff?.classAssignments}>
          <StaffRoutes />
        </StaffClassProvider>
      )}
    </AuthProvider>
  );
}
```

---

## 3. 技術仕様

### 3.1 状態管理（React Context API）

```typescript
// contexts/StaffClassContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface ClassInfo {
  classId: string;
  className: string;
  assignmentRole: 'MainTeacher' | 'AssistantTeacher';
}

interface StaffClassContextType {
  nurseryId: number;
  staffId: number;
  currentClass: ClassInfo | null;
  availableClasses: ClassInfo[];
  switchClass: (classId: string) => void;
  isMultiClass: boolean;
}

const StaffClassContext = createContext<StaffClassContextType | undefined>(undefined);

export const StaffClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);

  useEffect(() => {
    // ログイン時に担当クラス一覧を取得
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    const response = await api.get('/api/staff/classes');
    const classes = response.data;
    setAvailableClasses(classes);

    // 1クラスのみの場合は自動選択
    if (classes.length === 1) {
      setCurrentClass(classes[0]);
    } else {
      // ローカルストレージから前回の選択を復元
      const lastSelected = localStorage.getItem('lastSelectedClass');
      if (lastSelected) {
        const savedClass = classes.find(c => c.classId === lastSelected);
        if (savedClass) {
          setCurrentClass(savedClass);
        }
      }
    }
  };

  const switchClass = (classId: string) => {
    const selectedClass = availableClasses.find(c => c.classId === classId);
    if (selectedClass) {
      setCurrentClass(selectedClass);
      localStorage.setItem('lastSelectedClass', classId);
    }
  };

  return (
    <StaffClassContext.Provider
      value={{
        nurseryId: 1, // 実際にはログイン情報から取得
        staffId: 123, // 実際にはログイン情報から取得
        currentClass,
        availableClasses,
        switchClass,
        isMultiClass: availableClasses.length > 1
      }}
    >
      {children}
    </StaffClassContext.Provider>
  );
};

export const useStaffClass = () => {
  const context = useContext(StaffClassContext);
  if (!context) {
    throw new Error('useStaffClass must be used within StaffClassProvider');
  }
  return context;
};
```

### 3.2 クラス選択コンポーネント

```typescript
// components/staff/ClassSelector.tsx
import React from 'react';
import { useStaffClass } from '../../contexts/StaffClassContext';

export const ClassSelector: React.FC = () => {
  const { currentClass, availableClasses, switchClass, isMultiClass } = useStaffClass();

  if (!isMultiClass) {
    // 1クラスのみの場合はシンプル表示
    return (
      <div className="class-display">
        🏫 {currentClass?.className} ({currentClass?.assignmentRole === 'MainTeacher' ? '主担任' : '副担任'})
      </div>
    );
  }

  return (
    <div className="class-selector-dropdown">
      <button className="class-selector-button">
        🏫 {currentClass?.className} ({currentClass?.assignmentRole === 'MainTeacher' ? '主担任' : '副担任'}) ▼
      </button>
      <div className="dropdown-menu">
        {availableClasses.map(cls => (
          <button
            key={cls.classId}
            onClick={() => switchClass(cls.classId)}
            className={cls.classId === currentClass?.classId ? 'active' : ''}
          >
            {cls.className} ({cls.assignmentRole === 'MainTeacher' ? '主担任' : '副担任'})
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 3.3 API呼び出し時のクラスコンテキスト送信

```typescript
// hooks/useStaffApi.ts
import { useStaffClass } from '../contexts/StaffClassContext';
import axios from 'axios';

export const useStaffApi = () => {
  const { currentClass, nurseryId, staffId } = useStaffClass();

  const createReport = async (reportData: any) => {
    if (!currentClass) {
      throw new Error('クラスが選択されていません');
    }

    return axios.post('/api/staff/reports', {
      ...reportData,
      nurseryId,
      staffId,
      classId: currentClass.classId
    });
  };

  const uploadPhoto = async (photoData: any) => {
    if (!currentClass) {
      throw new Error('クラスが選択されていません');
    }

    return axios.post('/api/staff/photos/upload', {
      ...photoData,
      nurseryId,
      staffId,
      defaultClassId: currentClass.classId
    });
  };

  return { createReport, uploadPhoto };
};
```

---

## 4. 実装優先順位

### Phase 1: 基盤実装（必須）
1. ✅ StaffClassAssignments テーブル作成完了
2. ⏳ StaffClassContext 状態管理の実装
3. ⏳ ClassSelector コンポーネントの実装
4. ⏳ クラス選択画面の実装

### Phase 2: 主要画面対応
1. ⏳ レポート作成画面の対応
2. ⏳ 写真アップロード画面の対応
3. ⏳ スタッフダッシュボードの対応

### Phase 3: 補助機能
1. ⏳ 写真管理画面の対応
2. ⏳ お知らせ作成画面の対応
3. ⏳ 連絡受信・確認画面の対応

### Phase 4: UX改善
1. ⏳ クラス別統計機能
2. ⏳ クラステンプレート機能
3. ⏳ 全クラス横断モード

---

## 5. テストシナリオ

### 5.1 単一クラス担当スタッフ
- ログイン後、自動的にそのクラスが選択されること
- クラス選択UIが表示されないこと
- 全ての機能が正常に動作すること

### 5.2 複数クラス担当スタッフ（主担任×1 + 副担任×1）
- ログイン後、クラス選択を求められること
- 前回選択したクラスが記憶されていること
- クラス切り替えがスムーズに動作すること
- 各画面でクラスコンテキストが正しく反映されること

### 5.3 複数クラス担当スタッフ（主担任×2）
- 両クラスで主担任として全機能が使用できること
- クラス切り替え時にデータが正しくフィルタされること

### 5.4 権限変更
- セッション中に担当クラスから外された場合、適切にエラー処理されること
- 新しいクラスが追加された場合、再ログイン後に表示されること

---

## 6. まとめ

複数クラス掛け持ちスタッフへの対応は、以下の3つの柱で実現します:

1. **クラスコンテキストの明確化**: 常に「どのクラスの作業をしているか」を明示
2. **シームレスなクラス切り替え**: ヘッダーからワンタップで切り替え可能
3. **適切なデータスコープ**: 現在のクラスに関連するデータのみを表示（必要に応じて全体も可）

これにより、複数クラスを担当するスタッフでも混乱なく、効率的に業務を行えるようになります。
