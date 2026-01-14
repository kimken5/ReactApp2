# 献立管理機能 要件定義書

**作成日**: 2026年1月3日
**バージョン**: 1.0

---

## 1. 概要

### 1.1 システム目的
保育園の保護者とスタッフが日々の献立（午前おやつ、給食、午後おやつ）を確認し、園児のアレルギー情報と照合して安全な食事提供をサポートする機能を提供する。

### 1.2 対象ユーザー
- **保護者**: 自分の子供の献立とアレルギー該当状況を確認
- **スタッフ**: 担当クラスの献立と該当園児のアレルギー情報を確認

### 1.3 利用シーン
- 保護者: 朝の登園前に本日の献立確認、週末に翌週の献立確認
- スタッフ: 食事提供前のアレルギー該当園児確認、週次献立計画の確認

---

## 2. データモデル

### 2.1 テーブル構造

#### AllergenMaster（アレルゲンマスター）
| カラム名 | 型 | 説明 |
|---------|-----|------|
| Id | int (PK, IDENTITY) | アレルゲンID |
| AllergenName | nvarchar(50) | アレルゲン名（例: 卵、牛乳・乳製品、小麦） |
| SortOrder | int | 表示順 |
| CreatedAt | datetime2 | 作成日時 |

#### MenuMaster（献立マスター）
| カラム名 | 型 | 説明 |
|---------|-----|------|
| Id | int (PK, IDENTITY) | 献立ID |
| NurseryId | int | 保育園ID |
| MenuName | nvarchar(50) | 献立名（例: カレーライス） |
| IngredientName | nvarchar(200) | 食材名（例: 豚肉、じゃがいも） |
| Allergens | nvarchar(200) | アレルゲンID（カンマ区切り: 例: "1,3,5"） |
| Description | nvarchar(500) | 説明・備考 |
| CreatedAt | datetime2 | 作成日時 |
| UpdatedAt | datetime2 | 更新日時 |

#### DailyMenus（日別献立）
| カラム名 | 型 | 説明 |
|---------|-----|------|
| Id | int (PK, IDENTITY) | 日別献立ID |
| NurseryId | int | 保育園ID |
| MenuDate | date | 提供日 |
| MenuType | nvarchar(50) | 種類（Lunch/MorningSnack/AfternoonSnack） |
| MenuMasterId | int | 献立マスターID（FK） |
| SortOrder | int | 表示順（同じ日・種類内での並び順） |
| Notes | nvarchar(500) | 当日の特記事項 |
| CreatedAt | datetime2 | 作成日時 |
| UpdatedAt | datetime2 | 更新日時 |

#### Children（園児マスター）- 既存テーブルに追加
| カラム名 | 型 | 説明 |
|---------|-----|------|
| Allergy | nvarchar(200) | アレルゲンID（カンマ区切り: 例: "1,3"） |

### 2.2 MenuType定義
- **MorningSnack**: 午前おやつ
- **Lunch**: 給食
- **AfternoonSnack**: 午後おやつ

---

## 3. 機能要件

### FR-1: 週単位献立表示
- **週の定義**: 日曜日～土曜日の7日間
- **週の選択**: weekOffsetパラメータで週を前後に移動
  - `weekOffset = 0`: 本日を含む週
  - `weekOffset = -1`: 先週
  - `weekOffset = 1`: 翌週
- **初期表示**: 本日を含む週（日～土）

### FR-2: 固定ヘッダー
**1行目: 週ナビゲーション**
- 前週ボタン（[← 前週]）
- 週範囲表示（例: 2026/01/05 - 2026/01/11）
- 翌週ボタン（[翌週 →]）

**2行目: 日付リンク**
- 7日分の日付をクリック可能なボタンとして横並び表示
- 形式: [日 1/5] [月 1/6] [火 1/7] ... [土 1/11]
- クリックすると該当日の献立セクションに自動スクロール

**固定仕様**:
- 1行目と2行目はスクロールしても画面上部に固定
- 3行目以降の献立一覧のみスクロール可能

### FR-3: 献立一覧スクロール
- **スクロール領域**: 3行目以降
- **日付セクション**: 各日ごとに大見出し（例: ■ 日曜日 1/5）
- **献立種類セクション**: 午前おやつ、給食、午後おやつの順で表示
- **献立項目**: 各MenuMasterの内容を箇条書きで表示

### FR-4: 日付リンク機能
- **動作**: 2行目の日付ボタンをクリックすると、該当日の献立セクションにスクロール
- **初期表示**:
  - 本日が週範囲内の場合: 本日の献立セクションが頭出し
  - 本日が週範囲外の場合（weekOffset ≠ 0）: 週の最初の日（日曜日）が頭出し

### FR-5: 保護者用アレルギー警告
**対象**:
- 保護者が持つすべての子供のアレルギー情報

**表示仕様**:
- 献立にアレルゲンが含まれる場合、献立名の後ろに警告表示
- 形式: `⚠️{子供名}（{アレルゲン名}）`

**表示パターン**:
1. 1人の子供が該当:
   ```
   ・ヨーグルト ⚠️太郎（牛乳）
   ```

2. 複数の子供が異なるアレルゲンに該当:
   ```
   ・カレーライス ⚠️太郎（小麦）⚠️花子（牛乳）
   ```

3. 複数の子供が同じアレルゲンに該当:
   ```
   ・クッキー ⚠️太郎、花子（卵）
   ```

4. アレルギー該当なし:
   ```
   ・バナナ
   ```

**注意**: 表示する園児名は**名前のみ（FirstName）**。苗字は不要。

**視覚的強調**:
- ⚠️アイコン
- 赤色テキストまたは赤色背景

### FR-6: スタッフ用アレルギー該当園児表示
**対象**:
- スタッフが担当するクラスの園児全員

**表示仕様**:
- 献立にアレルゲンが含まれる場合、献立の下にアレルゲンごとの該当園児リストを表示
- 形式: `🔸{アレルゲン名}: {園児名1}、{園児名2}`

**表示例**:
```
・ヨーグルト
  🔸牛乳: 太郎、花子

・カレーライス
  🔸小麦: 次郎
  🔸牛乳: 太郎
```

**注意**: 表示する園児名は**名前のみ（FirstName）**。苗字は不要。

**視覚的強調**:
- 🔸アイコン
- 黄色背景

### FR-7: クラス選択（スタッフのみ）
- スタッフ画面にクラス選択ドロップダウンを配置
- 選択したクラスの園児を対象にアレルギー該当判定
- クラス選択を変更すると献立一覧を再読み込み

---

## 4. 非機能要件

### NFR-1: パフォーマンス
- 週次データ取得は1回のAPIリクエストで完結
- AllergenMasterはMemoryCacheで30分キャッシュ
- MenuMasterは15分キャッシュ検討
- 初期表示時間: 2秒以内
- スクロール動作: スムーズなアニメーション

### NFR-2: レスポンシブデザイン
- **デスクトップ**: 固定ヘッダー + 広いスクロール領域
- **タブレット**: 同様のレイアウトでやや縮小
- **モバイル**: 固定ヘッダー（コンパクト） + スクロール領域

### NFR-3: アクセシビリティ
- キーボードナビゲーション対応（Tab, Enter）
- スクリーンリーダー対応（aria-label, role属性）
- 色覚バリアフリー（アイコンとテキストの併用）

---

## 5. UI設計

### 5.1 画面レイアウト

```
┌────────────────────────────────────────────────────┐ ← 1行目（固定）
│ [← 前週]  2026/01/05 - 2026/01/11  [翌週 →]     │
├────────────────────────────────────────────────────┤ ← 2行目（固定、日付リンク）
│ [日 1/5] [月 1/6] [火 1/7] [水 1/8] [木 1/9] [金 1/10] [土 1/11] │
├────────────────────────────────────────────────────┤ ← 3行目以降（スクロール領域）
│                                                    │
│ ■ 日曜日 1/5                 ← id="menu-2026-01-05" │
│ ┌─ 午前おやつ ─────────────────────┐         │
│ │ ・バナナ                                       │
│ │ ・ヨーグルト ⚠️花子（牛乳）                  │ ← 保護者用
│ └────────────────────────────────┘         │
│ ┌─ 給食 ────────────────────────┐         │
│ │ ・カレーライス                                 │
│ │   🔸小麦: 次郎                               │ ← スタッフ用
│ └────────────────────────────────┘         │
│ ┌─ 午後おやつ ─────────────────────┐         │
│ │ ・フルーツ                                     │
│ └────────────────────────────────┘         │
│                                                    │
│ ■ 月曜日 1/6                 ← id="menu-2026-01-06" │
│ ...                                                │
│                                                    ↓
│                                           （スクロール）
└────────────────────────────────────────────────────┘
```

### 5.2 スタッフ画面の追加要素
```
┌────────────────────────────────────────────────────┐
│ クラス: [さくら4組 ▼]                              │ ← クラス選択
│ [← 前週]  2026/01/05 - 2026/01/11  [翌週 →]     │
├────────────────────────────────────────────────────┤
│ [日 1/5] [月 1/6] [火 1/7] ...                     │
├────────────────────────────────────────────────────┤
│ ...                                                │
```

---

## 6. ユースケース

### UC-1: 保護者が本日の献立を確認する
**アクター**: 保護者

**事前条件**: 保護者がログイン済み

**メインフロー**:
1. 保護者が `/parent/menu` にアクセス
2. システムは本日を含む週の献立を取得
3. 本日の献立セクションが頭出し表示される
4. 保護者の子供のアレルギーに該当する献立には⚠️と子供名が表示される

**事後条件**: 保護者は本日の献立とアレルギー該当状況を確認できた

---

### UC-2: 保護者が来週の献立を確認する
**アクター**: 保護者

**事前条件**: 保護者が献立画面を表示中

**メインフロー**:
1. 保護者が「翌週 →」ボタンをクリック
2. システムはweekOffset=1で来週の献立を取得
3. 来週の日曜日の献立が頭出し表示される
4. アレルギー警告も来週の献立に対して表示される

**事後条件**: 保護者は来週の献立を確認できた

---

### UC-3: 保護者が特定の日の献立を確認する
**アクター**: 保護者

**事前条件**: 保護者が献立画面を表示中

**メインフロー**:
1. 保護者が2行目の日付リンク（例: [水 1/8]）をクリック
2. システムは該当日の献立セクション（id="menu-2026-01-08"）にスクロール
3. 水曜日の午前おやつから表示される

**事後条件**: 保護者は指定した日の献立を確認できた

---

### UC-4: スタッフがクラスの献立とアレルギー該当園児を確認する
**アクター**: スタッフ

**事前条件**: スタッフがログイン済み

**メインフロー**:
1. スタッフが `/staff/menu` にアクセス
2. スタッフがクラスを選択（ドロップダウン）
3. システムは本日を含む週の献立と、選択クラスの園児情報を取得
4. アレルゲンを含む献立には該当園児名がアレルゲンごとに表示される
5. 本日の献立セクションが頭出し表示される

**事後条件**: スタッフは担当クラスの献立とアレルギー該当園児を確認できた

---

## 7. API仕様

### 7.1 保護者用週次献立取得

**エンドポイント**:
```
GET /api/Menu/weekly/parent/{nurseryId}/{parentId}?weekOffset=0
```

**パラメータ**:
- `nurseryId` (int): 保育園ID
- `parentId` (int): 保護者ID
- `weekOffset` (int, optional): 週オフセット（デフォルト: 0）

**レスポンス** (ParentWeeklyMenuDto):
```json
{
  "weekStartDate": "2026-01-05",
  "weekEndDate": "2026-01-11",
  "children": [
    {
      "childId": 1,
      "childName": "太郎",
      "allergenIds": [1, 3],
      "allergenNames": ["卵", "小麦"]
    },
    {
      "childId": 2,
      "childName": "花子",
      "allergenIds": [2],
      "allergenNames": ["牛乳・乳製品"]
    }
  ],
  "days": [
    {
      "menuDate": "2026-01-05",
      "dayOfWeek": "Sunday",
      "morningSnacks": [
        {
          "menuId": 10,
          "menuName": "ヨーグルト",
          "ingredientName": "プレーンヨーグルト、果物",
          "allergenWarnings": [
            {
              "allergenName": "牛乳・乳製品",
              "affectedChildNames": ["花子"]
            }
          ]
        }
      ],
      "lunch": [
        {
          "menuId": 20,
          "menuName": "カレーライス",
          "ingredientName": "豚肉、じゃがいも、カレールウ",
          "allergenWarnings": [
            {
              "allergenName": "小麦",
              "affectedChildNames": ["太郎"]
            },
            {
              "allergenName": "牛乳・乳製品",
              "affectedChildNames": ["花子"]
            }
          ]
        }
      ],
      "afternoonSnacks": [
        {
          "menuId": 30,
          "menuName": "フルーツ",
          "ingredientName": "バナナ、りんご",
          "allergenWarnings": []
        }
      ]
    }
    // ... 6日分
  ]
}
```

---

### 7.2 スタッフ用週次献立取得

**エンドポイント**:
```
GET /api/Menu/weekly/staff/{nurseryId}/{classId}?weekOffset=0
```

**パラメータ**:
- `nurseryId` (int): 保育園ID
- `classId` (string): クラスID
- `weekOffset` (int, optional): 週オフセット（デフォルト: 0）

**レスポンス** (StaffWeeklyMenuDto):
```json
{
  "weekStartDate": "2026-01-05",
  "weekEndDate": "2026-01-11",
  "classId": "sakura4",
  "className": "さくら4組",
  "children": [
    {
      "childId": 1,
      "childName": "太郎",
      "allergenIds": [1, 3],
      "allergenNames": ["卵", "小麦"]
    },
    {
      "childId": 2,
      "childName": "花子",
      "allergenIds": [2],
      "allergenNames": ["牛乳・乳製品"]
    }
  ],
  "days": [
    {
      "menuDate": "2026-01-05",
      "dayOfWeek": "Sunday",
      "morningSnacks": [
        {
          "menuId": 10,
          "menuName": "ヨーグルト",
          "ingredientName": "プレーンヨーグルト、果物",
          "allergenMatches": [
            {
              "allergenName": "牛乳・乳製品",
              "affectedChildren": ["花子"]
            }
          ]
        }
      ],
      "lunch": [
        {
          "menuId": 20,
          "menuName": "カレーライス",
          "ingredientName": "豚肉、じゃがいも、カレールウ",
          "allergenMatches": [
            {
              "allergenName": "小麦",
              "affectedChildren": ["太郎"]
            },
            {
              "allergenName": "牛乳・乳製品",
              "affectedChildren": ["花子"]
            }
          ]
        }
      ],
      "afternoonSnacks": [
        {
          "menuId": 30,
          "menuName": "フルーツ",
          "ingredientName": "バナナ、りんご",
          "allergenMatches": []
        }
      ]
    }
    // ... 6日分
  ]
}
```

---

### 7.3 アレルゲンマスター取得

**エンドポイント**:
```
GET /api/AllergenMaster/{nurseryId}
```

**レスポンス** (AllergenMasterDto[]):
```json
[
  {
    "id": 1,
    "allergenName": "卵",
    "sortOrder": 1
  },
  {
    "id": 2,
    "allergenName": "牛乳・乳製品",
    "sortOrder": 2
  },
  {
    "id": 3,
    "allergenName": "小麦",
    "sortOrder": 3
  }
]
```

---

## 8. 週計算ロジック

### 8.1 週の定義
- **週の開始**: 日曜日
- **週の終了**: 土曜日
- **週の範囲**: 7日間（日～土）

### 8.2 週範囲計算アルゴリズム
```csharp
public static (DateOnly start, DateOnly end) GetWeekRange(int weekOffset)
{
    var today = DateOnly.FromDateTime(DateTime.Now);
    var dayOfWeek = (int)today.DayOfWeek; // Sunday = 0, Monday = 1, ...

    // 日曜日を週の開始とする
    var daysFromSunday = -dayOfWeek;

    var thisWeekSunday = today.AddDays(daysFromSunday);
    var targetWeekSunday = thisWeekSunday.AddDays(weekOffset * 7);
    var targetWeekSaturday = targetWeekSunday.AddDays(6);

    return (targetWeekSunday, targetWeekSaturday);
}
```

### 8.3 計算例
**本日**: 2026年1月3日（金曜日）

| weekOffset | 週範囲 | 説明 |
|-----------|--------|------|
| 0 | 2025/12/28（日）～ 2026/01/03（土） | 本日を含む週 |
| 1 | 2026/01/04（日）～ 2026/01/10（土） | 翌週 |
| -1 | 2025/12/21（日）～ 2025/12/27（土） | 先週 |

### 8.4 初期表示対象日の決定
- **weekOffset = 0**: 本日が週範囲内の場合 → 本日にスクロール
- **weekOffset ≠ 0**: 本日が週範囲外の場合 → 週の最初の日（日曜日）にスクロール

---

## 9. アレルギー照合ロジック

### 9.1 保護者用ロジック

**ステップ1**: 保護者の全子供のアレルギー情報を取得
```sql
SELECT c.ChildId, c.FirstName, c.Allergy
FROM Children c
INNER JOIN ParentChildRelationships pcr ON c.ChildId = pcr.ChildId AND c.NurseryId = pcr.NurseryId
WHERE pcr.ParentId = @parentId AND pcr.IsActive = 1
```

**注意**: 表示する園児名は `FirstName`（名前のみ）を使用。`FamilyName`（苗字）は不要。

**ステップ2**: MenuMasterのAllergensをパース
```csharp
var menuAllergenIds = ParseAllergenIds(menuMaster.Allergens); // "1,3,5" → [1,3,5]
```

**ステップ3**: 各子供とアレルゲンを照合
```csharp
foreach (var child in children)
{
    var childAllergenIds = ParseAllergenIds(child.Allergy);
    var matchedAllergenIds = childAllergenIds.Intersect(menuAllergenIds).ToArray();

    if (matchedAllergenIds.Any())
    {
        // この子供はこの献立のアレルゲンに該当
        // allergenWarningsに追加
    }
}
```

**ステップ4**: アレルゲンごとに該当する子供をグループ化
```csharp
// 同じアレルゲンに複数の子供が該当する場合、まとめて表示
allergenWarnings = matchedAllergens
    .GroupBy(a => a.AllergenId)
    .Select(g => new AllergenWarning
    {
        AllergenName = allergenMaster.First(a => a.Id == g.Key).AllergenName,
        AffectedChildNames = g.Select(c => c.ChildName).ToArray()
    })
    .ToArray();
```

### 9.2 スタッフ用ロジック

**ステップ1**: クラスの全園児のアレルギー情報を取得
```sql
SELECT c.ChildId, c.FirstName, c.Allergy
FROM Children c
WHERE c.ClassId = @classId AND c.IsActive = 1
```

**注意**: 表示する園児名は `FirstName`（名前のみ）を使用。`FamilyName`（苗字）は不要。

**ステップ2～4**: 保護者用と同様の照合処理

---

## 10. 画面遷移

### 10.1 保護者アプリ
```
ログイン
  ↓
/parent/dashboard
  ↓ 献立メニューをクリック
/parent/menu?weekOffset=0
  ↓ 翌週ボタン
/parent/menu?weekOffset=1
  ↓ 前週ボタン
/parent/menu?weekOffset=0
  ↓ 日付リンククリック（JavaScript）
（同じページ内でスクロール）
```

### 10.2 スタッフアプリ
```
ログイン
  ↓
/staff/dashboard
  ↓ 献立メニューをクリック
/staff/menu
  ↓ クラス選択
/staff/menu?classId=sakura4&weekOffset=0
  ↓ 翌週ボタン
/staff/menu?classId=sakura4&weekOffset=1
  ↓ 前週ボタン
/staff/menu?classId=sakura4&weekOffset=0
  ↓ 日付リンククリック（JavaScript）
（同じページ内でスクロール）
```

---

## 11. 制約事項

### 11.1 データ制約
- MenuMaster.Allergensは最大200文字（カンマ区切りIDの上限）
- Children.Allergyも最大200文字
- DailyMenusは1日・1種類あたり最大10件の献立を想定

### 11.2 セキュリティ制約
- 保護者は自分の子供のデータのみアクセス可能
- スタッフは自分が担当するクラスのデータのみアクセス可能
- weekOffsetは-52～+52に制限（1年前後まで）

### 11.3 パフォーマンス制約
- 週次データ取得は最大10秒以内
- スクロールアニメーションは500ms以内

---

## 12. 今後の拡張性

### 12.1 将来的な機能追加候補
- 献立の写真表示
- 栄養価情報の表示
- 月次カレンダー表示
- 献立のお気に入り登録
- アレルギー代替メニューの提案

### 12.2 データモデルの拡張
- MenuMasterに写真パス追加
- 栄養価テーブルの追加
- AlternativeMenuテーブルの追加

---

## 13. 用語集

| 用語 | 説明 |
|-----|------|
| 献立 | 食事の内容（MenuMaster） |
| アレルゲン | アレルギーを引き起こす物質（AllergenMaster） |
| 午前おやつ | MorningSnack |
| 給食 | Lunch |
| 午後おやつ | AfternoonSnack |
| 頭出し | スクロール位置を特定の要素の先頭に移動すること |
| weekOffset | 本日を含む週からの相対週数（-1=先週、0=今週、1=来週） |

---

## 14. 承認

| 役割 | 氏名 | 承認日 |
|-----|------|--------|
| 要件定義者 | - | 2026/01/03 |
| レビュー担当 | - | - |
| 承認者 | - | - |

---

**変更履歴**:
- 2026/01/03 v1.0 初版作成
